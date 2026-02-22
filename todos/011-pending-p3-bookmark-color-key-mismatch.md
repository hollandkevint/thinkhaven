---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, design-system, dx]
dependencies: []
---

# Bookmark COLORS Key Names No Longer Match Visual Colors

## Problem Statement

In `bookmark-reference-manager.ts`, the `BOOKMARK_COLORS` keys (`blue`, `green`, `red`) now map to palette colors (`terracotta`, `forest`, `rust`). Key `blue` produces terracotta (a warm red-orange). Confusing for developers.

Also, `suggestedBookmarkData()` returns `suggestedColor: string` instead of the proper union type, and `purple`/`pink` both map to `dusty-rose` variants (visually indistinguishable).

## Findings

**Source:** TypeScript and Architecture agents

## Proposed Solutions

Add a comment explaining the mapping, or rename the keys to match their visual appearance.
- Effort: Small
- Risk: Low (may need to update DB enum if keys are stored)

## Work Log
- 2026-02-16: Identified during PR #8 code review
