---
status: complete
priority: p2
issue_id: "016"
tags: [code-review, security]
dependencies: []
---

# PII (User Email) Logged in Chat Stream

## Problem Statement
`app/api/chat/stream/route.ts:213` logs `userEmail: user.email` on every chat request. In a production logging pipeline, this creates PII storage under GDPR/CCPA. The `userId` alone is sufficient for debugging.

## Findings
- **Security Sentinel**: LOW severity compliance concern.
- **Pattern Recognition**: Previous commit already removed email from admin bypass log at line 353, but missed line 213.

## Proposed Solutions
Remove `userEmail` from the log output at line 213.

## Technical Details
- **Files**: `app/api/chat/stream/route.ts:211-215`

## Acceptance Criteria
- [ ] No `user.email` in console.log statements in route.ts

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - security sentinel finding |
