---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, tests, design-system]
dependencies: ["001"]
---

# Test Files Assert Old Color Classes After Retheme

## Problem Statement

Priority matrix and priority scoring tests assert old Tailwind color classes that were changed in the source components. These tests will fail as new regressions from this PR.

## Findings

**Source:** Performance and TypeScript agents

### Files:
- `tests/components/bmad/pathways/priority-matrix.test.tsx:104-142` -- asserts `bg-green-50`, `border-green-200`, `text-green-800`, `bg-blue-50`, `bg-red-50`, `bg-yellow-50`
- `tests/components/bmad/pathways/priority-scoring.test.tsx:115-133` -- asserts `text-red-600`, `bg-red-50`, `text-green-700`, `bg-green-50`

## Proposed Solutions

Update test assertions to match the rethemed classes.
- Effort: Small
- Risk: None

## Acceptance Criteria
- [ ] Test assertions match rethemed component classes
- [ ] Tests pass (or match the pre-existing failure baseline)

## Work Log
- 2026-02-16: Identified by performance and TypeScript agents during PR #8 code review
