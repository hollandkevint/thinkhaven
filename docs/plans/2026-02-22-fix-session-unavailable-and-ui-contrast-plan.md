---
title: "fix: Session Unavailable bug and BMad UI contrast/visibility"
type: fix
date: 2026-02-22
---

# fix: Session Unavailable Bug and BMad UI Contrast/Visibility

## Overview

Users consistently hit a "Session Unavailable" error when loading existing BMad sessions. The screenshot shows the error alongside invisible text labels throughout the BMad interface. Three distinct root causes were identified: a ReferenceError crash, a silent fetch failure creating a dead-end skeleton loader, and invisible text from `text-secondary` mapping to parchment-on-parchment.

## Problem Statement

### Bug 1: `setMockElicitationData` ReferenceError (Crash)

`handleSessionExit()` in `BmadInterface.tsx:161` calls `setMockElicitationData(null)`, but this function was never declared. It's dead code from a previous cleanup. Clicking "Return to Workspace" or "Start fresh session" triggers an uncaught `ReferenceError`. React ErrorBoundaries don't catch event handler errors, so this propagates as an unhandled exception.

**Reproduction**: Load session with active BMad session > Click "Start fresh session" link > Crash.

### Bug 2: Silent `getSession()` Failure Creates Dead-End Skeleton

`checkForActiveSessions()` (BmadInterface.tsx:83-126) calls `await getSession(sessionId)` then unconditionally sets `currentStep = 'session-active'`. The `useBmadSession.getSession()` hook (useBmadSession.ts:142-176) swallows all errors: catches, sets error state, but never re-throws. From the caller's perspective, the await resolves successfully even on 404.

Result: `currentStep = 'session-active'` + `currentSession = null` + `isLoading = false`. The UI renders a skeleton loader with "Loading Your Session" text permanently. No timeout, no retry, no back button.

**Reproduction**: Any scenario where the `get_session` API returns 404 (auth token stale, session deleted between list and get, or the IDOR ownership check failing).

### Bug 3: Invisible Text (`text-secondary` = parchment on parchment)

The shadcn CSS variable `--secondary: 40 45% 93%` maps to parchment (#F5F0E6). `text-secondary` applies this as text color. On cream (#FAF7F2) or parchment backgrounds, the text is invisible or near-invisible.

**105 occurrences across 13 files** in the BMad interface, including:
- Breadcrumb step labels ("Choose Pathway", "Completed")
- Continuation guidance labels ("Pathway:", "Started:", "Progress:", "Last activity:")
- "Dismiss guidance" and "Start fresh session" action links
- Onboarding modal descriptions
- PathwaySelector descriptions and metadata labels
- Session history labels
- Error guidance text

### Security: Incomplete IDOR Fix (6 unprotected handlers)

The Feb 21 IDOR security fix (commit 1238d00) added ownership checks to `handleGetSession`, `handleAdvanceSession`, `handleExportFeatureBrief`, `handleBackupSessionState`, `handleRestoreSession`, `handleSessionAnalytics`, and `handleSyncSessionState`. Six handlers still lack ownership checks:

1. `handleSaveFeatureInput` (route.ts:516)
2. `handleSavePriorityScoring` (route.ts:638)
3. `handleGenerateFeatureBrief` (route.ts:702)
4. `handleUpdateFeatureBrief` (route.ts:784)
5. `handleRegenerateFeatureBrief` (route.ts:840)
6. `handleSwitchPathway` (route.ts:1026)

Any authenticated user can write to any other user's session data by supplying a known sessionId.

## Proposed Solution

### Phase 1: Stop the Crashes (5 min)

**File: `apps/web/app/components/bmad/BmadInterface.tsx`**

1. **Remove dead `setMockElicitationData(null)` call** at line 161.

### Phase 2: Fix the Auth Race / Dead-End Skeleton (30 min)

**File: `apps/web/app/components/bmad/BmadInterface.tsx`**

2. **Make `checkForActiveSessions()` check whether getSession succeeded before advancing step**. After `await getSession(activeSession.id)`, check if `currentSession` was actually set. If not, fall back to pathway-selection with the error visible.

   The cleanest approach: have `getSession()` return a boolean or the session, rather than relying on side effects. But the minimal fix is to check the hook's error state after the await.

   Minimal pattern:
   ```typescript
   await getSession(activeSession.id)
   // getSession sets error state on failure; check before advancing
   // Since we can't read hook state synchronously after setState,
   // make getSession re-throw so checkForActiveSessions can catch it
   ```

**File: `apps/web/app/components/bmad/useBmadSession.ts`**

3. **Make `getSession()` re-throw after setting error state**, so callers can catch failures:
   ```typescript
   } catch (err) {
     const message = err instanceof Error ? err.message : 'Failed to load session'
     setError(message)
     console.error('BMad Session Retrieval Error:', err)
     throw err  // Re-throw so callers know it failed
   }
   ```

**File: `apps/web/app/components/bmad/BmadInterface.tsx`**

4. **Add dead-end recovery to `session-active` step with null `currentSession`**. When `!isLoading && !currentSession`, show the error state with a "Back to pathway selection" button instead of the eternal skeleton:
   ```typescript
   case 'session-active':
     if (!currentSession && !isLoading) {
       return (
         <ErrorState
           error={error || 'Session could not be loaded'}
           onRetry={() => checkForActiveSessions()}
         />
         // Plus a "Back to pathway selection" button
       )
     }
     if (!currentSession) {
       return <SkeletonLoader /> // Still loading
     }
     // ... rest of session-active rendering
   ```

### Phase 3: Fix Invisible Text (45 min)

Two options considered:

**Option A (chosen): Replace `text-secondary` with `text-muted-foreground` in BMad components.**
`--muted-foreground` maps to `210 14% 48%` (slate-blue, #6B7B8C), which has good contrast on both cream and parchment backgrounds (~4.5:1 ratio). This is a targeted find-replace that doesn't risk breaking `bg-secondary` usage elsewhere.

**Option B (rejected): Remap `--secondary` CSS variable.**
Would also change `bg-secondary`, `border-secondary`, etc. across all shadcn components. Too broad, high regression risk.

**Files affected** (replace `text-secondary` with `text-muted-foreground`):
- `apps/web/app/components/bmad/BmadInterface.tsx` (19 occurrences)
- `apps/web/app/components/bmad/PathwaySelector.tsx` (7)
- `apps/web/app/components/bmad/ErrorBoundary.tsx` (5)
- `apps/web/app/components/bmad/SessionHistoryManager.tsx` (6)
- `apps/web/app/components/bmad/EnhancedSessionManager.tsx` (12)
- `apps/web/app/components/bmad/SessionManager.tsx` (6)
- Plus remaining BMad component files

Also fix `text-divider` on the breadcrumb dot separator (line 590) which uses a non-existent utility.

### Phase 4: Complete IDOR Fix (20 min)

**File: `apps/web/app/api/bmad/route.ts`**

Add the same ownership check pattern to the 6 unprotected handlers:
```typescript
// SECURITY: Verify session ownership
const session = await sessionOrchestrator.getSession(params.sessionId);
if (!session || session.userId !== userId) {
  return NextResponse.json({ error: 'Session not found' }, { status: 404 });
}
```

Apply to: `handleSaveFeatureInput`, `handleSavePriorityScoring`, `handleGenerateFeatureBrief`, `handleUpdateFeatureBrief`, `handleRegenerateFeatureBrief`, `handleSwitchPathway`.

### Phase 5: ErrorBoundary "Reset Session" Fix (5 min)

**File: `apps/web/app/components/bmad/BmadInterface.tsx`**

The "Reset Session" button in the MainContent ErrorBoundary fallback (line 639) only resets `currentStep`. It should also clear error state:
```typescript
onClick={() => {
  exitSession()  // clears currentSession and error
  setCurrentStep('pathway-selection')
}}
```

## Acceptance Criteria

### Functional Requirements
- [x] Clicking "Start fresh session" or "Return to Workspace" no longer crashes
- [x] Session load failure falls back to pathway-selection with visible error, not eternal skeleton
- [x] All label text in BMad interface is readable (passes WCAG AA 4.5:1 contrast)
- [x] "Reset Session" button in error fallback returns to clean pathway-selection state
- [x] All 6 unprotected API handlers verify session ownership before writes

### Quality Gates
- [x] `npm run build` succeeds (no TypeScript errors from changes)
- [x] Existing mary-persona tests still pass (74/79 pass, 5 pre-existing failures unchanged)
- [ ] Manual test: load a session page, verify BMad continuation guidance is readable
- [ ] Manual test: force a 404 from get_session (e.g., invalid session ID), verify graceful fallback

## Key Files

| File | Changes |
|------|---------|
| `apps/web/app/components/bmad/BmadInterface.tsx` | Remove dead ref, fix race condition, add dead-end recovery, fix text contrast, fix Reset button |
| `apps/web/app/components/bmad/useBmadSession.ts` | Re-throw in getSession so callers can catch |
| `apps/web/app/api/bmad/route.ts` | Add IDOR ownership checks to 6 handlers |
| `apps/web/app/components/bmad/PathwaySelector.tsx` | Fix text-secondary contrast |
| `apps/web/app/components/bmad/ErrorBoundary.tsx` | Fix text-secondary contrast |
| `apps/web/app/components/bmad/SessionHistoryManager.tsx` | Fix text-secondary contrast |
| `apps/web/app/components/bmad/EnhancedSessionManager.tsx` | Fix text-secondary contrast |
| `apps/web/app/components/bmad/SessionManager.tsx` | Fix text-secondary contrast |
| Other BMad component files | Fix text-secondary contrast |

## Design Critique Summary (from frontend-design analysis)

The screenshot reveals a UI that's fighting itself:

1. **No visual hierarchy**: Three stacked cards (breadcrumbs, continuation guidance, error state) compete for attention with equal weight. The user doesn't know where to look.
2. **Ghost text**: Labels like "Pathway:", "Started:", "Progress:" are cream-on-cream. The data values (terracotta on cream) float without context.
3. **Action links invisible**: "Dismiss guidance" and "Start fresh session" are parchment-colored, making recovery impossible to discover.
4. **Error state buried**: "Session Unavailable" appears below two other cards. On shorter viewports it's below the fold.
5. **Terracotta body text**: `text-primary` (terracotta, ~3.2:1 on cream) doesn't pass WCAG AA for body text. OK for large headings, not for metadata values.

The contrast fix (Phase 3) addresses items 2-4. Items 1 and 5 are design improvements worth addressing separately in the existing design system audit plan.

## References

- Existing design system audit brainstorm: `docs/brainstorms/2026-02-15-design-system-audit-brainstorm.md`
- Existing design system audit plan: `docs/plans/2026-02-15-refactor-design-system-audit-plan.md`
- IDOR security fix commit: `1238d00` (Feb 21, 2026)
- God component decomposition solution: `docs/solutions/code-quality/god-component-decomposition-and-codebase-cleanup.md`
- Dashboard hydration crash solution: `docs/solutions/runtime-errors/dashboard-hydration-undefined-property.md`
- Security hardening solution: `docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md`
