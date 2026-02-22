---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, design-system, exports]
dependencies: []
---

# HTML/PDF Export Templates Still Use Blue/Gray Theme

## Problem Statement

All HTML and PDF export generators produce documents with hardcoded blue/gray colors from the old design system. A user exports a brief from a terracotta/cream-themed app and gets a blue/gray document. Jarring brand disconnect.

## Findings

**Source:** Architecture agent

### Files with old-palette hex values:
- `lib/export/pdf-templates/FeatureBriefPDF.tsx` -- 25+ hardcoded hex (`#4299e1`, `#718096`, `#e2e8f0`)
- `lib/bmad/generators/product-brief-generator.ts:603-620` -- blue CSS (`#3b82f6`, `#0369a1`)
- `lib/bmad/generators/brainstorm-summary-generator.ts:342-375`
- `lib/bmad/generators/project-brief-generator.ts:645-659`
- `lib/bmad/exports/brief-formatters.ts:181-238`
- `lib/ai/conversation-export.ts:499-510`

These are standalone HTML documents (not rendered in React), so they can't use Tailwind classes. Fix requires updating hex values to palette equivalents.

## Proposed Solutions

### Option A: Create a shared color constants file for export templates
Map palette hex values as constants, import in all generators.
- Effort: Medium
- Risk: Low

## Acceptance Criteria
- [ ] Exported documents use Wes Anderson palette hex values
- [ ] Color constants are centralized (not duplicated across 6 files)

## Work Log
- 2026-02-16: Identified by architecture agent during PR #8 code review
