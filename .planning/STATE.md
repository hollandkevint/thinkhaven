# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** 100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues
**Current focus:** Phase 2 - Beta Access Control

## Current Position

Phase: 2 of 4 (Beta Access Control)
Plan: 4 of 4 in current phase
Status: In progress
Last activity: 2026-01-31 — Completed 02-02-PLAN.md (beta access gate)

Progress: [███████░░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 2.0 min
- Total execution time: 0.23 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth Fix | 4 | 8min | 2.0min |
| 2. Beta Access | 3 | 6min | 2.0min |
| 3. Error/Loading | 0 | 0 | - |
| 4. Analytics | 0 | 0 | - |

**Recent Trend:**
- Last 5 plans: 01-04 (3min), 02-01 (1min), 02-03 (3min), 02-02 (2min)
- Trend: Beta access gate complete, /app/* routes now protected

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Waitlist + manual approval for 100-user beta (skip admin dashboard)
- Fix auth at API route level (middleware Edge Runtime incompatible)
- Keep LAUNCH_MODE=true (no payments during beta)
- [01-01] Zero redirect logic in middleware (all route protection in API routes)
- [01-01] Use getUser() for JWT validation (not getSession() which only validates locally)
- [01-03] Verified all API routes already use getUser() - no changes needed
- [01-02] All auth success redirects use /app (not /dashboard)
- [01-03] GuestSessionStore.getSession() is custom localStorage method, not Supabase auth
- [01-04] All 7 AUTH requirements verified via manual testing (email/password, OAuth, logout, session)
- [02-01] NULL approved_at = pending, timestamp = approved (no separate status column)
- [02-01] jose v6 for JWT verification (Edge Runtime compatible)
- [02-03] Components go in /components/ not /app/components/ to match @/ alias
- [02-02] getSession() safe when followed by jose JWT verification
- [02-02] Server component pattern for instant redirects (no loading flicker)

### Pending Todos

- ~~Run migration 013_beta_access.sql~~ (done via `supabase db push`)
- ~~Configure Custom Access Token Hook~~ (done in dashboard)
- Complete manual verification tests (02-04-PLAN.md, Task 2)

### Blockers/Concerns

- [Resolved] @supabase/auth-helpers-nextjs deprecated — removed in 01-01
- [Resolved] Auth middleware disabled — minimal token-refresh middleware created in 01-01
- [Resolved] getSession() security risk — verified all files use getUser() in 01-03
- [Research] JWT claims cached ~1 hour — approved users may need re-login

## Session Continuity

Last session: 2026-01-31
Stopped at: Ran Playwright tests (13/14 pass), verified beta gate via curl
Resume file: None
Note: Awaiting manual verification of complete beta access flow (Tests 1-6 in 02-04-PLAN.md). Dev server running at localhost:3000.
