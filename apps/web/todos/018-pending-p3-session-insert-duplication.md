---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, architecture]
dependencies: []
---

# Duplicated Session Insert Logic Across Files

## Problem Statement
The `bmad_sessions` insert columns are specified in three places: `app/new/page.tsx`, `lib/bmad/database.ts`, and `lib/bmad/session-primitives.ts`. If the schema changes, all three must be updated in sync.

## Findings
- **Pattern Recognition**: Three separate insert patterns with slightly different column sets.
- **Simplicity Reviewer**: The `new/page.tsx` client-side insert could call the existing server-side `createSessionRecord()` via an API route instead.

## Proposed Solutions
Consolidate session creation behind a single API route or Server Action that calls `session-primitives.ts`. This also fixes a secondary issue: `message_limit` is client-settable with no DB-level `CHECK` constraint, so a user could set `message_limit: 999999` via browser console. Moving to server-side eliminates client control. As a defense-in-depth, add `CHECK (message_limit BETWEEN 1 AND 100)` to the DB schema.

## Technical Details
- **Files**: `app/app/new/page.tsx`, `lib/bmad/database.ts`, `lib/bmad/session-primitives.ts`
- **DB**: `bmad_sessions.message_limit` lacks a CHECK constraint

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - pattern recognition finding |
