---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, design-system]
---

# Standardize transitions, overlays, and icon button hover patterns

## Problem Statement

Three minor inconsistencies in the interaction layer:

1. **Overlay opacity**: `bg-black/50` (Radix modals), `bg-black bg-opacity-50` (hand-rolled), `bg-black/30` (ArtifactPanel). Should converge on `bg-black/50`.

2. **Icon button hover**: Three patterns exist — `text-muted-foreground hover:text-primary hover:bg-parchment`, `text-ink/40 hover:text-ink`, and `text-slate-blue/60 hover:text-slate-blue`. Should pick one.

3. **Animation duplication**: `fadeIn` and `slideIn` keyframes defined in both `globals.css` and `tailwind.config.cjs`, creating two class names for the same animation (`animate-fadeIn` vs `animate-fade-in`).

## Context

Found by: Frontend UI pattern audit. Design system defines `--transition-fast: 150ms`, `--transition-base: 250ms`, `--transition-slow: 400ms` but components use Tailwind defaults or hardcoded `duration-200`/`duration-300`.

## Acceptance Criteria

- [ ] All overlays use `bg-black/50` (not `bg-opacity-50` or `/30`)
- [ ] Icon button hover standardized to `text-muted-foreground hover:text-ink` pattern
- [ ] Remove duplicate keyframe definitions (keep in tailwind.config.cjs, reference via CSS in globals.css)
- [ ] Consider using `duration-fast`/`duration-base` from Tailwind config instead of hardcoded values

## References

- `globals.css:469-478` — keyframe definitions
- `tailwind.config.cjs:146-158` — duplicate keyframe definitions
- `globals.css` — CSS transition variable definitions
