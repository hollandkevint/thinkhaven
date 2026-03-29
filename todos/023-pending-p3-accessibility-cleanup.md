---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, accessibility]
---

# Accessibility cleanup — aria-labels, keyboard nav, touch targets

## Problem Statement

Multiple interactive elements lack proper accessibility support. Clickable divs are not keyboard-accessible, close buttons have no aria-labels, and touch targets are below the 44px minimum.

## Context

Found by: Frontend UI pattern audit

### Missing aria-labels
- `ExportDialog.tsx` — close button (lines 194-199)
- `BranchDialog.tsx` — close button (lines 122-129)
- `MessageActionMenu.tsx:143` — trigger button
- `StreamingMessage.tsx` — metadata toggle (missing `aria-expanded`)

### Clickable divs need role="button" + keyboard handlers
- `ExportDialog.tsx` — format selection cards
- `BranchDialog.tsx` — direction selection cards
- `StrategyQuiz.tsx:315` — quiz option cards

### Touch targets too small
- Radix modal close buttons (`p-2` + `w-4 h-4` = ~32px) — below 44px minimum
- MessageInput formatting toolbar buttons (`p-2` + `w-4 h-4` = ~32px)
- ArtifactHeader action buttons (`p-1.5` = ~28px)

### Missing semantic roles
- `FeedbackModal.tsx:94-105` — Likert buttons need `role="radiogroup"` + individual `aria-label`s
- `BoardOverview.tsx:98-108` — progress bar segments need ARIA progress semantics

## Acceptance Criteria

- [ ] All close buttons have `aria-label="Close"`
- [ ] Clickable card divs have `role="button"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space
- [ ] Close button touch targets increased to minimum 44px (use `p-3` or increase clickable area)
- [ ] Likert scales wrapped in `role="radiogroup"` with `aria-label`
- [ ] StreamingMessage metadata toggle has `aria-expanded`

## References

- WCAG 2.1 Success Criterion 2.5.5 (Target Size)
- WCAG 2.1 Success Criterion 4.1.2 (Name, Role, Value)
