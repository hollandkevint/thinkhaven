---
status: pending
priority: p1
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, security]
---

# Trial feedback API route uses caller-supplied user_id in INSERT

## Problem Statement

`app/api/feedback/trial/route.ts:52-71` checks `payload.userId !== user.id` and returns 403 on mismatch, but then uses `payload.userId` for the INSERT instead of `user.id`. This violates the project convention: "SECURITY DEFINER RPCs must not accept caller-supplied user_id (use auth.uid() directly)."

The check-then-use pattern is fragile. If someone refactors the validation or reorders the code, the caller-supplied ID goes straight to the database.

Found by: Security sentinel

## Context

- CLAUDE.md explicitly documents this convention
- Migration 026 already fixed `increment_message_count` to use `auth.uid()` directly
- This is the same class of bug

## Acceptance Criteria

- [ ] INSERT uses `user.id` from `getUser()`, not `payload.userId`
- [ ] `userId` removed from the request payload schema
- [ ] No regression in feedback submission flow

## References

- `app/api/feedback/trial/route.ts` lines 52-71
- CLAUDE.md pitfall about SECURITY DEFINER RPCs
