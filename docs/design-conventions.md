# ThinkHaven Design Conventions

Quick reference for the Wes Anderson-inspired design system. Use this when building new components or modifying existing ones.

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
| dusty-rose | `#C9A9A6` | `text-dusty-rose` | Taylor's color, encouraging mode |
| mustard | `#D4A84B` | `text-mustard` | Warnings, Victoria's color |
| slate-blue | `#6B7B8C` | `text-slate-blue` | Muted text, info states, Elaine's color |
| rust | `#8B4D3B` | `text-rust` | Error states, destructive actions |
| sage | `#A3B18A` | `text-sage` | Decorative accents |

## State Colors

| State | Color | Token | Example |
|-------|-------|-------|---------|
| Error | rust | `text-rust`, `bg-rust/5`, `border-rust/20` | Form errors, failed requests |
| Success | forest | `text-forest`, `bg-forest/5`, `border-forest/20` | Saved, completed |
| Warning | mustard | `text-mustard`, `bg-mustard/10`, `border-mustard/20` | Caution states |
| Info | slate-blue | `text-slate-blue`, `bg-slate-blue/10` | Informational badges |

## Board Member Colors

| Member | Color | Tailwind | Role |
|--------|-------|----------|------|
| Mary | terracotta | `bg-terracotta` | Facilitator |
| Victoria | mustard | `bg-mustard` | Investor |
| Casey | forest | `bg-forest` | Co-founder |
| Elaine | slate-blue | `bg-slate-blue` | Coach |
| Omar | ink | `bg-ink` | Operator |
| Taylor | dusty-rose | `bg-dusty-rose` | Life coach (opt-in) |

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
bg-white rounded-lg border border-ink/8 shadow-sm
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

## Spacing

8px grid system. Standard gaps: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px).

Container widths: `max-w-[1200px]` (landing), `max-w-[1400px]` (app).

## Exceptions

- **Syntax highlighting** in code blocks keeps neutral grays (`bg-gray-100`, `bg-gray-900`) for readability
- **Card interiors** on cream backgrounds stay `bg-white` for contrast
- **Prose code** backgrounds (`prose-code:bg-gray-100`) are exempt
- **shadcn/ui primitives** use HSL vars mapped to the palette (don't override)
