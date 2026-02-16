---
title: "Design System Consolidation: Wes Anderson Palette Retheme"
date_solved: 2026-02-15
category: design-system-refactoring
severity: P1
components:
  - authentication (login, signup)
  - chat (messaging, markdown renderer, history sidebar)
  - session workspace
  - BMad (elicitation, pathways, session history, scoring, brief editor)
  - canvas (mermaid, dual-pane, export)
  - assessment (strategy quiz, results)
  - monitoring (metrics dashboard, auth monitoring)
  - artifacts (editor, list, viewer)
  - guest interface
  - export templates (HTML/PDF)
  - ui utilities (error boundary, offline notice, navigation)
  - waitlist
  - demo scenarios (deleted)
symptoms:
  - Off-brand Tailwind classes (gray-*, blue-*, indigo-*, purple-*, green-*)
  - 67 inline style={{var(--token)}} patterns instead of Tailwind classes
  - Hardcoded hex values (#f9f9f9, #CBD5E1) and rgba() not in palette
  - Chat text unreadable (text-secondary aliasing to parchment on parchment bg)
  - XSS vulnerability in MessageHistorySidebar (dangerouslySetInnerHTML for truncation)
  - Export templates visually disconnected from app (blue/gray while app is terracotta/forest)
  - Demo pages crashing (MarkdownRenderer import mismatch)
  - /demo and /try routes inconsistently referenced across 18 files
  - GuestChatInterface using JS onMouseOver/onMouseOut instead of CSS hover
  - Redundant same-color gradients (from-terracotta to-terracotta)
root_causes:
  - No formal design system documentation during initial development
  - Retheme done incrementally across 6 commits as components discovered
  - Export generation layer not connected to design token system
  - dangerouslySetInnerHTML used for plain text truncation (unnecessary XSS surface)
  - Inline CSS patterns from legacy code, never migrated to Tailwind
  - Demo namespace collision (/demo and /try coexisted)
solution_type: refactor
status: solved
commits:
  - 32debda
  - 410aec1
  - f5d7112
  - c4c4857
  - 6e296e2
  - d24e8a3
  - 803b9b7
tags:
  - design-system
  - wes-anderson-palette
  - tailwind
  - xss-fix
  - accessibility
  - inline-style-removal
related:
  - docs/design-conventions.md
  - docs/design/design-system.md
  - docs/2026-02-15-design-system-audit-brainstorm.md
  - docs/2026-02-15-refactor-design-system-audit-plan.md
---

# Design System Consolidation: Wes Anderson Palette Retheme

## Problem

After rapid feature development, 80+ component files accumulated off-brand colors, inline styles, and inconsistent patterns. The Wes Anderson palette (cream, terracotta, forest, ink, slate-blue) was defined in Tailwind config but never systematically applied. Components used arbitrary grays, blues, purples, and hardcoded hex/rgba values.

The retheme required 6 sequential discovery-driven commits because there was no design contract or checklist — each pass found new violations in components the previous pass missed.

**Secondary issues discovered during the refactor:**
- **XSS vulnerability** in `MessageHistorySidebar` — `dangerouslySetInnerHTML` used for plain text truncation
- **Accessibility failure** — chat text rendered unreadable (text-secondary resolved to parchment on parchment backgrounds)
- **Demo route fragmentation** — `/demo` and `/try` paths coexisted across 18 files with hidden test coupling
- **67 inline style patterns** — `style={{color: 'var(--foreground)'}}` instead of `className="text-foreground"`

## Investigation

The audit started with commit `32debda` fixing demo crashes, then expanded as each retheme pass revealed more off-brand components:

1. **Chat/session components** — core product using blue/gray/purple
2. **Auth pages** — login/signup completely off-brand with 90+ inline styles
3. **BMad pathways** — 20+ files with scattered gray/blue classes
4. **Export templates** — HTML/PDF generators using hardcoded blue/gray hex values
5. **Utility components** — error boundaries, monitoring dashboards, guest interface

## Root Cause

No formal design specification existed during initial development. Each developer interpreted color intentions differently, and the Tailwind theme extension was additive (new tokens added) but not restrictive (old tokens still available). Export templates were styled independently from the component system.

The discovery-driven refactor pattern (fix what you find, check again) is inherently inefficient — commit 803b9b7 (the 7th pass) still found 8 missed components, inline styles, and the XSS vulnerability.

## Solution

### 1. Color Replacement Map

Every off-brand class was mapped to a palette equivalent:

| Off-Brand | Replacement |
|-----------|-------------|
| `bg-gray-50/100` | `bg-parchment` |
| `bg-gray-200/300` | `bg-ink/10` |
| `text-gray-500/600` | `text-ink-light` or `text-slate-blue` |
| `text-gray-900` | `text-ink` |
| `bg-blue-50` | `bg-parchment` |
| `bg-blue-500/600` | `bg-terracotta` |
| `text-blue-600/700` | `text-terracotta` |
| `bg-green-500` | `bg-forest` |
| `bg-purple-*` | `bg-slate-blue` |
| `border-gray-200` | `border-ink/10` |

### 2. Inline Style → Tailwind Class Migration

```tsx
// BEFORE (67 instances like this)
<Link
  className="text-2xl font-bold font-display"
  style={{ color: 'var(--foreground)' }}
>

// AFTER
<Link className="text-2xl font-bold font-display text-foreground">
```

Common conversions:
- `style={{ borderColor: 'var(--border)' }}` → `className="border border-border"`
- `style={{ backgroundColor: 'rgba(139, 77, 59, 0.05)' }}` → `className="bg-rust/5"`
- `style={{ color: 'var(--muted)' }}` → `className="text-muted-foreground"`

### 3. XSS Fix in MessageHistorySidebar

```tsx
// BEFORE — XSS vulnerability
<div
  className="text-sm text-secondary leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: message.content.length > 200
      ? `${message.content.substring(0, 200)}...`
      : message.content
  }}
/>

// AFTER — safe text node
<p className="text-sm text-secondary-foreground leading-relaxed">
  {message.content.length > 200
    ? `${message.content.substring(0, 200)}...`
    : message.content}
</p>
```

### 4. JS Hover Handlers → CSS

```tsx
// BEFORE — JavaScript DOM mutation
<button
  style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta-hover)'}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta)'}
>

// AFTER — Pure CSS
<button className="bg-terracotta hover:bg-terracotta-hover text-cream transition-colors">
```

### 5. Export Template Retheme

6 PDF/HTML export templates converted from blue/gray hex to palette:

```tsx
// BEFORE
heading: { color: '#1a202c', borderBottom: '3px solid #4299e1' }
priorityBox: { backgroundColor: '#ebf8ff', borderLeft: '4px solid #4299e1' }

// AFTER
heading: { color: '#2C2416', borderBottom: '3px solid #C4785C' }  // ink + terracotta
priorityBox: { backgroundColor: '#FAF7F2', borderLeft: '4px solid #C4785C' }  // cream + terracotta
```

### 6. Demo Consolidation

- Deleted `/demo` pages, seed scripts, and demo-specific types (1,000+ lines removed)
- Updated all references to `/try`
- Added 301 redirects in `next.config.ts`:

```typescript
async redirects() {
  return [
    { source: '/demo', destination: '/try', permanent: true },
    { source: '/demo/:path*', destination: '/try', permanent: true },
  ];
}
```

### 7. Text Contrast Fix

```tsx
// BEFORE — text-secondary resolved to parchment on parchment bg (unreadable)
className="prose prose-p:text-secondary"

// AFTER
className="prose prose-p:text-secondary-foreground"
```

### 8. Button Text Standardization

Across 22 files, all `bg-terracotta` buttons now pair with `text-cream`.

## Prevention

### Guardrails Now in Place
- **`docs/design-conventions.md`** — formal design contract with color map, component patterns, and explicit "Never Use" list
- **Tailwind config** — all palette colors registered as named tokens (cream, terracotta, forest, ink, etc.)
- **CLAUDE.md** — design system rules for Claude Code review

### Still Missing (Recommended Next Steps)

1. **ESLint rules for banned Tailwind classes** — catch `bg-gray-*`, `bg-blue-*` at lint time (low effort, high impact)
2. **`react/no-danger` ESLint rule** — prevent new `dangerouslySetInnerHTML` usage
3. **CI design lint job** — grep for banned patterns in PR checks
4. **Pre-commit hook** — lint-staged to catch violations before commit
5. **Design token regression tests** — verify palette colors resolve correctly
6. **Component pattern constants** — export standard button/card/input class strings from a shared module

### Key Lesson

Manual, discovery-driven rethemes are inherently incomplete. The fix required 7 commits over 3 days. A design conventions doc + automated enforcement (ESLint + CI checks) would catch violations at write-time instead of requiring periodic manual audits.

## Related Documentation

- [Design Conventions](../../design-conventions.md) — the formal design contract created during this refactor
- [Design System Spec](../../design/design-system.md) — full palette, typography, and component reference
- [Design System Audit Brainstorm](../../2026-02-15-design-system-audit-brainstorm.md) — planning doc that initiated the refactor
- [Refactor Plan](../../2026-02-15-refactor-design-system-audit-plan.md) — phased execution plan
- [Board of Directors Architecture](../architecture-patterns/personal-board-of-directors-multi-perspective-ai.md) — related solution doc for board member color assignments

## Files Changed

112 files across the commit series. Key categories:
- **80+ component .tsx files** — color class replacements
- **6 export template files** — hex value replacements
- **Config** — `next.config.ts` (redirects), `tailwind.config.cjs` (tokens)
- **Tests** — landing page, navigation, priority matrix tests updated
- **Deleted** — demo pages, seed scripts, demo types, demo tests (~1,500 lines removed)
