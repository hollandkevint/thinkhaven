# Requirements: ThinkHaven Beta Launch

**Defined:** 2026-01-29
**Core Value:** 100 users can reliably sign up via waitlist, get approved, and use Mary without auth issues

## v1 Requirements

Requirements for beta launch. Each maps to roadmap phases.

### Authentication Fix

- [ ] **AUTH-01**: Remove deprecated `@supabase/auth-helpers-nextjs` package and migrate to `@supabase/ssr`
- [ ] **AUTH-02**: Create minimal middleware.ts that refreshes Supabase session tokens
- [ ] **AUTH-03**: Replace all `getSession()` calls with `getUser()` in API routes for security
- [ ] **AUTH-04**: Fix OAuth callback route to redirect to `/app` instead of legacy `/dashboard`
- [ ] **AUTH-05**: User can log in with email/password and stay logged in across browser refresh
- [ ] **AUTH-06**: User can log in with Google OAuth and access the app
- [ ] **AUTH-07**: User can log out from any page

### Beta Access Control

- [ ] **GATE-01**: Create `beta_access` table with RLS policies for approval tracking
- [ ] **GATE-02**: Implement Custom Access Token Hook to inject `beta_approved` claim into JWT
- [ ] **GATE-03**: Middleware blocks unapproved users from `/app/*` routes
- [ ] **GATE-04**: Unapproved users see waitlist pending page with "you're on the list" message
- [ ] **GATE-05**: Landing page has waitlist signup form that creates `beta_access` row
- [ ] **GATE-06**: Admin can approve users by setting `approved_at` in Supabase Table Editor

### Error/Loading States

- [ ] **UX-01**: All async operations show loading states (spinners/skeletons)
- [ ] **UX-02**: All errors show clear messages explaining what went wrong
- [ ] **UX-03**: Failed operations show retry buttons for recovery
- [ ] **UX-04**: No blank screens — always show meaningful content or loading state

### Feedback Collection

- [ ] **FEED-01**: Basic analytics tracking: user signups, session starts, message counts

## v2 Requirements

Deferred to after beta feedback. Tracked but not in current roadmap.

### Email Polish

- **EMAIL-01**: Custom SMTP provider for better deliverability (SendGrid/Resend)
- **EMAIL-02**: Email verification flow works reliably
- **EMAIL-03**: Approval notification email sent when user is approved

### Enhanced Feedback

- **FEED-02**: In-app feedback widget
- **FEED-03**: Exit survey when hitting message limit
- **FEED-04**: Way to contact churned users

### Nice-to-Have Access Control

- **GATE-07**: Capture additional waitlist fields (company, use case)
- **GATE-08**: Admin dashboard for user management

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New AI features | Fix-only milestone, no new capabilities |
| Canvas/visual workspace | De-prioritized per strategic direction |
| Stripe/payments activation | LAUNCH_MODE bypass for beta |
| Mobile optimization | Web-first for beta |
| Admin dashboard | Direct DB access sufficient for 100 users |
| Sub-persona mode UI indicator | Works under hood, skip UI |
| Automatic approval rules | Manual approval is fine for 100 users |
| Real-time waitlist position | Over-engineering for beta scale |
| Tiered waitlist / priority access | Unnecessary complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| GATE-01 | Phase 2 | Pending |
| GATE-02 | Phase 2 | Pending |
| GATE-03 | Phase 2 | Pending |
| GATE-04 | Phase 2 | Pending |
| GATE-05 | Phase 2 | Pending |
| GATE-06 | Phase 2 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 3 | Pending |
| FEED-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
