---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, architecture, refactor]
---

# Extract session page into sub-components before adding features

## Problem Statement

The session page (`app/app/session/[id]/page.tsx`) is 484 lines and every planned sprint adds to it. The architecture reviewer identified that adding Mermaid diagrams, voice input, feedback auto-prompt, and onboarding help icon to the same file will push it toward 700-800 lines.

The right panel uses a binary `isCanvasOpen` toggle that breaks when adding a third content type.

Found by: Architecture strategist, Code simplicity reviewer

## Context

- God-component-decomposition learning (docs/solutions) confirms: extract hooks early
- `useStreamingChat` was already extracted at 355 lines, proving the pattern works
- Right panel state needs to become an enum (`PanelTab`) not boolean

## Acceptance Criteria

- [ ] `SessionHeader.tsx` extracted (title, help icon, export, feedback button)
- [ ] `ChatPanel.tsx` extracted (message list, input, typing indicator)
- [ ] `RightPanel.tsx` extracted (panel toggle, tab switching, content)
- [ ] `isCanvasOpen` boolean replaced with `activePanel: PanelTab | null`
- [ ] Session page orchestrates layout and data flow only
- [ ] No visual or behavioral regressions

## References

- `app/app/session/[id]/page.tsx`
- `docs/solutions/code-quality/god-component-decomposition-and-codebase-cleanup.md`
