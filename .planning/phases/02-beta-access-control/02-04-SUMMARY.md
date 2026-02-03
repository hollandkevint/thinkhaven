---
phase: 02-beta-access-control
plan: 04
subsystem: verification
tags: [supabase, auth-hooks, beta-access, e2e-testing]

# Dependency graph
requires:
  - phase: 02-01
    provides: beta_access table and custom_access_token_hook function
  - phase: 02-02
    provides: JWT verification utilities and /app/* layout beta gate
  - phase: 02-03
    provides: Waitlist UI (pending page + landing page form)
provides:
  - Fully functional beta access control system
  - Verified end-to-end flow for 100-user beta launch
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [custom-access-token-hook, jwt-claims-verification]

key-files:
  created: []
  modified:
    - apps/web/supabase/migrations/018_fix_beta_trigger_syntax.sql
    - apps/web/supabase/migrations/019_fix_on_auth_user_created.sql

key-decisions:
  - "Multiple trigger syntax fixes required for Supabase PL/pgSQL compatibility"
  - "Custom Access Token Hook requires explicit GRANT EXECUTE permissions"
  - "JWT claims cached ~1 hour; approved users must re-login to get beta_approved=true"

patterns-established:
  - "Supabase trigger debugging via information_schema.triggers"
  - "Verify hook permissions with \\df+ in SQL Editor"

# Metrics
duration: ~60min (debugging + verification)
completed: 2026-02-02
---

# Phase 2 Plan 04: Hook Configuration & Flow Verification Summary

**Enabled Custom Access Token Hook in Supabase, fixed trigger syntax issues, and verified complete beta access flow**

## Performance

- **Duration:** ~60 min (including debugging)
- **Started:** 2026-01-31
- **Completed:** 2026-02-02
- **Tasks:** 2 (human checkpoint + verification)
- **Migrations added:** 2 (018, 019 for trigger fixes)

## Accomplishments

- Enabled Custom Access Token Hook in Supabase Dashboard
- Fixed trigger syntax errors in `on_auth_user_created` function (migrations 018, 019)
- Added GRANT EXECUTE for supabase_auth_admin on custom_access_token_hook
- Verified all 6 end-to-end test scenarios

## Test Results

All 6 verification tests passed:

| Test | Description | Result |
|------|-------------|--------|
| 1 | Waitlist signup (unauthenticated) | ✅ Pass |
| 2 | Waitlist signup (duplicate) | ✅ Pass |
| 3 | New user signup → waitlist flow | ✅ Pass (after migration 018-019 fixes) |
| 4 | Approve user → access granted | ✅ Pass (kevin.holland@holmusk.com, kholland@s2nhealth.com verified) |
| 5 | Direct URL access protection | ✅ Pass (/app/*, /app/session/*, /app/new all redirect to /waitlist) |
| 6 | Logout redirects to /login | ✅ Pass (not /waitlist) |

## Debugging Journey

### Issue 1: Trigger not firing
- **Symptom:** New user signup didn't create beta_access row
- **Root cause:** PL/pgSQL syntax error in trigger function (missing semicolons, wrong variable syntax)
- **Fix:** Migration 018 rewrote `on_auth_user_created` with correct syntax

### Issue 2: Hook not adding claims
- **Symptom:** JWT missing beta_approved claim even for approved users
- **Root cause:** Missing GRANT EXECUTE permission for supabase_auth_admin
- **Fix:** Migration 019 added: `GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin`

### Issue 3: Credits trigger error
- **Symptom:** `ERROR: relation "public.user_credits" does not exist`
- **Root cause:** Legacy trigger `grant_free_credit_on_signup` references non-existent table
- **Fix:** Migration 019 dropped the legacy trigger and function

## Files Created/Modified

- `apps/web/supabase/migrations/018_fix_beta_trigger_syntax.sql` - Fixed trigger function syntax
- `apps/web/supabase/migrations/019_fix_on_auth_user_created.sql` - Fixed trigger permissions, dropped legacy credit trigger

## Decisions Made

- **Re-login requirement:** JWT claims are cached; approved users must log out and back in to get beta_approved=true
- **Legacy cleanup:** Removed grant_free_credit_on_signup trigger (user_credits table was dropped)
- **Hook permissions:** Both authenticator and supabase_auth_admin need EXECUTE permission

## User Setup Completed

- [x] Run migrations 013, 018, 019 in Supabase SQL Editor
- [x] Enable Custom Access Token Hook in Dashboard > Authentication > Hooks
- [x] Set function to `public.custom_access_token_hook`
- [x] Add SUPABASE_JWT_SECRET to local .env (Vercel already had it)

## Phase 2 Success Criteria - COMPLETE

| Criterion | Status |
|-----------|--------|
| Unapproved user sees "you're on the waitlist" page when trying to access /app/* | ✅ |
| Approved user can access /app/* normally | ✅ |
| Landing page has waitlist signup form that creates database entry | ✅ |
| Admin can approve users via Supabase Table Editor (approved_at field) | ✅ |
| JWT contains beta_approved claim after approval (re-login may be required) | ✅ |

## Next Phase Readiness

Phase 2: Beta Access Control is **COMPLETE**.

Ready to proceed to Phase 3: Error/Loading States.

---
*Phase: 02-beta-access-control*
*Completed: 2026-02-02*
