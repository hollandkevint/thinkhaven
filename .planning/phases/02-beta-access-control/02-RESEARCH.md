# Phase 2: Beta Access Control - Research

**Researched:** 2026-01-30
**Domain:** Supabase Auth Hooks, JWT Claims, Next.js Route Protection
**Confidence:** HIGH

## Summary

Beta access control requires three interconnected systems: (1) a `beta_access` table to track waitlist signups and approval status, (2) a Custom Access Token Hook to inject `beta_approved` claim into JWTs, and (3) route-level gating that checks the JWT claim before allowing access to `/app/*` routes.

The critical constraint from Phase 1 decisions is that **middleware cannot contain redirect logic**. Route protection must happen at the API route and page component level, not in middleware. The middleware only refreshes tokens. This aligns with Supabase's current recommendation since `getUser()` doesn't return the access token, making direct JWT claim reading in middleware complex.

The recommended approach uses a two-layer strategy: middleware for token refresh only (already established in Phase 1), and a server-side utility function that verifies the JWT and extracts the `beta_approved` claim. This utility can be called in API routes and server components.

**Primary recommendation:** Use Supabase Custom Access Token Hook to inject `beta_approved` claim, then create a `checkBetaAccess()` utility that verifies the JWT using the `jose` library to read the claim. Call this utility in the `/app/*` layout and protected API routes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jose` | ^5.x | JWT verification in Edge/server contexts | Edge-compatible, no Node.js dependencies, recommended by Supabase community |
| `@supabase/ssr` | ^0.7.0 | Already in project | Server-side Supabase client |
| Supabase Auth Hook | N/A | Custom Access Token Hook | Official Supabase feature (Free tier) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jwtDecode` (jwt-decode) | ^4.x | Client-side JWT decode (no verification) | Display beta status in UI without server roundtrip |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JWT claim approach | Database query on every request | Slower, more DB load, but simpler to implement |
| Custom access token hook | Trigger + app_metadata update | More complex, requires user refresh to see changes |
| jose for verification | @tsndr/cloudflare-worker-jwt | jose is more widely used and maintained |

**Installation:**
```bash
npm install jose
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── lib/
│   └── auth/
│       ├── AuthContext.tsx       # Existing - add beta status
│       ├── beta-access.ts        # NEW: checkBetaAccess() utility
│       └── jwt-verify.ts         # NEW: JWT verification with jose
├── app/
│   ├── app/
│   │   └── layout.tsx            # MODIFY: Add beta access check
│   ├── waitlist/
│   │   └── page.tsx              # NEW: "You're on the waitlist" page
│   └── page.tsx                  # MODIFY: Add waitlist form
└── supabase/
    └── migrations/
        └── 013_beta_access.sql   # NEW: Table + trigger + hook function
```

### Pattern 1: Custom Access Token Hook
**What:** PostgreSQL function that runs before every token issuance, adding custom claims
**When to use:** When you need claims available in JWT without database lookups
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  claims jsonb;
  is_approved boolean;
begin
  -- Get current claims
  claims := event->'claims';

  -- Check beta_access table for approval status
  select (approved_at is not null) into is_approved
  from public.beta_access
  where user_id = (event->>'user_id')::uuid;

  -- Add beta_approved claim (default false if not found)
  claims := jsonb_set(claims, '{beta_approved}', to_jsonb(coalesce(is_approved, false)));

  -- Return modified event
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Grant to supabase_auth_admin (required)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Revoke from public roles (security requirement)
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

### Pattern 2: JWT Verification with jose
**What:** Server-side JWT verification to extract custom claims
**When to use:** In API routes and server components where you need to read JWT claims
**Example:**
```typescript
// Source: https://github.com/supabase/supabase/issues/28000
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';

interface BetaClaims {
  beta_approved: boolean;
  sub: string;
  email?: string;
}

export async function checkBetaAccess(): Promise<{
  user: { id: string; email?: string } | null;
  betaApproved: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get session (contains access_token)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { user: null, betaApproved: false, error: 'No session' };
  }

  // Verify and decode JWT
  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

  try {
    const { payload } = await jwtVerify(session.access_token, secret);
    const claims = payload as unknown as BetaClaims;

    return {
      user: { id: claims.sub, email: claims.email },
      betaApproved: claims.beta_approved === true,
      error: null
    };
  } catch (err) {
    return { user: null, betaApproved: false, error: 'Invalid token' };
  }
}
```

### Pattern 3: Route-Level Protection (NOT Middleware)
**What:** Check beta access in page/layout server components or API routes
**When to use:** Per Phase 1 decision - no redirect logic in middleware
**Example:**
```typescript
// app/app/layout.tsx (Server Component)
import { redirect } from 'next/navigation';
import { checkBetaAccess } from '@/lib/auth/beta-access';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, betaApproved, error } = await checkBetaAccess();

  if (!user || error) {
    redirect('/login?redirect=' + encodeURIComponent('/app'));
  }

  if (!betaApproved) {
    redirect('/waitlist');
  }

  return <>{children}</>;
}
```

### Anti-Patterns to Avoid
- **Database query on every /app/* request:** Use JWT claim instead - it's already validated by Supabase
- **Checking beta_approved in client-side code only:** Can be bypassed; server must verify
- **Storing approval in app_metadata via API:** Requires service role key in client, security risk
- **Using getSession() without JWT verification:** Session can be spoofed; always verify JWT signature

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification | Custom signature check | `jose` library | Crypto is hard; jose handles Edge compatibility |
| Claim injection | Manual token modification | Supabase Custom Access Token Hook | Official, secure, maintains token integrity |
| Waitlist form | Custom API endpoint | Direct Supabase insert with RLS | Less code, RLS handles authorization |
| Email to admin on signup | Custom notification system | Supabase database webhook or trigger | For MVP, manual Table Editor approval is sufficient |

**Key insight:** Supabase Auth Hooks exist specifically for this use case. The hook runs automatically on every token issuance (login, refresh) and handles the complexity of JWT manipulation. Don't try to modify JWTs yourself.

## Common Pitfalls

### Pitfall 1: Hook Function Timeout
**What goes wrong:** Hook takes >2 seconds and fails, breaking authentication
**Why it happens:** Complex queries, missing indexes, or external API calls in hook
**How to avoid:** Keep hook logic simple - single indexed table lookup
**Warning signs:** Intermittent auth failures, "hook timeout" in Supabase logs

### Pitfall 2: Forgetting Security Grants
**What goes wrong:** Hook doesn't execute, no custom claims appear
**Why it happens:** Missing `GRANT EXECUTE` to `supabase_auth_admin` or didn't revoke from public roles
**How to avoid:** Always include grant/revoke statements in migration
**Warning signs:** Claims missing from JWT, hook not appearing in logs

### Pitfall 3: Stale JWT After Approval
**What goes wrong:** Admin approves user but they still can't access /app/*
**Why it happens:** JWT only refreshes on login or token expiry (default 1 hour)
**How to avoid:** Document that user may need to log out/in, or manually refresh token
**Warning signs:** User reports "still seeing waitlist page after approval"

### Pitfall 4: Client-Side Only Beta Check
**What goes wrong:** Users bypass beta gate by directly navigating to URLs
**Why it happens:** Only checking beta_approved in client component, not server
**How to avoid:** Always check in server component or API route first
**Warning signs:** Beta users accessing pages they shouldn't see

### Pitfall 5: Missing Environment Variable
**What goes wrong:** JWT verification fails in production
**Why it happens:** `SUPABASE_JWT_SECRET` not set in Vercel
**How to avoid:** Add to Vercel env vars before deployment
**Warning signs:** All beta checks fail with "Invalid token"

### Pitfall 6: Using getSession() for Security Decisions
**What goes wrong:** Security bypass possible
**Why it happens:** `getSession()` only validates JWT format locally, not signature
**How to avoid:** Use `jose.jwtVerify()` which validates signature cryptographically
**Warning signs:** Supabase docs explicitly warn about this pattern

## Code Examples

### Database Migration (013_beta_access.sql)
```sql
-- Source: Official Supabase patterns
-- ============================================================================
-- TABLE: beta_access
-- ============================================================================

create table public.beta_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  email text not null,
  created_at timestamptz default now() not null,
  approved_at timestamptz,  -- NULL = not approved, timestamp = approved
  approved_by text,         -- Admin identifier for audit
  source text default 'landing_page'  -- 'landing_page', 'manual', 'import'
);

-- Indexes
create index idx_beta_access_user_id on public.beta_access(user_id);
create index idx_beta_access_email on public.beta_access(email);
create index idx_beta_access_approved on public.beta_access(approved_at) where approved_at is not null;

-- RLS
alter table public.beta_access enable row level security;

-- Users can view their own record
create policy "Users can view own beta_access" on public.beta_access
  for select using (auth.uid() = user_id);

-- Anyone can insert (for waitlist signup before auth)
create policy "Anyone can join waitlist" on public.beta_access
  for insert with check (true);

-- Only service role can update (admin approval via Table Editor)
-- No policy needed - Table Editor uses service role

-- ============================================================================
-- FUNCTION: Auto-create beta_access on signup
-- ============================================================================

create or replace function public.handle_new_user_beta_access()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.beta_access (user_id, email, source)
  values (new.id, new.email, 'signup')
  on conflict (user_id) do update
    set user_id = new.id;  -- Link existing waitlist entry to user
  return new;
end;
$$;

create trigger on_auth_user_created_beta
  after insert on auth.users
  for each row
  execute function public.handle_new_user_beta_access();

-- ============================================================================
-- FUNCTION: Custom Access Token Hook
-- ============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  claims jsonb;
  is_approved boolean;
begin
  claims := event->'claims';

  select (approved_at is not null) into is_approved
  from public.beta_access
  where user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(claims, '{beta_approved}', to_jsonb(coalesce(is_approved, false)));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Security grants (REQUIRED)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Grant beta_access read to supabase_auth_admin for the hook
grant select on public.beta_access to supabase_auth_admin;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.beta_access is 'Tracks waitlist signups and beta approval status';
comment on column public.beta_access.approved_at is 'NULL = pending, timestamp = approved. Admin sets via Table Editor';
comment on function public.custom_access_token_hook(jsonb) is 'Injects beta_approved claim into JWT. Enable in Auth > Hooks';
```

### Waitlist Signup Form Component
```typescript
// Source: Adapted from https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const { error } = await supabase
      .from('beta_access')
      .insert({ email, source: 'landing_page' });

    if (error) {
      if (error.code === '23505') { // Unique violation
        setStatus('success');
        setMessage("You're already on the list!");
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    } else {
      setStatus('success');
      setMessage("You're on the list! We'll email you when your spot opens up.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={status === 'loading' || status === 'success'}
        className="flex-1 px-4 py-2 border rounded-lg"
      />
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
      {message && (
        <p className={status === 'error' ? 'text-red-600' : 'text-green-600'}>
          {message}
        </p>
      )}
    </form>
  );
}
```

### Waitlist Pending Page
```typescript
// app/waitlist/page.tsx
export default function WaitlistPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md text-center p-8">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-4">You're on the waitlist!</h1>
        <p className="text-gray-600 mb-6">
          Thanks for signing up for ThinkHaven beta. We're letting people in
          gradually to ensure everyone gets a great experience.
        </p>
        <p className="text-gray-600 mb-6">
          We'll email you at <strong>your email</strong> when your spot opens up.
        </p>
        <div className="text-sm text-gray-500">
          Questions? Email kevin@kevintholland.com
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store roles in app_metadata | Use Custom Access Token Hook | 2024 | Hooks are cleaner, don't require service role |
| Check database on every request | JWT claims | Always recommended | Better performance, less DB load |
| jsonwebtoken library | jose library | 2023 | jose works on Edge, jsonwebtoken doesn't |
| Middleware redirects | Route-level checks | Phase 1 decision | Avoids Edge Runtime issues |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr` (Phase 1 removes this)
- Storing approval in `app_metadata` directly: Use auth hook instead
- Using `getSession()` for security decisions: Use JWT verification

## Open Questions

1. **Token refresh timing after approval**
   - What we know: JWT refreshes on login or expiry (1hr default)
   - What's unclear: Should we force a token refresh after admin approves?
   - Recommendation: Document that re-login may be required; this is acceptable for manual 100-user beta

2. **Admin notification on waitlist signup**
   - What we know: No automated notification in MVP scope
   - What's unclear: How will admin know to check Table Editor?
   - Recommendation: Add Supabase webhook to email kevin@ on new beta_access row (post-MVP)

3. **Handling existing users**
   - What we know: Trigger creates beta_access on signup
   - What's unclear: What about users who signed up before this migration?
   - Recommendation: Create migration script to backfill existing auth.users into beta_access

## Sources

### Primary (HIGH confidence)
- [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) - Function signature, grant requirements, claim structure
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) - All hooks overview, local dev config, 2-second timeout
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Authorize function pattern, RLS integration
- [jose npm](https://www.npmjs.com/package/jose) - JWT verification library, Edge compatible

### Secondary (MEDIUM confidence)
- [GitHub Issue #28000 - Custom Claims in Middleware](https://github.com/supabase/supabase/issues/28000) - getSession + jwtVerify pattern recommended by maintainers
- [Tinloof Waitlist Tutorial](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) - Database schema, trigger pattern
- [MakerKit Waitlist Plugin](https://makerkit.dev/docs/next-supabase-turbo/plugins/waitlist-plugin) - Alternative approach reference

### Tertiary (LOW confidence)
- Various Medium articles on Next.js JWT middleware - Patterns generally align but not officially verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs + jose is well-documented
- Architecture: HIGH - Follows Phase 1 decisions, official Supabase patterns
- Pitfalls: MEDIUM - Based on GitHub issues and community reports

**Research date:** 2026-01-30
**Valid until:** 60 days (Supabase auth hooks are stable feature)

---
*Phase research complete. Ready for planning.*
