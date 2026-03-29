---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, race-condition, cleanup]
---

# Multiple uncancelled setTimeout calls across components

## Problem Statement

Several components have `setTimeout` calls without cleanup on unmount, risking React state-update-on-unmounted-component warnings.

Found by: Frontend races reviewer

## Context

Affected files:
1. `GuestChatInterface.tsx:176` — 5s timeout for `setShowSavePrompt(false)`
2. `ArtifactEditor.tsx:55` — nested 2s "reset to idle" timeout
3. `FeedbackForm.tsx:54` — 2s timeout for `onSubmitted()`
4. `StateBridge.tsx:34,62` — shared timeout ref across two effects (second cancels first)
5. `SpeakerMessage.tsx:45` — inline ReactMarkdown components prop (not a timeout, but a per-render allocation)

## Acceptance Criteria

- [ ] All setTimeout calls store ID in ref and clear on unmount
- [ ] StateBridge uses separate refs for each debounced effect
- [ ] SpeakerMessage extracts components prop to module-level constant

## References

- Files listed above
