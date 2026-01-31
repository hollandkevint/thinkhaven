---
phase: 02-beta-access-control
plan: 01
subsystem: database
tags: [supabase, jwt, postgres, rls, auth-hooks]

# Dependency graph
requires:
  - phase: 01-auth-infrastructure-fix
    provides: Working auth infrastructure with getUser() validation
provides:
  - beta_access table for waitlist/approval tracking
  - custom_access_token_hook function for JWT claims
  - jose library for server-side JWT verification
affects: [02-02, 02-03, 02-04]

# Tech tracking
tech-stack:
  added: [jose@6.1.3]
  patterns: [custom-access-token-hook, jwt-claims-injection]

key-files:
  created:
    - apps/web/supabase/migrations/013_beta_access.sql
  modified:
    - apps/web/package.json

key-decisions:
  - "NULL approved_at = pending, timestamp = approved (no separate status column)"
  - "ON CONFLICT handles both new signups and waitlist-to-account linking"
  - "jose v6 for Edge Runtime compatibility (not jsonwebtoken)"

patterns-established:
  - "Custom Access Token Hook: Configure in Dashboard > Authentication > Hooks"
  - "beta_approved claim injected into all JWTs for approved users"

# Metrics
duration: 1min
completed: 2026-01-30
---

# Phase 2 Plan 01: Database Foundation Summary

**beta_access table with custom_access_token_hook for JWT beta_approved claim injection, plus jose library for server-side verification**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-31T00:48:35Z
- **Completed:** 2026-01-31T00:49:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created beta_access table with user_id, email, approval tracking columns
- Implemented custom_access_token_hook function for Supabase Auth
- Added auto-signup trigger to link waitlist entries to new accounts
- Installed jose library for JWT verification in API routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create beta_access database migration** - `4414789` (feat)
2. **Task 2: Install jose library for JWT verification** - `e4267ba` (chore)

## Files Created/Modified

- `apps/web/supabase/migrations/013_beta_access.sql` - Beta access table, indexes, RLS, trigger, custom access token hook
- `apps/web/package.json` - Added jose@6.1.3 dependency

## Decisions Made

- **NULL vs boolean for approval:** Using NULL approved_at for pending, timestamp for approved. Simpler than separate status column.
- **jose over jsonwebtoken:** jose works in Edge Runtime, jsonwebtoken has CommonJS issues.
- **ON CONFLICT strategy:** Handles race between waitlist signup and account creation gracefully.

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**Migration must be run manually in Supabase Dashboard:**

1. Go to SQL Editor in Supabase Dashboard
2. Run the migration: `apps/web/supabase/migrations/013_beta_access.sql`
3. Configure Custom Access Token Hook:
   - Go to Authentication > Hooks
   - Enable "Custom Access Token Hook"
   - Select function: `public.custom_access_token_hook`

## Next Phase Readiness

- Database schema ready for beta access control
- jose library available for JWT verification in Plan 02
- Custom Access Token Hook ready to inject claims (needs Dashboard configuration)

---
*Phase: 02-beta-access-control*
*Completed: 2026-01-30*
