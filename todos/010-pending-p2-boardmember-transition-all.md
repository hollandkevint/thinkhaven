---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, performance]
---

# Replace transition-all with explicit properties on BoardMemberCard

## Problem Statement

`BoardMemberCard` uses `transition-all duration-200` which transitions every CSS property that changes, including `box-shadow`, `filter`, and layout properties. This can cause layout thrashing with multiple cards animating simultaneously. The plan also proposes `filter:saturate` for Taylor hover, which is NOT GPU-composited and causes paint jank on mobile Safari.

Found by: Performance oracle, TypeScript reviewer

## Context

- 6 cards rendered simultaneously in BoardOverview
- Only `transform` and `opacity` are GPU-composited
- Taylor's existing `opacity-60` class is sufficient visual differentiation

## Acceptance Criteria

- [ ] `transition-all` replaced with `transition: transform 200ms ease, opacity 200ms ease`
- [ ] No `filter:saturate` animations (use opacity instead)
- [ ] Conditional `will-change: transform` on active card only
- [ ] `@media (prefers-reduced-motion: reduce)` disables pulse animation

## References

- `app/components/board/BoardMemberCard.tsx`
