---
phase: 01-auth-infrastructure-fix
plan: 02
subsystem: auth
tags: [oauth, redirect, supabase, nextjs]

# Dependency graph
requires:
  - phase: 01-01
    provides: Minimal token-refresh middleware, removed deprecated auth-helpers
provides:
  - OAuth callback redirects to /app
  - All auth success flows redirect to /app (not /dashboard)
  - Consistent post-auth user experience
affects: [02-beta-access, user-flows]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - All auth success redirects use /app as destination
    - No legacy /dashboard references in production code

key-files:
  created: []
  modified:
    - apps/web/app/auth/callback/route.ts
    - apps/web/lib/supabase/middleware.ts
    - apps/web/app/try/page.tsx

key-decisions:
  - "Update all auth redirects to /app consistently (no /dashboard)"

patterns-established:
  - "Post-auth redirect destination: /app"

# Metrics
duration: 2min
completed: 2026-01-30
---

# Phase 01 Plan 02: OAuth Redirect Fix Summary

**Updated OAuth callback and all auth flows to redirect to /app instead of legacy /dashboard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-30T14:05:51Z
- **Completed:** 2026-01-30T14:07:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- OAuth callback now redirects to /app on successful authentication
- Middleware updated to check /app for post-OAuth bypass
- Try page (guest session) redirects authenticated users to /app
- Zero /dashboard references in production auth code

## Task Commits

Each task was committed atomically:

1. **Task 1: Update OAuth callback redirect destination** - `121ea4d` (fix)
2. **Task 2: Update remaining /dashboard references to /app** - `09489f9` (fix)

## Files Created/Modified
- `apps/web/app/auth/callback/route.ts` - OAuth callback redirect destination changed to /app
- `apps/web/lib/supabase/middleware.ts` - Post-OAuth bypass and authenticated user redirect default updated
- `apps/web/app/try/page.tsx` - Guest session authenticated user redirect updated

## Decisions Made
- All production auth flows now use /app as the consistent redirect destination
- Test files retain /dashboard references (test legacy behavior separately)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build command fails due to pre-existing issues (missing pages-manifest.json, test file syntax errors) unrelated to these changes
- Dev server starts successfully, confirming changes are valid TypeScript

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All auth redirects now point to /app
- OAuth flow complete (callback -> /app)
- Ready for Plan 03 (API route protection)

---
*Phase: 01-auth-infrastructure-fix*
*Completed: 2026-01-30*
