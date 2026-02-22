---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, design-system, consistency]
dependencies: []
---

# Primary Buttons Inconsistently Use text-white vs text-cream

## Problem Statement

Design conventions specify primary buttons as `bg-terracotta text-cream hover:bg-terracotta-hover`. But ~5 files use `text-white` instead of `text-cream`. Cream (#FAF7F2) is the brand's warm white, distinct from pure white (#FFFFFF).

## Findings

**Source:** Pattern Recognition agent

| File | Current | Should be |
|------|---------|-----------|
| `login/page.tsx` | `style={{ color: 'white' }}` | `text-cream` |
| `CanvasExportModal.tsx` | `text-white` | `text-cream` |
| `CanvasContextSync.tsx` | `text-white` | `text-cream` |
| Multiple BMAD components | `text-white` | `text-cream` |

## Proposed Solutions

### Option A: Global find-replace `text-white` to `text-cream` on primary buttons
- Effort: Small
- Risk: Low (need to avoid replacing `text-white` on dark backgrounds where pure white is correct)

## Acceptance Criteria
- [ ] All primary (terracotta) buttons use `text-cream`
- [ ] Success (forest) and destructive (rust) buttons can keep `text-white` if intended

## Work Log
- 2026-02-16: Identified by pattern recognition agent during PR #8 code review
