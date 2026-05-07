---
date: 2026-04-28
last_updated: 2026-05-07
topic: auth-supabase-beta-sharing
focus: authentication, Supabase connection, and sharing with beta users
mode: repo-grounded
scratch_run: /tmp/compound-engineering/ce-ideate/7d3a9f21
---

# Ideation: Auth, Supabase Connection, and Beta Sharing

## Resume Note

This artifact was resumed from the April 28, 2026 ideation run. The previous top ideas were all still marked `Unexplored`, so this update preserves the same local artifact and refreshes the ranking rather than creating a duplicate.

Previously explored territory:

- Beta Access Control Center
- Supabase Auth Guard Alignment
- Beta Invite and Approval Loop
- Guest-to-Beta Conversion Bridge
- Durable Auth/Beta Telemetry
- Supabase Connection Readiness Check
- Shareable Beta Session Snapshot

The refresh keeps the strongest cluster but tightens it around a complete beta operations workflow: operate access, approve and invite, route users correctly, use `/try` as the default share path, persist support signals, and verify the end-to-end beta day before inviting real users.

## Grounding Context

### Codebase Context

ThinkHaven is a Next.js app in `apps/web/` using Supabase Auth, Supabase Postgres, Vercel, Stripe, and a protected `/app/*` surface. `apps/web/app/app/layout.tsx` calls `checkBetaAccess()` and redirects unauthenticated users to `/login` and authenticated-but-unapproved users to `/waitlist`.

The beta data model exists but the operator workflow is still mostly manual:

- `apps/web/supabase/migrations/013_beta_access.sql` creates `beta_access` with `email`, `user_id`, `created_at`, `approved_at`, `approved_by`, and `source`.
- `apps/web/supabase/migrations/014_beta_access_email_unique.sql` adds email uniqueness.
- `apps/web/supabase/migrations/015_fix_beta_access_trigger.sql` and `016_fix_beta_access_trigger_v2.sql` make signup linking defensive so beta-access failures do not block account creation.
- `apps/web/supabase/migrations/017_fix_custom_access_token_hook.sql` fixes the custom access-token hook that injects `beta_approved`.
- `apps/web/components/waitlist/WaitlistForm.tsx` inserts pending waitlist rows directly into `beta_access`.
- There are no normal update/delete RLS policies for `beta_access`; the migration comments say admin operations use the service role through Supabase Table Editor.

The auth and redirect path is split across several surfaces:

- `apps/web/lib/auth/beta-access.ts` creates a server Supabase client, calls `supabase.auth.getSession()`, verifies the JWT locally, checks `beta_approved`, allows admin email bypass, then falls back to `beta_access`.
- `apps/web/app/auth/callback/route.ts` exchanges OAuth codes and redirects successful users to `/app`.
- `apps/web/app/try/page.tsx` redirects authenticated users to `/app` after attempting guest-session migration.
- `apps/web/app/waitlist/page.tsx` is static copy and does not show the signed-in user's waitlist row, linked-account status, or approval state.

The guest path is real and should be treated as part of beta sharing:

- `/try` gives unauthenticated users 10 free messages.
- `apps/web/app/components/guest/SignupPromptModal.tsx` routes high-intent guests to `/signup?from=guest`.
- `apps/web/lib/guest/session-migration.ts` persists up to 10 guest messages into a new authenticated session after signup/sign-in.

Auth monitoring exists but is not durable enough for beta operations:

- `apps/web/lib/monitoring/auth-logger.ts` logs structured auth events and forwards them to an in-process collector.
- `apps/web/lib/monitoring/auth-metrics.ts` stores events in memory and browser `localStorage`.
- `apps/web/app/api/monitoring/auth-metrics/route.ts` exposes metrics to admins, but its response says data is based on client-side logged events.
- `docs/monitoring/auth-slis-slos.md` defines auth SLOs that are more durable and operational than the current event store.

Recent repo activity has focused on product polish, onboarding clarity, dashboard/session shells, and feedback prompts. That makes beta entry and support clarity more important than broad new product surfaces.

### Past Learnings

Relevant institutional patterns and pitfalls:

- `AGENTS.md` warns that Supabase server clients can return `null` when env vars are missing and callers must null-check.
- `AGENTS.md` warns client components must not import server-only modules.
- `AGENTS.md` says admin bypass checks must run before rate limiting.
- `docs/solutions/patterns/individual/pattern-10-atomic-state-transitions.md` argues that multi-step lifecycle changes need atomic scripts/actions to avoid drift.
- `docs/solutions/patterns/individual/pattern-06-persistence-over-conversation.md` argues that actionable workflow outputs need durable records.
- `docs/solutions/patterns/individual/pattern-23-mandatory-instrumentation.md` reinforces that important workflows need instrumentation by default.
- `docs/solutions/patterns/individual/pattern-32-reusable-auth-guards.md` supports central auth guard patterns instead of scattered checks.
- `docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md` warns against PII in logs, redundant auth calls, unsafe admin checks, and type assertions around auth data.
- `docs/technical-debt/oauth-test-infrastructure-failures.md` distinguishes production OAuth behavior from brittle OAuth E2E infrastructure, so beta readiness should not rely only on broad OAuth smoke tests.

### External Context

Supabase's current SSR docs recommend cookie-backed browser/server clients via `@supabase/ssr`. They also say server-side page/data protection should use `supabase.auth.getClaims()` rather than trusting server-side `getSession()`, because `getClaims()` validates token claims against Supabase's signing keys. Source: [Supabase SSR client docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).

Supabase custom access-token hooks can add claims such as `beta_approved`, but returned claims must preserve required access-token fields, and the hook needs careful permissions for `supabase_auth_admin`. Source: [Supabase Custom Access Token Hook docs](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) and [Supabase Auth Hooks docs](https://supabase.com/docs/guides/auth/auth-hooks).

Supabase Auth email delivery is a beta-sharing dependency. The default Supabase mailer is limited and not intended for production outreach; production invite/signup flows need custom SMTP or a Send Email Hook. Source: [Supabase Custom SMTP docs](https://supabase.com/docs/guides/auth/auth-smtp) and [Supabase Send Email Hook docs](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook).

Supabase supports anonymous users and later identity linking, which could eventually replace localStorage-only guest sessions with a server-backed anonymous-user path. That option requires RLS care because anonymous users still use the authenticated database role. Source: [Supabase Anonymous Sign-Ins docs](https://supabase.com/docs/guides/auth/auth-anonymous) and [Supabase Identity Linking docs](https://supabase.com/docs/guides/auth/auth-identity-linking).

## Ranked Ideas

### 1. Beta Access Control Center

**Description:** Build a small admin-only beta ops surface for pending, approved, invited, signed-in, first-app-access, revoked, and stuck-at-gate users. It should answer the operator questions that currently require database spelunking: who is waiting, who is approved, who got an invite, who has signed in, who hit the gate, and who needs help.

**Warrant:** `direct:` `apps/web/supabase/migrations/013_beta_access.sql` creates the beta lifecycle row and says admin operations use the service role through Supabase Table Editor; `apps/web/components/waitlist/WaitlistForm.tsx` already inserts real pending rows.

**Rationale:** The data model exists, but the product still lacks the workflow that lets one operator run a gated beta safely. This is the highest-leverage starting point because approval, invite, support lookup, and status recovery all need the same admin boundary.

**Downsides:** Needs service-role-safe server routes/actions, explicit admin checks, audit logging, and careful UI scope. It should stay an operations console, not grow into a CRM.

**Confidence:** 94%

**Complexity:** Medium

**Status:** Unexplored

### 2. Beta Invite and Approval Loop

**Description:** Treat approval as one atomic operator action: set `approved_at`, record `approved_by`, update invite status, and generate the correct next share path. The first version can support manual send/copy; email automation can follow once delivery is configured.

**Warrant:** `direct:` `beta_access` has approval fields but no invite lifecycle; `docs/solutions/patterns/individual/pattern-10-atomic-state-transitions.md` warns that manual multi-step state transitions drift; `external:` Supabase production auth email delivery requires custom SMTP or a Send Email Hook.

**Rationale:** "Approved" is not the user-facing moment. Beta sharing is complete only when approval produces a clear invitation and the invite status is visible to the operator.

**Downsides:** Requires decisions about invite links, resend behavior, expiration, copy, and email-provider setup. Avoid building a full lifecycle engine before the manual loop works.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 3. Approval-Aware Auth and Redirect Contract

**Description:** Consolidate auth and beta decisions into a single server-only contract used by protected layouts, route handlers, OAuth callback follow-up, signup, `/try`, and `/waitlist`. The contract should return typed outcomes such as unauthenticated, pending, approved, admin, stale-claim-but-approved, and auth unavailable, then route users accordingly.

**Warrant:** `direct:` `apps/web/app/auth/callback/route.ts` redirects OAuth success to `/app`; `apps/web/app/try/page.tsx` redirects authenticated users to `/app`; `apps/web/app/app/layout.tsx` redirects unapproved users to `/waitlist`; `apps/web/lib/auth/beta-access.ts` still starts with server-side `getSession()`. `external:` Supabase's current SSR docs say to use `getClaims()` for server protection rather than trusting server-side `getSession()`.

**Rationale:** The beta workflow can be logically correct in the database and still feel broken if users bounce through confusing redirects or stale-claim states. A typed contract turns those branches into product states instead of incidental redirects.

**Downsides:** Needs careful migration around middleware/session refresh, the OAuth callback, and existing route handlers. This should be a narrow guard/contract refactor, not a full auth rewrite.

**Confidence:** 89%

**Complexity:** Medium

**Status:** Unexplored

### 4. Guest-to-Beta Entry Path

**Description:** Make `/try` the default beta share path for new prospects, then bridge high-intent guests into signup, waitlist, and approval without losing their session. The operator should be able to see that a pending person came from a guest session, without exposing raw conversation content by default.

**Warrant:** `direct:` `/try` gives unauthenticated users 10 free messages; `SignupPromptModal` routes guests to `/signup?from=guest`; `SessionMigration` persists guest messages after authentication. `reasoned:` prospects understand ThinkHaven more clearly after a working strategic session than after a cold account gate.

**Rationale:** This flips sharing from "create an account and wait" to "experience the value, then claim/save it." It keeps the beta gate but makes the first touch product-led.

**Downsides:** Copy must make clear that signup does not automatically mean approval. Supabase anonymous users and identity linking are a promising later variant, but they add RLS/account-lifecycle complexity and should not block the first guest-to-beta loop.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 5. Durable Beta Event Ledger and Support Lookup

**Description:** Persist sanitized beta/auth lifecycle events and expose a small admin lookup for one person: waitlist row, linked auth user, approval/invite state, latest auth failures, guest migration status, first app access, and suggested next action.

**Warrant:** `direct:` `apps/web/lib/monitoring/auth-metrics.ts` stores events in memory and localStorage; `docs/monitoring/auth-slis-slos.md` defines auth SLOs; `docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md` warns against PII in logs.

**Rationale:** Early beta support will fail in small, person-specific ways: invite not received, wrong email, stale claim, OAuth callback failure, guest session not saved. Durable, privacy-aware events make those cases debuggable instead of anecdotal.

**Downsides:** Needs retention, privacy, and admin visibility rules. The first scope should be beta operations and support, not broad product analytics.

**Confidence:** 83%

**Complexity:** Medium

**Status:** Unexplored

### 6. Supabase and Beta Readiness Drill

**Description:** Add a pre-invite readiness script/checklist and a fake beta-day drill: join waitlist, approve, invite, receive email, sign up via email and OAuth, pass the beta gate, use `/try`, migrate a guest session, revoke access, and debug one intentionally stuck user.

**Warrant:** `direct:` migrations 015-017 exist because signup and the custom access-token hook had concrete failure modes; `docs/technical-debt/oauth-test-infrastructure-failures.md` says production OAuth behavior and OAuth test infrastructure can diverge. `external:` Supabase's current docs add explicit expectations around SSR auth validation, hook permissions, and production email delivery.

**Rationale:** Beta readiness is a cross-surface workflow property. A drill forces the product to prove that Supabase configuration, app redirects, email delivery, claims, database rows, and support lookup all work together.

**Downsides:** Some checks require service-role credentials or production-only configuration, so the drill needs clear local/staging/production boundaries.

**Confidence:** 80%

**Complexity:** Low-Medium

**Status:** Unexplored

### 7. Waitlist Status and Recovery Surface

**Description:** Turn `/waitlist` into a status-aware recovery page for signed-in pending users. Show the joined email, account-link state, pending/approved status, "invite not received" recovery path, and support contact; for unauthenticated users, keep it as a simple waitlist confirmation.

**Warrant:** `direct:` `apps/web/app/waitlist/page.tsx` is static copy; `beta_access` already stores `email`, `user_id`, `created_at`, and `approved_at`; `apps/web/app/app/layout.tsx` sends unapproved authenticated users there.

**Rationale:** The waitlist page is where confused beta users land. It should reduce support load by explaining the user's actual state instead of giving generic copy.

**Downsides:** Needs server-side data loading and careful language so users do not interpret a linked account as approval.

**Confidence:** 78%

**Complexity:** Low-Medium

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Approval-aware redirect as a UI-only task | Folded into Approval-Aware Auth and Redirect Contract; redirects need auth-state semantics, not just copy. |
| 2 | Invite delivery readiness as a standalone project | Folded into Beta Invite and Approval Loop plus the Readiness Drill. |
| 3 | Beta support console as a separate app | Folded into Durable Beta Event Ledger and Support Lookup. |
| 4 | Remove manual claim debugging | Folded into Approval-Aware Auth and Redirect Contract. |
| 5 | One-link beta share | Folded into Guest-to-Beta Entry Path and Beta Invite and Approval Loop. |
| 6 | Approval queue from guest intent | Folded into Beta Access Control Center as a queue signal. |
| 7 | Anonymous Supabase guest users | Promising later variant, but too much RLS/account-lifecycle work before the current guest-to-beta loop is validated. |
| 8 | Beta access as entitlement | Useful architecture framing, but better as an implementation lens for the control center and auth contract. |
| 9 | Beta cohorts | Useful later operating rhythm; lower first-pass value than approval, invite, and support visibility. |
| 10 | Admin-safe service role boundary | Required implementation prerequisite for beta operations, not a standalone product idea. |
| 11 | Beta lifecycle status enum | Useful if lifecycle grows; premature as a separate top idea before the workflow exists. |
| 12 | Auth guard contract tests | Folded into the Readiness Drill and auth-contract implementation scope. |
| 13 | Beta ops runbook | Folded into the Readiness Drill. |
| 14 | Airport boarding model | Helpful analogy, but too metaphor-heavy as a recommendation. |
| 15 | Clinic intake model | Interesting analogy, but risks overbuilding triage. |
| 16 | Feature flag targeting model | Good implementation pattern, folded into beta-entitlement framing. |
| 17 | Helpdesk ticket model | Folded into support lookup; too much if built literally. |
| 18 | Zero-admin open beta | Subject replacement; fights the current gated-beta model. |
| 19 | Concierge-only beta | Go-to-market variant, not a distinct product improvement. |
| 20 | No account until value | Strong but riskier extension of `/try`; defer until guest-to-beta is validated. |
| 21 | No JWT claim | Valid technical alternative, but less pragmatic than aligning the guard first. |
| 22 | Shareable redacted session snapshot | Valuable later, but lower priority than making beta entry and support work. |

## Recommended Next Brainstorm

Start with **Beta Access Control Center + Beta Invite and Approval Loop** as one scoped brainstorm. Together they form the smallest complete operator workflow: see pending people, approve them, create the invitation moment, and know whether they reached the app.

Treat **Approval-Aware Auth and Redirect Contract** as the technical prerequisite that should be shaped in parallel or immediately after the workflow is defined. It keeps the beta experience from failing through stale claims, generic redirects, and unclear waitlist states.

## Checkpoints

- Raw candidates: `/tmp/compound-engineering/ce-ideate/7d3a9f21/raw-candidates.md`
- Survivors: `/tmp/compound-engineering/ce-ideate/7d3a9f21/survivors.md`
