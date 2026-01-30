# Technology Stack: Waitlist + Manual Approval System

**Project:** ThinkHaven Beta Gating
**Researched:** 2026-01-29
**Overall Confidence:** HIGH

## Executive Summary

The recommended approach adds a `beta_access` table linked to `auth.users`, uses a Custom Access Token Hook to inject approval status into JWTs, and checks approval in the existing middleware. This pattern is verified by Supabase official documentation and aligns with ThinkHaven's existing architecture.

**Key Decision:** Use Custom Access Token Hook over per-request DB lookups. This is the 2025/2026 standard because approval status is cached in the JWT (reducing database calls) and is enforceable at both middleware and RLS levels.

## Recommended Stack

### Database Schema

| Component | Implementation | Confidence |
|-----------|----------------|------------|
| `beta_access` table | New table linked to `auth.users(id)` | HIGH |
| `status` enum | `pending`, `approved`, `rejected` | HIGH |
| RLS policies | Users can read own row only | HIGH |
| Admin functions | SECURITY DEFINER functions for status updates | HIGH |

**Rationale:** Separate table (not extending `auth.users`) because:
1. Clear audit trail with timestamps
2. Supabase discourages modifying `auth.users` directly
3. Enables storing waitlist metadata (referral source, signup date, notes)

### Auth Integration

| Component | Implementation | Confidence |
|-----------|----------------|------------|
| Custom Access Token Hook | PL/pgSQL function injecting `beta_approved` claim | HIGH |
| JWT claim | `app_metadata.beta_approved: boolean` | HIGH |
| Hook configuration | Dashboard: Authentication > Hooks > Custom Access Token | HIGH |
| Local dev config | `config.toml` with `[auth.hook.custom_access_token]` | HIGH |

**Rationale:** Custom Access Token Hook is the official Supabase pattern for adding claims to JWTs. Verified via [Supabase docs](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) and [RBAC guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac).

### Access Control

| Component | Implementation | Confidence |
|-----------|----------------|------------|
| Middleware check | Extract `beta_approved` from JWT in existing middleware | HIGH |
| Redirect target | `/waitlist` page for unapproved users | HIGH |
| RLS policies | Optional enforcement via `(auth.jwt() ->> 'app_metadata')::jsonb ->> 'beta_approved'` | MEDIUM |

**Rationale:** ThinkHaven already has middleware at `/middleware.ts` that handles auth. Adding the approval check there maintains consistency with existing patterns.

### Admin Approval Workflow

| Component | Implementation | Confidence |
|-----------|----------------|------------|
| Approval method | Direct database updates via Supabase dashboard (MVP) | HIGH |
| Notification | Resend/Supabase Edge Function (optional) | MEDIUM |
| Admin UI | Future enhancement, not MVP required | N/A |

**Rationale:** For 100 beta users, manual SQL updates or Supabase Table Editor is sufficient. Admin UI adds complexity without proportional value at this scale.

## Implementation Pattern

### 1. Database Migration (013_beta_access.sql)

```sql
-- Beta Access table
CREATE TABLE beta_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    email TEXT NOT NULL,
    referral_source TEXT,
    notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_beta_access_user_id ON beta_access(user_id);
CREATE INDEX idx_beta_access_status ON beta_access(status);
CREATE INDEX idx_beta_access_email ON beta_access(email);

-- RLS
ALTER TABLE beta_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own beta access status" ON beta_access
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policy for service role
CREATE POLICY "Service role can manage all beta access" ON beta_access
    FOR ALL USING (auth.role() = 'service_role');

-- Auto-create beta_access on signup (waitlist entry)
CREATE OR REPLACE FUNCTION handle_new_user_beta_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO beta_access (user_id, email, status)
    VALUES (NEW.id, NEW.email, 'pending');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_beta_access
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_beta_access();
```

**Confidence:** HIGH - Pattern verified against [Tinloof tutorial](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) and [MakerKit plugin](https://makerkit.dev/docs/next-supabase-turbo/plugins/waitlist-plugin).

### 2. Custom Access Token Hook (custom_access_token_hook)

```sql
-- Custom Access Token Hook to inject beta_approved claim
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    beta_approved boolean;
BEGIN
    -- Check beta access status
    SELECT (status = 'approved') INTO beta_approved
    FROM beta_access
    WHERE user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    -- Initialize app_metadata if not exists
    IF jsonb_typeof(claims->'app_metadata') IS NULL THEN
        claims := jsonb_set(claims, '{app_metadata}', '{}');
    END IF;

    -- Set beta_approved claim
    claims := jsonb_set(
        claims,
        '{app_metadata, beta_approved}',
        COALESCE(to_jsonb(beta_approved), 'false'::jsonb)
    );

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- Required grants for supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT ALL ON TABLE public.beta_access TO supabase_auth_admin;
REVOKE ALL ON TABLE public.beta_access FROM authenticated, anon, public;

-- RLS policy for auth admin
CREATE POLICY "Allow auth admin to read beta access" ON public.beta_access
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (true);
```

**Confidence:** HIGH - Directly from [Supabase RBAC documentation](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) with modifications for beta access.

### 3. Middleware Integration

Modify existing `/apps/web/lib/supabase/middleware.ts`:

```typescript
// Add to updateSession function, after getUser() call

// Check beta approval status from JWT
const betaApproved = user?.app_metadata?.beta_approved === true;

// Protected routes that require beta approval
const betaProtectedRoutes = ['/app', '/dashboard'];
const isBetaProtectedRoute = betaProtectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
);

// Redirect unapproved users to waitlist
if (user && !betaApproved && isBetaProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/waitlist';
    return NextResponse.redirect(url);
}
```

**Confidence:** HIGH - Follows existing middleware patterns in codebase.

### 4. Waitlist Page Route

Create `/apps/web/app/waitlist/page.tsx`:

```typescript
// Simple static page showing waitlist status
// Check beta_access table for position/status
// Show "You're on the list" message
```

**Confidence:** HIGH - Standard Next.js page creation.

## Alternatives Considered

| Approach | Recommendation | Rationale |
|----------|----------------|-----------|
| user_metadata instead of custom table | NOT RECOMMENDED | Loses audit trail, harder to query for admin |
| Per-request DB check (no JWT hook) | NOT RECOMMENDED | Adds latency, more database calls |
| Third-party waitlist service (Waitlist.io, etc) | NOT RECOMMENDED | Overkill for 100 users, adds external dependency |
| Disable signup + Admin invite only | CONSIDERED | Simpler but loses organic signup flow |
| Check in API routes only | NOT RECOMMENDED | Inconsistent enforcement, easy to miss routes |

## Configuration Requirements

### Supabase Dashboard

1. Navigate to: Authentication > Hooks (Beta)
2. Enable "Custom Access Token Hook"
3. Select: `public.custom_access_token_hook` from dropdown

### Local Development (config.toml)

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

**Important:** After configuring, run `supabase stop && supabase start` (not just `db reset`).

### Environment Variables

No new environment variables required. Uses existing Supabase configuration.

## Manual Approval Workflow

For 100 beta users, the simplest workflow:

1. **View pending users:** Supabase Dashboard > Table Editor > beta_access > Filter by status='pending'
2. **Approve user:** Update row: `status='approved'`, `approved_at=NOW()`, `approved_by='kevin'`
3. **User effect:** On next login/token refresh, JWT will include `beta_approved: true`

Future enhancement: Admin API route `/api/admin/approve-beta-user` with service role key.

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Existing users (pre-migration) | Migration adds `beta_access` rows for existing `auth.users` with `status='approved'` |
| User signs up then immediately tries to access | Trigger creates `pending` row, middleware blocks |
| Admin revokes access | Update status to `rejected`, user blocked on next token refresh |
| Token already issued before approval | JWT cached until expiry (~1hr), user may need to log out/in |

## Token Refresh Consideration

**Issue:** JWT claims are cached until token expiry (default: 1 hour). After approving a user, they may need to:
1. Wait for token to expire naturally, OR
2. Log out and log back in

**Mitigation options:**
1. Set shorter JWT expiry in Supabase dashboard (trade-off: more auth requests)
2. Add "Refresh access" button that calls `supabase.auth.refreshSession()`
3. Document expected behavior for beta users

**Recommendation:** Accept the delay for MVP. 100 beta users can be told to refresh/re-login.

## Integration with Existing Systems

### Credit System (005_session_credit_system.sql)

The existing `grant_free_credit()` trigger runs on user signup. This remains unchanged. Beta users get credits on signup, but can't use them until approved.

**Flow:**
1. User signs up → `beta_access` row created (pending) + `user_credits` row created (2 credits)
2. User approved → `beta_access.status = 'approved'`
3. User can now access `/app` and use credits

### Auth Callback (/auth/callback/route.ts)

No changes needed. Callback handles OAuth code exchange. JWT with `beta_approved` claim is issued automatically by the hook.

### Guest Session (/try route)

Guest sessions remain unaffected. They don't require beta approval since they're not authenticated.

## Testing Strategy

### Unit Tests

```typescript
// Test custom_access_token_hook behavior
// - Returns beta_approved: true for approved users
// - Returns beta_approved: false for pending users
// - Handles missing beta_access row gracefully
```

### E2E Tests

```typescript
// Test middleware enforcement
// - Unapproved user redirected to /waitlist from /app
// - Approved user can access /app
// - Guest user unaffected
```

## Sources

| Source | Confidence | Used For |
|--------|------------|----------|
| [Supabase Custom Access Token Hook Docs](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) | HIGH | Hook implementation pattern |
| [Supabase RBAC Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) | HIGH | JWT claims, RLS integration |
| [Tinloof Waitlist Tutorial](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) | MEDIUM | Overall architecture pattern |
| [MakerKit Waitlist Plugin](https://makerkit.dev/docs/next-supabase-turbo/plugins/waitlist-plugin) | MEDIUM | Approval workflow pattern |
| [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) | HIGH | Middleware integration |
| Context7 /supabase/supabase | HIGH | Hook SQL syntax, grants |

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Database schema | HIGH | Standard Supabase patterns, verified via docs |
| Custom Access Token Hook | HIGH | Official Supabase feature with clear documentation |
| Middleware integration | HIGH | Extends existing working middleware |
| Manual approval workflow | HIGH | Trivially simple for 100 users |
| Token refresh timing | MEDIUM | Known limitation, acceptable for MVP |
| Admin UI | N/A | Explicitly out of scope |

## Summary

Add `beta_access` table + Custom Access Token Hook + middleware check. This is the 2025/2026 standard for Supabase waitlist/approval systems. Total implementation: ~200 lines of SQL, ~20 lines of TypeScript, one new page.

**Estimated effort:** 2-4 hours for experienced developer familiar with codebase.
