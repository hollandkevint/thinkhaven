---
status: complete
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, design-system]
---

# Replace text-white with text-cream across 5 files

## Problem Statement

The design system uses cream (#FAF7F2) for light-on-dark text, not pure white (#FFFFFF). Five files use `text-white` which breaks the warm palette. The CSS variable `--primary-foreground` already maps to cream.

## Context

Found by: Frontend UI pattern audit

Affected files:
- `app/components/dual-pane/PaneErrorBoundary.tsx:83` — retry button
- `app/components/chat/MessageInput.tsx:306` — send button
- `app/components/chat/StreamingMessage.tsx:258,264` — user message bubbles
- `app/components/chat/MessageLimitWarning.tsx:51` — warning banner
- `app/components/ui/navigation.tsx:126` — CTA button

## Acceptance Criteria

- [ ] All `text-white` instances replaced with `text-cream`
- [ ] Visual check: text still readable on terracotta/ink/rust backgrounds

## References

- `globals.css` — `--primary-foreground` maps to cream
- StreamingMessage uses `bg-primary text-white` but globals.css `.chat-message-user` uses `var(--chat-user-fg)` which is cream
