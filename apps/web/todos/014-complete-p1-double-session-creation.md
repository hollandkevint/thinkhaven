---
status: complete
priority: p1
issue_id: "014"
tags: [code-review, performance, correctness]
dependencies: []
---

# Double Session Creation in React Strict Mode

## Problem Statement
`app/app/new/page.tsx` creates a session in a `useEffect` with no guard against double-firing. React 18 Strict Mode remounts components in dev, causing two `bmad_sessions` rows per click. In production, if `useAuth()` returns a new `user` object reference, `useCallback` identity changes, the effect re-fires, and a duplicate session is created.

## Findings
- **Performance Oracle**: P1 correctness bug. Creates duplicate DB rows and redirects to whichever resolves last.
- **TypeScript Reviewer**: Confirmed the `useCallback` depends on `[user, router]` and any reference change re-triggers.
- **Architecture Strategist**: Client-side insert also skips credit deduction entirely. Users can create unlimited sessions without spending credits. CLAUDE.md pitfall #9 says "Use session-primitives.ts functions, not direct Supabase calls."

## Proposed Solutions

### Option A: useRef guard (recommended)
- Add `creatingRef = useRef(false)`, check before insert, reset only in catch block
- **Pros**: Minimal change, idiomatic React pattern
- **Cons**: None
- **Effort**: Small (5 min)
- **Risk**: None

### Option B: Use server action for session creation
- Move the insert to a server action, redirect from server
- **Pros**: Eliminates client-side timing issues entirely
- **Cons**: Larger refactor
- **Effort**: Medium
- **Risk**: Low

## Recommended Action
Option A. Add the ref guard.

## Technical Details
- **Files**: `app/app/new/page.tsx:24-70`

## Acceptance Criteria
- [ ] Only one session created per click on "New Session"
- [ ] Works correctly in React Strict Mode (dev)
- [ ] Retry button still works after an error

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - performance oracle finding |
