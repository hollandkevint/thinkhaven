---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, performance, architecture]
---

# Singleton feedback modal via zustand store

## Problem Statement

Three FeedbackButton instances exist (sidebar, header, nav). If each manages its own modal `isOpen` state, three modal instances could be in the DOM simultaneously. Use a zustand store to coordinate a single shared modal.

Found by: Performance oracle

## Context

- Zustand (`^5.0.8`) already installed but not yet used in production components
- `dualPaneStore.ts` provides the existing zustand pattern

## Acceptance Criteria

- [ ] `feedbackStore.ts` created with `isOpen`, `sessionId`, `open()`, `close()`
- [ ] Single `<FeedbackModal />` rendered in app layout or providers
- [ ] All FeedbackButton variants call `useFeedbackStore.getState().open()`
- [ ] No duplicate modal instances in DOM

## References

- `lib/stores/dualPaneStore.ts` (existing zustand pattern)
