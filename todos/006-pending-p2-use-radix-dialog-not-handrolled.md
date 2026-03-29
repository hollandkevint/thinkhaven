---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, architecture, accessibility]
---

# Use Radix Dialog for new modals, not hand-rolled pattern

## Problem Statement

All existing modals (SignupPromptModal, BranchDialog, ExportDialog) are hand-rolled with no focus trapping, no Escape key handling, no backdrop click dismiss, and no `aria-modal`. A hand-rolled dropdown was already replaced with Radix due to broken `asChild` behavior (commit f556716). New modals should use `@radix-ui/react-dialog`.

Found by: TypeScript reviewer, Pattern recognition specialist

## Context

- Existing modals lack: focus trap, Escape to close, backdrop click dismiss, aria-modal
- `@radix-ui/react-dropdown-menu` already installed (proves Radix is accepted)
- Feedback modal and onboarding modal are both planned

## Acceptance Criteria

- [ ] `@radix-ui/react-dialog` installed
- [ ] FeedbackModal uses Radix Dialog
- [ ] OnboardingModal uses Radix Dialog
- [ ] Both modals have focus trapping, Escape-to-close, aria-modal

## Notes

Existing modals can be migrated to Radix later as a separate cleanup task.

## References

- Commit f556716 (Radix dropdown-menu replacement)
- `app/components/guest/SignupPromptModal.tsx` (existing hand-rolled pattern)
