# ThinkHaven Design Conventions

Quick reference for the Wes Anderson-inspired design system. Use this when building new components or modifying existing ones.

## Source of Truth

Runtime tokens live in `apps/web/app/globals.css` and `apps/web/tailwind.config.cjs`. Visual references live in `docs/design/design-system.pen` and `docs/design/pages/`. The full spec is `docs/design/design-system.md`; this file is the quick do/don't checklist.

## Color Palette

| Token | Hex | Tailwind Class | Usage |
|-------|-----|---------------|-------|
| cream | `#FAF7F2` | `bg-cream` | Page backgrounds |
| parchment | `#F5F0E6` | `bg-parchment` | Light accent backgrounds, hover states |
| terracotta | `#C4785C` | `bg-terracotta`, `text-terracotta` | Primary accent, buttons, Mary avatar, links |
| terracotta-hover | `#B56A4E` | `hover:bg-terracotta-hover` | Button hover states |
| forest | `#4A6741` | `text-forest` | Success states, active indicators |
| ink | `#2C2416` | `text-ink` | Primary text, headings |
| ink-light | `#4A3D2E` | `text-ink-light` | Secondary text, body copy |
| dusty-rose | `#C9A9A6` | `text-dusty-rose` | Encouraging mode, soft accents |
| mustard | `#D4A84B` | `text-mustard` | Warnings, inquisitive mode |
| slate-blue | `#6B7B8C` | `text-slate-blue` | Muted text, info states, realistic mode |
| rust | `#8B4D3B` | `text-rust` | Error states, destructive actions |
| sage | `#A3B18A` | `text-sage` | Decorative accents |

## State Colors

| State | Color | Token | Example |
|-------|-------|-------|---------|
| Error | rust | `text-rust`, `bg-rust/5`, `border-rust/20` | Form errors, failed requests |
| Success | forest | `text-forest`, `bg-forest/5`, `border-forest/20` | Saved, completed |
| Warning | mustard | `text-mustard`, `bg-mustard/10`, `border-mustard/20` | Caution states |
| Info | slate-blue | `text-slate-blue`, `bg-slate-blue/10` | Informational badges |

## Color Ownership

Modes own semantic color. Board members own identity accents. When both appear together, use the board member color only for avatar/border identity and the mode token for mode/state badges.

## Board Member Identity Accents

| Member | Color | Tailwind | Role |
|--------|-------|----------|------|
| Mary | terracotta | `bg-terracotta` | Facilitator avatar/border |
| Victoria | mustard | `bg-mustard` | Investor avatar/border |
| Casey | forest | `bg-forest` | Co-founder avatar/border |
| Elaine | slate-blue | `bg-slate-blue` | Coach avatar/border |
| Omar | ink | `bg-ink` | Operator avatar/border |
| Taylor | dusty-rose | `bg-dusty-rose` | Life coach avatar/border |

## Typography

| Font | CSS Variable | Tailwind | Usage |
|------|-------------|----------|-------|
| Jost | `--font-display` | `font-display` | Headings, display text, nav labels |
| Libre Baskerville | `--font-body` | `font-body` | Body text, paragraphs, chat messages |
| JetBrains Mono | `--font-mono` | `font-mono` | Code blocks, technical data, timestamps |

## Never Use

These classes are banned outside of syntax highlighting / code blocks:

- `blue-*` (any shade) — use `terracotta` or `slate-blue`
- `indigo-*` — use `terracotta`
- `purple-*` — use `slate-blue` or `terracotta`
- `gray-*` — use palette equivalents (see mapping below)
- Hardcoded RGBA (`rgba(0, 121, 255, ...`) — use Tailwind opacity syntax
- `from-blue-50 to-indigo-100` gradients — use `bg-cream`
- `bg-gradient-to-br from-blue-500 to-purple-600` — use `bg-terracotta`

## Gray Replacement Map

| Off-brand | Replacement |
|-----------|------------|
| `bg-gray-50` | `bg-parchment` |
| `bg-gray-100` | `bg-parchment` |
| `bg-gray-200` | `bg-ink/10` |
| `border-gray-200`, `border-gray-300` | `border-ink/8` |
| `text-gray-400` | `text-slate-blue/60` |
| `text-gray-500` | `text-slate-blue` |
| `text-gray-600` | `text-ink-light` |
| `text-gray-700` | `text-ink-light` |
| `text-gray-800`, `text-gray-900` | `text-ink` |
| `hover:bg-gray-50` | `hover:bg-parchment` |
| `hover:bg-gray-100` | `hover:bg-parchment` |
| `focus:ring-blue-500` | `focus:ring-terracotta` |
| `focus:border-blue-500` | `focus:border-terracotta` |

## Component Patterns

**Buttons:**
```
Primary:   bg-terracotta text-cream hover:bg-terracotta-hover
Secondary: bg-parchment text-ink-light hover:bg-cream
Ghost:     text-slate-blue hover:text-ink hover:bg-parchment
Danger:    bg-rust text-cream hover:bg-rust/90
Disabled:  bg-ink/15 cursor-not-allowed
```

**Cards:**
```
bg-parchment rounded-lg border border-ink/8 shadow-sm
```

**Inputs:**
```
border border-ink/15 rounded-lg focus:ring-terracotta focus:border-terracotta
placeholder:text-slate-blue/60
```

**Spinners / Loading:**
```
border-terracotta border-t-transparent animate-spin
```

**Avatars (Mary):**
```
bg-terracotta text-cream font-display font-semibold
```

**Progress bars:**
```
Track: bg-ink/10 rounded-full
Fill:  bg-terracotta rounded-full
```

## Component States

Every reusable component needs default, hover, focus, disabled, and loading states.

**Button states:**
```
Hover:    hover:bg-terracotta-hover
Focus:    focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2
Disabled: disabled:opacity-50 disabled:cursor-not-allowed
Loading:  inline spinner, stable button width
```

**Input error:**
```
border-rust focus:ring-rust text-rust helper copy below the field
```

**Empty states:**
```
bg-parchment border border-ink/8 rounded-lg
headline + one short line + one secondary/ghost CTA
```

**Loading skeletons:**
```
loading-shimmer bg-parchment dimensions match final layout
```

**Error states:**
```
bg-rust/5 border-rust/30 text-rust with inline retry when possible
```

## Motion

| Pattern | Use |
|---------|-----|
| `enter.fade-up` | New chat messages, cards, small panels |
| `enter.stagger` | Session cards and canvas cells, 40ms step, max 6 |
| `state.pulse` | Thinking/pending state, 1.2s loop |
| `page.crossfade` | Dashboard/workspace transition |
| `hover.lift` | Clickable cards only, 2px rise |
| `commit.canvas-cell` | Canvas cell fills or commits |

## Spacing

8px grid system. Standard gaps: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px).

Container widths: `max-w-[1200px]` (landing), `max-w-[1400px]` (app).

Section rhythm: 72px landing sections on desktop, 40px dashboard/card rhythm, 16px chat/message rhythm. Breakpoints: 640px, 768px, 1024px, 1400px.

## Accessibility

- Use Radix Dialog for new modals.
- Keep visible `focus-visible` rings on buttons, inputs, cards, menu items, and canvas cells.
- Use Lucide icons at 16px compact, 20px standard, 24px panel/header scale.
- Respect `prefers-reduced-motion`.
- ThinkHaven is light-only until a separate dark palette is intentionally designed.

## Exceptions

- **Syntax highlighting** in code blocks keeps neutral grays (`bg-gray-100`, `bg-gray-900`) for readability
- **Small content wells** inside parchment/cream surfaces may use `bg-white` for contrast
- **Prose code** backgrounds (`prose-code:bg-gray-100`) are exempt
- **shadcn/ui primitives** use HSL vars mapped to the palette (don't override)
