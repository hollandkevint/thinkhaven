# ThinkHaven Beta Launch

## What This Is

Beta-ready version of ThinkHaven for 100 users to gather feedback on whether Mary (AI business analyst) actually helps, willingness to pay, and what's missing. Focus is stability and controlled access, not new features.

## Core Value

100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues so we can collect meaningful feedback.

## Requirements

### Validated

- ✓ Core chat with Mary — existing (works today)
- ✓ New idea pathway conversation flow — existing
- ✓ AI streaming responses — existing
- ✓ Session creation and persistence — existing
- ✓ Basic landing page and /try guest flow — existing

### Active

- [ ] Auth stability (login, logout, session persistence)
- [ ] OAuth working (Google/GitHub)
- [ ] Email verification flow functional
- [ ] Waitlist + manual approval access control
- [ ] Loading states (no blank screens)
- [ ] Error states (clear messages, not crashes)
- [ ] Session recovery (don't lose work on refresh)

### Out of Scope

- New features — not building new capabilities, only fixing what exists
- Canvas/visual workspace — de-prioritized per strategic direction
- Stripe/payments — bypass via LAUNCH_MODE, not activating yet
- Mobile optimization — web-first, mobile later
- Admin dashboard — direct DB access for now
- Sub-persona mode indicator UI — works under hood, skip UI indicator

## Context

**Current State:**
- Auth middleware disabled due to Edge Runtime incompatibility (needs different approach)
- Guest sessions stored in localStorage only (trivially bypassable)
- Known auth issues: login fails, sessions drop, OAuth broken, email verification fails
- LAUNCH_MODE=true bypasses credit system (intentional for beta)
- E2E tests: only 7 smoke tests exist, no auth flow coverage

**Technical Environment:**
- Next.js 15.5, React 19, Supabase auth
- Deployed on Vercel (thinkhaven.co)
- Codebase mapped in .planning/codebase/

**User Research:**
- Target: 100 beta users for feedback
- Timeline: 2 weeks to launch-ready
- Goal: Validate Mary's value, pricing signals, feature gaps

## Constraints

- **Timeline**: 2 weeks to beta-ready
- **Scope**: Fix and polish only, no new features
- **Access Control**: Must have waitlist + manual approval before sharing
- **Auth Provider**: Supabase auth (not switching)
- **Deployment**: Vercel (no changes)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Waitlist + manual approval | Control who gets in, personal touch for feedback | — Pending |
| Skip admin dashboard | Direct DB access sufficient for 100 users | — Pending |
| Keep LAUNCH_MODE=true | Don't activate payments during beta | — Pending |
| Fix auth at API route level | Middleware Edge Runtime incompatible | — Pending |

---
*Last updated: 2026-01-29 after initialization*
