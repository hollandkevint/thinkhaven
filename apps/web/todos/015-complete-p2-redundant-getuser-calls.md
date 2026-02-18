---
status: complete
priority: p2
issue_id: "015"
tags: [code-review, performance]
dependencies: []
---

# Redundant getUser() Calls in Credit Manager

## Problem Statement
Both `hasCredits()` and `deductCredit()` accept `userId` as a parameter but then call `supabase.auth.getUser()` internally to get the email for the admin check. This adds ~50-150ms per call (HTTP to Supabase Auth), and both are called sequentially during session creation, adding ~200ms of pure waste.

## Findings
- **Performance Oracle**: Two redundant auth round-trips per session creation.
- **Architecture Strategist**: The caller already has the user object; threading the email would eliminate these calls.

## Proposed Solutions

### Option A: Accept optional email parameter
- Add `userEmail?: string` param to both functions
- Skip `getUser()` when email is provided
- **Pros**: Backward compatible, minimal change
- **Cons**: Slightly wider API surface
- **Effort**: Small (15 min)
- **Risk**: None

## Technical Details
- **Files**: `lib/monetization/credit-manager.ts:90,130`

## Acceptance Criteria
- [ ] `hasCredits()` and `deductCredit()` accept optional email
- [ ] No `getUser()` call when email is provided
- [ ] Admin bypass still works correctly

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - performance oracle finding |
