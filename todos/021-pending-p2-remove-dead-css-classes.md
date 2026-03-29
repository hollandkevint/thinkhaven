---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, cleanup]
---

# Remove dead CSS classes and standardize close buttons

## Problem Statement

Two cleanup items found by the frontend audit:

1. `.chat-message-user`, `.chat-message-assistant`, `.chat-message-system` in globals.css (lines 302-324) are never used. StreamingMessage builds everything with Tailwind utility classes.

2. Four files still use a copy-pasted 6-line SVG for the X close button instead of lucide's `<X />` component.

## Context

Found by: Frontend UI pattern audit

Close button SVG duplicated in:
- `SignupPromptModal.tsx:45-47`
- `ExportDialog.tsx:196-198`
- `BranchDialog.tsx:126-128`
- `MessageInput.tsx:248`

(These will be fixed automatically if the Radix Dialog migration todo #019 is done first.)

## Acceptance Criteria

- [ ] Dead `.chat-message-*` CSS classes removed from globals.css
- [ ] All close buttons use lucide `<X />` instead of inline SVG
- [ ] GuestChatInterface inline styles (lines 310-333) converted to Tailwind classes

## References

- `globals.css:302-324` — dead classes
- `app/components/guest/GuestChatInterface.tsx:310-333` — inline styles
