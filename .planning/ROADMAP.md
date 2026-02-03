# Roadmap: ThinkHaven Beta Launch

## Overview

Fix authentication issues, implement waitlist-based access control, add error/loading states, and set up basic analytics. The goal is 100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues. No new features — this is a fix-and-polish milestone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Auth Infrastructure Fix** - Fix broken authentication so users can log in reliably
- [x] **Phase 2: Beta Access Control** - Gate access via waitlist + manual approval
- [x] **Phase 3: Error/Loading States** - No blank screens, clear error messages, retry options
- [ ] **Phase 4: Feedback/Analytics** - Track signups, sessions, and messages for beta validation

## Phase Details

### Phase 1: Auth Infrastructure Fix
**Goal**: Users can reliably authenticate with email/password and OAuth
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can log in with email/password and stay logged in across browser refresh
  2. User can log in with Google OAuth and access the app
  3. User can log out from any page and is redirected to landing
  4. OAuth callback redirects to /app (not legacy /dashboard)
  5. No "session expired" errors during normal usage
**Plans**: 4 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Remove deprecated package, create minimal token-refresh middleware
- [x] 01-02-PLAN.md — Fix OAuth callback to redirect to /app (not /dashboard)
- [x] 01-03-PLAN.md — Replace getSession() with getUser() in all server code
- [x] 01-04-PLAN.md — End-to-end auth verification (human checkpoint)

### Phase 2: Beta Access Control
**Goal**: Only approved waitlist users can access /app/* routes
**Depends on**: Phase 1 (auth must work before gating)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06
**Success Criteria** (what must be TRUE):
  1. Unapproved user sees "you're on the waitlist" page when trying to access /app/*
  2. Approved user can access /app/* normally
  3. Landing page has waitlist signup form that creates database entry
  4. Admin can approve users via Supabase Table Editor (approved_at field)
  5. JWT contains beta_approved claim after approval (re-login may be required)
**Plans**: 4 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md — Database migration (beta_access table, hook function) + jose install
- [x] 02-02-PLAN.md — JWT verification utilities + /app/* layout beta gate
- [x] 02-03-PLAN.md — Waitlist UI (pending page + landing page form)
- [x] 02-04-PLAN.md — Enable hook in Supabase + verify complete flow (checkpoint)

### Phase 3: Error/Loading States
**Goal**: No blank screens — every async state has visual feedback
**Depends on**: Phase 1 (auth errors are common case)
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. All async operations (chat, session load, login) show loading spinners
  2. All errors show clear message explaining what went wrong
  3. Failed operations show retry button for recovery
  4. Navigating to any route shows content within 2 seconds (loading or real)
**Plans**: 1 plan (parallel worktrees)

Plans:
- [x] 03-01-PLAN.md — Loading skeletons, error states, chat retry (parallel worktrees)

### Phase 4: Feedback/Analytics
**Goal**: Track core user actions for beta validation
**Depends on**: Phase 2 (need approved users to track)
**Requirements**: FEED-01
**Success Criteria** (what must be TRUE):
  1. User signup events are tracked with timestamp and source
  2. Session start events are tracked with pathway type
  3. Message count per session is tracked
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Infrastructure Fix | 4/4 | Complete | 2026-01-30 |
| 2. Beta Access Control | 4/4 | Complete | 2026-02-02 |
| 3. Error/Loading States | 1/1 | Complete | 2026-02-02 |
| 4. Feedback/Analytics | 0/? | Not started | - |

---
*Roadmap created: 2026-01-30*
*Coverage: 18/18 v1 requirements mapped*
