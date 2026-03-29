---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, accessibility, refactor]
---

# Migrate 3 hand-rolled modals to Radix Dialog

## Problem Statement

Three modals use `if (!isOpen) return null` + raw overlay div with no focus trap, no Escape key handling, no aria-modal, and no animated overlay. FeedbackModal and OnboardingModal already use Radix Dialog correctly.

## Context

Found by: Frontend UI pattern audit. `@radix-ui/react-dialog` was installed during Sprint A.

Affected files:
- `app/components/guest/SignupPromptModal.tsx` — uses inline SVG X, `rounded-2xl` (outlier)
- `app/components/chat/ExportDialog.tsx` — no aria-label on close, clickable divs not keyboard-accessible
- `app/components/chat/BranchDialog.tsx` — no aria-label on close, clickable divs not keyboard-accessible

All three also use legacy `bg-black bg-opacity-50` instead of `bg-black/50`.

## Acceptance Criteria

- [ ] All three modals use `@radix-ui/react-dialog` (Dialog.Root, Dialog.Portal, Dialog.Overlay, Dialog.Content, Dialog.Close)
- [ ] Focus trap active when modal is open
- [ ] Escape key closes each modal
- [ ] `Dialog.Title` and `Dialog.Description` present for screen readers
- [ ] Close button uses lucide `<X />` instead of inline SVG
- [ ] Overlay uses `bg-black/50` consistently

## References

- `app/components/feedback/FeedbackModal.tsx` — reference implementation
- `app/components/onboarding/OnboardingModal.tsx` — reference implementation
