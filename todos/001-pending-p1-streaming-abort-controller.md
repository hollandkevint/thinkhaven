---
status: pending
priority: p1
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, security, race-condition]
---

# useStreamingChat missing AbortController — state updates on unmounted component

## Problem Statement

`useStreamingChat.ts` creates a fetch request in `streamClaudeResponse` with no `AbortController`. If a user navigates away from the session page while Mary is streaming a response, the `while(true)` reader loop continues running, calling `updateStreamingMessage`, `setSession`, `setBoardState`, and `finalizeAssistantMessage` against a dead component tree.

Found by: Frontend races reviewer

## Context

- File: `app/app/session/[id]/useStreamingChat.ts` (line ~194)
- The old `ChatInterface` had `connectionManager.current.abort()` in a cleanup effect. This newer hook has no equivalent.
- GuestChatInterface has the same issue (no AbortController on raw fetch)

## Acceptance Criteria

- [ ] `streamClaudeResponse` creates an `AbortController` and passes `signal` to `fetch()`
- [ ] `useEffect` cleanup calls `controller.abort()` on unmount
- [ ] No React state-update-on-unmounted-component warnings when navigating away mid-stream
- [ ] GuestChatInterface also gets an AbortController

## Notes

This is a prerequisite fix — should be done in Sprint 0 before adding new features to the session page.

## References

- `app/app/session/[id]/useStreamingChat.ts`
- `app/components/guest/GuestChatInterface.tsx`
