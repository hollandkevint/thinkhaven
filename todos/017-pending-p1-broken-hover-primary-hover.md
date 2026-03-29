---
status: complete
priority: p1
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, broken]
---

# hover:bg-primary-hover resolves to nothing — broken hover state

## Problem Statement

`hover:bg-primary-hover` is used on buttons in two files but `primary-hover` doesn't exist as a Tailwind token. The hover state is completely broken — no visual feedback when hovering. The design system has `terracotta-hover` but no `primary-hover`.

## Context

Found by: Frontend UI pattern audit

Affected files:
- `app/components/dual-pane/PaneErrorBoundary.tsx:83` — retry button
- `app/components/chat/MessageInput.tsx:306` — send button

## Acceptance Criteria

- [ ] Replace `hover:bg-primary-hover` with `hover:bg-terracotta-hover` in both files
- [ ] Verify hover state works visually on both buttons
- [ ] Consider adding `primary-hover` as a Tailwind alias if `primary` is used elsewhere

## References

- `tailwind.config.cjs` — has `terracotta-hover` but no `primary-hover`
