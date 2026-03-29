---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, data-integrity]
---

# UNIQUE(user_id, session_id) allows duplicates when session_id is NULL

## Problem Statement

SQL `UNIQUE` constraints treat NULL != NULL, so `UNIQUE(user_id, session_id)` won't prevent a user from submitting multiple manual feedbacks with `session_id = NULL`. This may or may not be desired.

Found by: Data integrity analysis of migration 028

## Context

- Manual feedback (from sidebar/header button) has no session context
- A user could submit unlimited manual feedback
- This is likely acceptable at current scale but worth documenting the decision

## Acceptance Criteria

- [ ] Decide: allow multiple NULL-session feedbacks per user (current behavior) or add application-level rate limiting
- [ ] Document the decision in the migration comment

## Notes

If rate limiting is desired, options: (1) partial unique index `WHERE session_id IS NULL` on `(user_id, source)`, or (2) application-level check in the API route.

## References

- Migration 028 in the plan
