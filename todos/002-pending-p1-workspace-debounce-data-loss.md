---
status: pending
priority: p1
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, race-condition, data-loss]
---

# WorkspaceContext debounced auto-save loses data on unmount + stale closures

## Problem Statement

`WorkspaceContext.tsx:144-155` stores the debounce timeout ID in React state (`setAutoSaveTimeout`) instead of a ref. No cleanup effect clears this timeout on unmount. If a user makes edits and navigates away within the 2-second debounce window, those edits are lost.

Additionally, `saveWorkspace` closes over `workspaceState` from the render that created it. By the time the timer fires, `workspaceState` may have been updated, saving stale data.

Found by: Frontend races reviewer

## Context

- File: `lib/workspace/WorkspaceContext.tsx` lines 144-155
- The `useCallback` dependency array creates a stale closure chain

## Acceptance Criteria

- [ ] Timeout handle stored in `useRef`, not React state
- [ ] Latest workspace state tracked in `useRef` (updated via useEffect)
- [ ] Cleanup effect on unmount clears timeout and flush-saves with current state
- [ ] No data loss when navigating away during debounce window

## References

- `lib/workspace/WorkspaceContext.tsx`
