# Roadmap: ThinkHaven Beta Launch

## Overview

Fix authentication issues, implement waitlist-based access control, add error/loading states, and set up basic analytics. The goal is 100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues. No new features — this is a fix-and-polish milestone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Auth Infrastructure Fix** - Fix broken authentication so users can log in reliably
- [ ] **Phase 2: Beta Access Control** - Gate access via waitlist + manual approval
- [ ] **Phase 3: Error/Loading States** - No blank screens, clear error messages, retry options
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
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Error/Loading States
**Goal**: No blank screens — every async state has visual feedback
**Depends on**: Phase 1 (auth errors are common case)
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. All async operations (chat, session load, login) show loading spinners
  2. All errors show clear message explaining what went wrong
  3. Failed operations show retry button for recovery
  4. Navigating to any route shows content within 2 seconds (loading or real)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

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
| 1. Auth Infrastructure Fix | 0/? | Not started | - |
| 2. Beta Access Control | 0/? | Not started | - |
| 3. Error/Loading States | 0/? | Not started | - |
| 4. Feedback/Analytics | 0/? | Not started | - |

---
*Roadmap created: 2026-01-30*
*Coverage: 18/18 v1 requirements mapped*
