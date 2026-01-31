---
phase: 02-beta-access-control
plan: 02
subsystem: auth
tags: [jwt, jose, beta-access, server-components]

# Dependency graph
requires:
  - phase: 02-01
    provides: beta_access table with approved_at column, jose v6 installed
provides:
  - Server-side JWT verification using jose
  - Beta access check utility for /app/* routes
  - Protected app layout redirecting unapproved users to /waitlist
affects: [02-03, 02-04, future-app-routes]

# Tech tracking
tech-stack:
  added: []  # jose already installed in 02-01
  patterns:
    - Server component auth gating (no 'use client' in layout)
    - JWT claim extraction for beta_approved status
    - Structured result types (BetaAccessResult)

key-files:
  created:
    - apps/web/lib/auth/jwt-verify.ts
    - apps/web/lib/auth/beta-access.ts
  modified:
    - apps/web/app/app/layout.tsx

key-decisions:
  - "getSession() is safe here because we verify JWT signature with jose afterward"
  - "Return null on verification failure (don't throw) for simpler error handling"
  - "Server component redirects are instant (no loading state needed)"

patterns-established:
  - "Beta gating via server component: checkBetaAccess() in layout.tsx"
  - "JWT verification pattern: verifyJwt(token) returns typed payload or null"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 02 Plan 02: Beta Access Gate Summary

**Server-side JWT verification with jose library, beta access check utility, and protected app layout redirecting unapproved users to /waitlist**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-31T00:54:04Z
- **Completed:** 2026-01-31T00:56:19Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created JWT verification utility using jose (Edge Runtime compatible)
- Built beta access check combining session retrieval with JWT validation
- Converted /app/* layout from client to server component with beta gate
- Unapproved users now redirected to /waitlist before any HTML is sent

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JWT verification utility** - `2d38b4f` (feat)
2. **Task 2: Create beta access check utility** - `c197628` (feat)
3. **Task 3: Convert app layout to server component** - `d33ad56` (feat)

## Files Created/Modified
- `apps/web/lib/auth/jwt-verify.ts` - JWT verification using jose with typed payload
- `apps/web/lib/auth/beta-access.ts` - Combines session + JWT verification for beta status
- `apps/web/app/app/layout.tsx` - Server component with beta gate (was client component)

## Decisions Made
- Used getSession() to get access_token, then verify with jose (getUser() doesn't expose raw token)
- Structured BetaAccessResult type with user/betaApproved/error for clear error handling
- Server component pattern for instant redirects (no loading flicker)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** From plan 02-01-USER-SETUP.md:
- SUPABASE_JWT_SECRET environment variable must be set
- Custom Access Token Hook must be configured in Supabase Dashboard

## Next Phase Readiness
- Beta access gate is now active on all /app/* routes
- Unapproved users redirected to /waitlist
- Approved users can access /app/* normally
- Note: JWT claims cached ~1 hour, approved users may need re-login to get new claims

---
*Phase: 02-beta-access-control*
*Completed: 2026-01-31*
