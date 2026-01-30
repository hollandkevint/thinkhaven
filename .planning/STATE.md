# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** 100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues
**Current focus:** Phase 1 - Auth Infrastructure Fix

## Current Position

Phase: 2 of 4 (Beta Access Control)
Plan: 0 of ? in current phase (not yet planned)
Status: Phase 2 ready to plan
Last activity: 2026-01-30 — Phase 1 complete, dashboard button fix committed

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 2.0 min
- Total execution time: 0.13 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Auth Fix | 4 | 8min | 2.0min |
| 2. Beta Access | 0 | 0 | - |
| 3. Error/Loading | 0 | 0 | - |
| 4. Analytics | 0 | 0 | - |

**Recent Trend:**
- Last 5 plans: 01-01 (2min), 01-02 (2min), 01-03 (1min), 01-04 (3min)
- Trend: Phase 1 complete with all auth flows verified

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Resolved] @supabase/auth-helpers-nextjs deprecated — removed in 01-01
- [Resolved] Auth middleware disabled — minimal token-refresh middleware created in 01-01
- [Resolved] getSession() security risk — verified all files use getUser() in 01-03
- [Research] JWT claims cached ~1 hour — approved users may need re-login

## Session Continuity

Last session: 2026-01-30
Stopped at: Phase 1 complete, fixed dashboard button visibility issue
Resume file: None
Note: Dashboard buttons were invisible due to CSS var misuse; fixed with Tailwind classes
