---
status: complete
priority: p1
issue_id: "013"
tags: [code-review, security]
dependencies: []
---

# Hardcoded Test Admin Password in Source Control

## Problem Statement
`tests/e2e/smoke/auth-session.spec.ts` line 4 contains the plaintext password for `test-admin@thinkhaven.co`, which is also in the `ADMIN_EMAILS` list. Anyone with repo read access gets full admin privileges (unlimited credits, unlimited messages, beta gate bypass).

## Findings
- **Security Sentinel**: HIGH severity. Real production password committed to source.
- **Pattern Recognition**: Confirmed the email is in `ADMIN_EMAILS` array, creating a full exploit chain.

## Proposed Solutions

### Option A: Move credentials to env vars
- Replace hardcoded values with `process.env.TEST_ADMIN_EMAIL` and `process.env.TEST_ADMIN_PASSWORD`
- Add to CI secrets and `.env.local`
- **Pros**: Simple, standard pattern
- **Cons**: Tests won't work without env setup
- **Effort**: Small
- **Risk**: Low

### Option B: Remove test-admin from ADMIN_EMAILS in production
- Keep it only as a CI env var for admin list
- **Pros**: Eliminates the exploit chain entirely
- **Cons**: More complex env var management
- **Effort**: Medium
- **Risk**: Low

## Recommended Action
Option A (move to env vars) + rotate the password immediately.

## Technical Details
- **Files**: `tests/e2e/smoke/auth-session.spec.ts:4`, `lib/auth/admin.ts:1`
- **Components**: E2E test suite, admin bypass system

## Acceptance Criteria
- [ ] No plaintext passwords in committed code
- [ ] Tests still pass in CI with secrets configured
- [ ] Password rotated for test-admin@thinkhaven.co

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review of admin bypass commits |
