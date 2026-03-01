# UI/UX Polish Brainstorm
**Date**: 2026-02-28
**Topic**: Comprehensive UI/UX Overhaul & "Clunkiness" Resolution

## What We're Building

A systematic overhaul of the `thinkhaven` frontend to resolve a multitude of UX problems and UI clunkiness. The user opted for a comprehensive approach combining micro-interactions, accessibility/feedback fixes, and design system unification.

### Approach 3: Design System Unification (High Effort)
Focuses on standardizing the UI to eliminate inconsistencies that cause cognitive load.
- We will rigorously apply the existing ThinkHaven design system (`docs/design/design-system.md`) everywhere. This means unifying margins/paddings, correcting border radiuses, and applying the precise organic color palette (Cream, Parchment, Terracotta, Ink).

## Key Decisions

1. **Adopt the official ThinkHaven "Wes Anderson" aesthetic:**
   - **Colors:** Cream (`#FAF7F2`) for backgrounds, Terracotta (`#C4785C`) for CTAs/accents, Ink (`#2C2416`) for primary text, Forest (`#4A6741`) for success.
   - **Typography:** Display uses Jost/Futura PT. Body uses Libre Baskerville.
   - **Effects:** Warm, soft shadows with thin muted borders. Border radius base is `0.5rem` (`8px`).
2. **Implement global UX standards:**
   - 44x44px minimum touch targets with `<label>` wrapping on forms.
   - Visible focus rings (`focus-visible:ring`) on all interactive elements.
   - Smooth transitions (`150-300ms ease-out`) and active states (`active:scale-95`).
   - Skeleton/pulse loading states for all async operations; no "frozen" UI.
3. **Synchronize Design System:** The automated design system file has been consolidated into `docs/design/MASTER.md` to mirror `docs/design/design-system.md` and act as the global AI prompt source of truth.

## Open Questions

- *Are there specific high-traffic pages (like a main dashboard or core workflow) we should target first as a proof-of-concept?*
- *Do we need to maintain compatibility with an existing Tailwind theme configuration, or can we overwrite `tailwind.config.cjs` entirely with the new tokens?*
- *Are there any specific third-party component libraries currently in use (e.g., Radix, HeadlessUI, shadcn/ui) that need to be adapter to this new system?*
