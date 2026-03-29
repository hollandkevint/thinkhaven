---
status: complete
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, design-system]
---

# Replace raw hex colors with design tokens in components

## Problem Statement

Several components use hardcoded hex values instead of CSS variables or Tailwind tokens. This makes the design system fragile — if colors change, these components won't update.

## Context

Found by: Frontend UI pattern audit

| File | Line | Hex Value | Should Be |
|------|------|-----------|-----------|
| `MarkdownRenderer.tsx` | 72 | `#6B7280` (gray-500) | `var(--slate-blue)` (#6B7B8C) — wrong color entirely |
| `BoardOverview.tsx` | 15-17 | `#C4785C`, `#D4A84B`, `#A3B18A` | `var(--terracotta)`, `var(--mustard)`, `var(--sage)` |
| `BoardOverview.tsx` | 120 | `#B5B3B0` | Needs new `--color-inactive` variable |

Google logo SVGs in login/signup pages use brand hex colors — these are correct and should NOT be tokenized.

## Acceptance Criteria

- [ ] MarkdownRenderer line number color changed from gray-500 to slate-blue
- [ ] BoardOverview PHASES array uses CSS variable references
- [ ] New `--color-inactive: #B5B3B0` variable added to globals.css and tailwind.config.cjs (or use `--slate-blue` with opacity)
- [ ] No raw hex colors remain in component files (except brand logos)

## References

- `globals.css` — color variable definitions
- `tailwind.config.cjs` — Tailwind color tokens
