---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, security]
---

# New feedback API route needs IDOR check on session_id

## Problem Statement

The planned feedback API route accepts `session_id` as an optional UUID linking feedback to a session. The RLS policy `INSERT WHERE auth.uid() = user_id` protects the feedback row but does NOT verify the user owns the referenced session. An authenticated user could submit feedback referencing another user's session ID.

Found by: Security sentinel

## Context

- CLAUDE.md: "IDOR checks on every session-scoped handler"
- RLS on `bmad_sessions` already filters by owner, so a Supabase query will return null for non-owned sessions
- The UNIQUE(user_id, session_id) constraint prevents spam

## Acceptance Criteria

- [ ] API route verifies session ownership before inserting feedback with session_id
- [ ] Non-owned session_id returns 404
- [ ] Null session_id bypasses the check (manual feedback without session context)

## References

- Plan: `docs/plans/2026-03-29-feat-product-vision-v2-plan.md` (Sprint A2)
- `app/api/feedback/trial/route.ts` (existing pattern)
