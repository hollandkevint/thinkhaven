---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, design-system, cleanup]
dependencies: []
---

# Redundant from-terracotta to-terracotta Gradients

## Problem Statement

Mechanical find-and-replace created gradients from one color to the same color: `bg-gradient-to-br from-terracotta to-terracotta`. This is just `bg-terracotta`.

## Findings

**Source:** Pattern Recognition agent

**File:** `app/components/bmad/EnhancedSessionManager.tsx` -- 3 instances at lines 334, 354, 429

## Proposed Solutions

Replace `bg-gradient-to-br from-terracotta to-terracotta` with `bg-terracotta`.
- Effort: Small (3 replacements)
- Risk: None

## Acceptance Criteria
- [ ] Zero same-color gradients in codebase

## Work Log
- 2026-02-16: Identified by pattern recognition agent during PR #8 code review
