# Project Research Summary

**Project:** ThinkHaven Beta Launch - 100 User Access Gating
**Domain:** SaaS Beta Access Control
**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

ThinkHaven needs a waitlist + manual approval system to control beta access for 100 users. Research reveals the standard 2025/2026 pattern: use a `beta_access` table linked to `auth.users`, implement a Custom Access Token Hook to inject approval status into JWTs, and check this claim in middleware for enforcement. This approach is verified by official Supabase documentation and handles the core problem (access control) without over-engineering for scale.

However, this fix depends on solving ThinkHaven's existing authentication issues. The app currently has disabled middleware, which means session tokens never refresh, leading to dropped sessions and OAuth failures. The architectural fix requires re-enabling minimal middleware (token refresh only, no redirect logic), updating all server-side code to use `getUser()` instead of `getSession()`, and fixing the OAuth callback to properly set cookies. Without these auth fixes, the beta access system won't work reliably.

The critical risk is survivorship bias during beta validation. Without proactive tracking of churned users and exit interviews, you'll only hear from the 20% who stayed, leading to false product-market fit signals. Combine this with error states that kill trust on first use, and you could waste the entire beta period collecting unusable feedback.

## Key Findings

### Recommended Stack

The Supabase Custom Access Token Hook pattern is the 2025/2026 standard for beta access control because approval status is cached in the JWT (reducing database lookups) and is enforceable at both middleware and RLS levels. This approach requires ~200 lines of SQL and ~20 lines of TypeScript.

**Core technologies:**

- **Custom Access Token Hook (PL/pgSQL)**: Injects `beta_approved` claim into JWT at auth time — recommended because it eliminates per-request database checks and works with both middleware and RLS enforcement
- **Minimal Middleware Pattern**: Token refresh via `getUser()` only, no redirects — fixes existing ThinkHaven auth issues and enables JWT claim enforcement
- **beta_access table**: Separate table (not extending `auth.users`) for approval status tracking — enables audit trail, waitlist metadata, and admin workflow
- **Supabase Dashboard admin workflow**: Manual approval via Table Editor for 100 users — simpler than building admin UI, adequate for beta scale

**Critical dependency:** Remove `@supabase/auth-helpers-nextjs` package (deprecated, conflicts with `@supabase/ssr`). ThinkHaven currently has this installed, which causes cookie race conditions.

### Expected Features

For a 100-user beta, the table stakes are minimal: waitlist signup form, approval storage, access gate enforcement, and clear messaging to waitlisted users. Missing any of these makes the product feel broken or unprofessional.

**Must have (table stakes):**
- Waitlist signup form on landing page (email capture)
- Waitlist storage in database (`beta_access` table)
- Manual approval workflow (Supabase dashboard sufficient)
- Access gate that blocks unapproved users from `/app` routes
- Approval notification email ("you're in")
- Clear "you're on the waitlist" messaging after signup

**Should have (competitive):**
- Exit surveys for churned users (highest value feedback)
- In-app feedback at key moments (after first session, after document generation)
- Error tracking with context (user ID, session state, last action)
- Basic analytics (session start, Mary response, document export)

**Defer (v2+):**
- Admin dashboard UI (Supabase Table Editor works for 100 users)
- Waitlist position display (creates anxiety without benefit at this scale)
- Referral system (growth feature, not beta feature)
- Automated approval emails (manual copy-paste is fine for 100)
- Analytics dashboards (can export raw data for analysis)

### Architecture Approach

ThinkHaven's auth architecture has three critical flaws: disabled middleware means no token refresh, using `getSession()` instead of `getUser()` creates security vulnerabilities, and OAuth callbacks may not propagate cookies properly. The fix doesn't require complex middleware - implement a minimal refresh-only middleware pattern (the 2025/2026 Supabase standard) and enforce auth at the route level.

**Major components:**

1. **Minimal Middleware** — Calls `supabase.auth.getUser()` to refresh tokens and set cookies, NO redirect logic to avoid redirect loops
2. **beta_access table + Custom Access Token Hook** — Database stores approval status, hook injects `beta_approved: boolean` into JWT `app_metadata`
3. **Route-level protection** — Each protected API route and Server Component checks `user?.app_metadata?.beta_approved`, redirects to `/waitlist` if false
4. **OAuth callback fix** — Ensures `exchangeCodeForSession()` properly sets cookies via `setAll()`, redirects to `/app` not `/dashboard`
5. **Email verification route** — New `/auth/confirm` route handles `token_hash` format (requires updating Supabase email template)

**Anti-patterns to avoid:**
- Using `getSession()` in server contexts (security vulnerability)
- Middleware with redirect logic (creates redirect loops)
- Route prefetching immediately after auth (causes flash of wrong UI)

### Critical Pitfalls

The top three pitfalls that will kill the beta launch if not addressed:

1. **Authentication breaks under real users** — Corporate firewalls block Supabase email domain, email tracking pixels rewrite verification links, OAuth providers reject callbacks. Prevention: Configure custom SMTP provider (not Supabase default), test full auth flow with 3+ email providers before launch, create fallback auth for enterprise users.

2. **No access control = public beta chaos** — Anyone can sign up, bots pollute data, competitors reverse-engineer prompts, API costs spike. Prevention: Implement invite-only access via `beta_access` table BEFORE first users, rate limit signups (5/day per IP), test with non-whitelisted email.

3. **Survivorship bias skews validation** — Only engaged users give feedback while 80% churn silently, leading to false product-market fit. Prevention: Track non-responders separately, proactively interview 3+ churned users, measure engagement before asking satisfaction questions.

**Moderate pitfalls:**
- Error states that kill trust (users see white screen, assume product is broken, never return)
- Scope creep from feature requests (beta extends indefinitely, original hypothesis never tested)
- Missing analytics (can't validate hypotheses, flying blind on user behavior)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes fixing broken auth first (beta access won't work without it), then implementing access control before inviting any users, then collecting structured feedback during validation.

### Phase 1: Auth Infrastructure Fix
**Rationale:** Beta access system depends on working auth. Current middleware is disabled, causing session drops and OAuth failures. Must fix before adding access control layer.

**Delivers:**
- Minimal middleware for token refresh (Pattern 1 from ARCHITECTURE.md)
- Updated server client with async cookies
- Fixed OAuth callback with proper cookie setting
- Email verification route (`/auth/confirm`)
- All API routes using `getUser()` instead of `getSession()`

**Addresses:**
- Fixes "Login Fails" issue (ARCHITECTURE.md Issue 1)
- Fixes "Sessions Drop" issue (ARCHITECTURE.md Issue 2)
- Fixes "OAuth Broken" issue (ARCHITECTURE.md Issue 3)
- Mitigates email deliverability issues (PITFALLS.md #8)

**Avoids:**
- Authentication breaks under real users (PITFALLS.md #1 - critical)
- Security vulnerabilities from `getSession()` usage
- Redirect loops from middleware redirect logic

### Phase 2: Beta Access Control
**Rationale:** With auth working, add the access control layer. Implement before inviting any users to prevent public beta chaos.

**Delivers:**
- `beta_access` table schema (013_beta_access.sql)
- Custom Access Token Hook for JWT claims
- Middleware check for `beta_approved` claim
- `/waitlist` page for unapproved users
- Auto-create `beta_access` row on signup trigger

**Uses:**
- Supabase Custom Access Token Hook (STACK.md primary recommendation)
- Minimal middleware from Phase 1 (enables JWT claim checking)
- RLS policies for beta_access table

**Implements:**
- Access gate enforcement (FEATURES.md table stakes #4)
- Waitlist storage (FEATURES.md table stakes #2)

**Avoids:**
- No access control = public beta chaos (PITFALLS.md #2 - critical)
- API abuse and cost spikes
- Data pollution from non-target users

### Phase 3: Feedback Infrastructure
**Rationale:** Before inviting users, set up mechanisms to collect useful feedback and avoid survivorship bias.

**Delivers:**
- In-app feedback prompts at key moments (after first Mary session, after document generation)
- Exit survey for churned users
- Analytics tracking for core events (session start, Mary response, document export)
- Error tracking with user context
- Behavior tracking separate from stated preferences

**Addresses:**
- Collecting feedback nobody will act on (PITFALLS.md #3)
- Survivorship bias skews validation (PITFALLS.md #4)
- Missing analytics = flying blind (PITFALLS.md #7)

**Avoids:**
- Wasted beta period with no actionable insights
- False product-market fit signals from only engaged users
- Can't prioritize fixes without behavior data

### Phase 4: Polish & Error Handling
**Rationale:** Before first user invites, ensure every error state has a recovery path to prevent single bad experience from losing users forever.

**Delivers:**
- Error handling for all async operations (API calls, auth flows, document generation)
- Loading states for everything async
- Error logging with context (user ID, session state, last action)
- Test coverage for unhappy paths (network failure, timeout, invalid input)
- Mobile viewport check or explicit "desktop only" messaging

**Addresses:**
- Error states that kill trust (PITFALLS.md #5)
- Mobile viewport breaks (PITFALLS.md #9)

**Avoids:**
- Users hitting bugs, seeing white screen, never returning
- Support load spikes during beta
- Can't diagnose what went wrong without context

### Phase 5: User Invites & Validation
**Rationale:** With infrastructure solid, invite users in waves to test validation hypotheses while maintaining control.

**Delivers:**
- Wave 1: 10 users (tight feedback loop)
- Wave 2: 30 users (test scaling)
- Wave 3: 60 users (reach 100 total)
- Manual approval workflow via Supabase dashboard
- Approval notification emails (manual initially)

**Addresses:**
- Manual approval workflow (FEATURES.md table stakes #3)
- Approval notification (FEATURES.md table stakes #5)
- Clear messaging to waitlisted users (FEATURES.md table stakes #6)

**Avoids:**
- Scope creep from feature requests (time-box beta, document "not in beta")
- Inviting all 100 at once (can't iterate based on early feedback)

### Phase Ordering Rationale

- **Auth first because beta access depends on it:** The `beta_approved` JWT claim requires working middleware and OAuth callbacks. Fixing broken auth unblocks everything else.
- **Access control before any users:** Prevents public beta chaos and API abuse from day 1. Can't retroactively add gatekeeping.
- **Feedback infrastructure before invites:** Can't go back and capture dropped user behavior. Analytics and exit surveys must exist when first users sign up.
- **Error handling before invites:** First impressions matter. A single white screen error loses trust forever.
- **Phased invites for iteration:** 10 → 30 → 60 allows testing hypotheses and fixing issues before full beta.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1 (Auth Fix):** Email provider configuration needs research on Resend/SendGrid setup, SPF/DKIM records. Standard pattern but has deployment gotchas.
- **Phase 3 (Feedback):** Analytics tool selection (Mixpanel vs Amplitude vs PostHog) needs evaluation against privacy requirements.

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Beta Access):** Custom Access Token Hook is well-documented by Supabase, verified pattern
- **Phase 4 (Polish):** Error handling is standard React/Next.js patterns
- **Phase 5 (Invites):** Manual approval via Supabase dashboard, no technical complexity

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Custom Access Token Hook verified via official Supabase docs, multiple community confirmations |
| Features | HIGH | Table stakes identified from beta launch best practices, deferred features validated against 100-user scale |
| Architecture | MEDIUM-HIGH | Patterns verified against official docs, but ThinkHaven-specific implementation needs testing |
| Pitfalls | MEDIUM | Survivorship bias and auth breaks are well-documented, but specific impact on ThinkHaven is inferred |

**Overall confidence:** HIGH

### Gaps to Address

**Token refresh timing:** JWT claims cached for ~1 hour after approval. Approved users may need to log out/log in to see access. Acceptable for beta (can document behavior), but needs user communication plan.

**Email deliverability testing:** Research identifies corporate firewall issues but doesn't specify which email providers work best. Needs testing with Gmail, Outlook, corporate email before launch.

**Feedback question design:** Research says "ask specific questions" but doesn't provide templates. Need to craft questions tied to validation hypotheses (e.g., "Did Mary challenge any assumptions?").

**Deprecated package removal:** ThinkHaven has `@supabase/auth-helpers-nextjs` installed (deprecated). Must remove before auth fixes or cookie race conditions will persist.

**RLS policy verification:** Research assumes RLS is correctly configured, but ThinkHaven-specific policies need audit. Check in Supabase dashboard before launch.

## Sources

### Primary (HIGH confidence)
- [Supabase: Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) — Hook implementation pattern
- [Supabase: RBAC with Custom Claims](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) — JWT claims, RLS integration
- [Supabase: Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — Minimal middleware pattern
- [Supabase: Creating SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — Server client with cookies
- [Supabase: exchangeCodeForSession API](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession) — OAuth callback

### Secondary (MEDIUM confidence)
- [Tinloof: Waitlist with Supabase and Next.js](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) — Overall architecture pattern
- [MakerKit: Waitlist Plugin](https://makerkit.dev/docs/next-supabase-turbo/plugins/waitlist-plugin) — Approval workflow pattern
- [BetaTesting Blog: Top 5 Beta Testing Mistakes](https://blog.betatesting.com/2025/04/28/top-5-mistakes-companies-make-in-beta-testing-and-how-to-avoid-them/) — Survivorship bias, feedback collection
- [GitHub Issue: AuthSessionMissingError](https://github.com/supabase/ssr/issues/107) — Middleware token refresh pattern
- [Medium: Avoiding Survivorship Bias in PM](https://medium.com/@falkgottlob/how-to-avoid-survivorship-bias-in-product-management-lessons-from-the-british-bomber-study-25edb8ab4ab7) — Beta validation risks

### Tertiary (LOW confidence)
- [LivePlan: SaaS Beta Launch](https://www.liveplan.com/blog/starting/saas-beta-launch) — General beta launch principles
- [Instabug: Beta Launch Checklist](https://www.instabug.com/blog/beta-launch-checklist) — Feature prioritization

---
*Research completed: 2026-01-29*
*Ready for roadmap: yes*
