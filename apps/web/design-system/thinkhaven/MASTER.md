# ThinkHaven Design System - Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ThinkHaven - Decision Accelerator for Business Strategy
**Style:** Wes Anderson-Inspired + Nature Distilled
**Generated:** 2026-02-02 (Updated from existing globals.css)

---

## Design Philosophy

ThinkHaven uses a **Wes Anderson-inspired organic warmth** aesthetic that signals:
- Professional sophistication without corporate coldness
- Approachable expertise (not intimidating)
- Thoughtful craft (attention to detail implies attention to product)
- Warm decision support (not clinical analysis)

Reference sites: Adaline (serene nature), Turbopuffer (technical precision with warmth), Notion (playful professional)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Tailwind |
|------|-----|--------------|----------|
| **Primary Backgrounds** ||||
| Cream | `#FAF7F2` | `--cream` | `bg-cream` |
| Parchment | `#F5F0E6` | `--parchment` | `bg-parchment` |
| **Primary Accent** ||||
| Terracotta | `#C4785C` | `--terracotta` | `bg-terracotta` |
| Terracotta Hover | `#B56A4E` | `--terracotta-hover` | `bg-terracotta-hover` |
| Terracotta Light | `#D4917A` | `--terracotta-light` | `bg-terracotta-light` |
| **Secondary Accents** ||||
| Forest | `#4A6741` | `--forest` | `bg-forest` |
| Forest Light | `#5C7A53` | `--forest-light` | `bg-forest-light` |
| Ink | `#2C2416` | `--ink` | `text-ink` |
| Ink Light | `#4A3D2E` | `--ink-light` | `text-ink-light` |
| **Supporting Colors** ||||
| Dusty Rose | `#C9A9A6` | `--dusty-rose` | `text-dusty-rose` |
| Mustard | `#D4A84B` | `--mustard` | `text-mustard` |
| Slate Blue | `#6B7B8C` | `--slate-blue` | `text-slate-blue` |
| Rust (Error) | `#8B4D3B` | `--rust` | `text-rust` |
| Sage | `#A3B18A` | `--sage` | `text-sage` |

**Color Usage Guidelines:**
- **Cream** for page backgrounds
- **Parchment** for cards and elevated surfaces
- **Terracotta** for primary CTAs, links, and accents
- **Forest** for success states, secondary accents, and chart colors
- **Ink** for text and headings
- **Rust** for errors and destructive actions
- **Mustard** for warnings and "inquisitive" persona mode
- **Slate Blue** for muted/secondary text

### Typography

| Role | Font | CSS Variable | Usage |
|------|------|--------------|-------|
| Display/Headings | Jost | `--font-display` | H1-H4, buttons, badges |
| Body | Libre Baskerville | `--font-body` | Paragraphs, form inputs |
| Monospace | JetBrains Mono | `--font-mono` | Code, data, technical content |

**Loaded via next/font in layout.tsx**

**Typography Scale:**
- `--text-xs`: 0.75rem (12px) - Captions
- `--text-sm`: 0.875rem (14px) - Small text
- `--text-base`: 1rem (16px) - Body text
- `--text-lg`: 1.125rem (18px) - Large body
- `--text-xl`: 1.375rem (22px) - H3
- `--text-2xl`: 1.75rem (28px) - H2
- `--text-3xl`: 2.25rem (36px) - H1
- `--text-4xl`: 3rem (48px) - Display

**Line Heights:**
- Headings: `--leading-snug` (1.25)
- Body: `--leading-relaxed` (1.65)

### Spacing (8px Grid)

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `space-1` | 4px | `--space-1` |
| `space-2` | 8px | `--space-2` |
| `space-3` | 12px | `--space-3` |
| `space-4` | 16px | `--space-4` |
| `space-6` | 24px | `--space-6` |
| `space-8` | 32px | `--space-8` |
| `space-12` | 48px | `--space-12` |
| `space-16` | 64px | `--space-16` |

### Border Radius (Organic, Slightly Rounded)

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `radius-sm` | 4px | `--radius-sm` |
| `radius` | 8px | `--radius` |
| `radius-md` | 12px | `--radius-md` |
| `radius-lg` | 16px | `--radius-lg` |
| `radius-xl` | 24px | `--radius-xl` |

### Shadows (Warm, Soft - uses ink color)

| Level | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(44, 36, 22, 0.05)` | Subtle lift |
| `shadow` | `0 2px 8px rgba(44, 36, 22, 0.08)` | Cards, buttons |
| `shadow-md` | `0 4px 16px rgba(44, 36, 22, 0.1)` | Dropdowns, popovers |
| `shadow-lg` | `0 8px 32px rgba(44, 36, 22, 0.12)` | Modals, featured cards |

### Transitions

| Speed | Value | Usage |
|-------|-------|-------|
| `fast` | 150ms ease-out | Micro-interactions, hovers |
| `base` | 250ms ease-out | Standard transitions |
| `slow` | 400ms ease-out | Page transitions, large animations |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--terracotta);
  color: var(--cream);
  font-family: var(--font-display);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 150ms ease-out;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--terracotta-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 1.5px solid var(--ink);
  font-family: var(--font-display);
  padding: 12px 24px;
  border-radius: var(--radius);
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 150ms ease-out;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--ink);
  color: var(--cream);
}
```

### Cards

```css
.card {
  background: var(--parchment);
  border: 1px solid rgba(44, 36, 22, 0.1);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow);
  transition: all 200ms ease-out;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px) scale(1.02);
}
```

### Form Inputs

```css
.input {
  background: var(--cream);
  border: 1.5px solid rgba(44, 36, 22, 0.15);
  border-radius: var(--radius);
  padding: 12px 16px;
  font-family: var(--font-body);
  font-size: 16px;
  transition: all 150ms ease-out;
}

.input:focus {
  border-color: var(--terracotta);
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 120, 92, 0.15);
}

.input::placeholder {
  color: var(--slate-blue);
}
```

### Chat Interface

```css
/* User messages */
.chat-message-user {
  background: var(--terracotta);
  color: var(--cream);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-md);
}

/* Assistant messages */
.chat-message-assistant {
  background: var(--parchment);
  color: var(--ink);
  border: 1px solid rgba(44, 36, 22, 0.08);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) var(--radius-sm);
}

/* System messages */
.chat-message-system {
  background: var(--mustard-light);
  color: var(--ink);
  font-family: var(--font-display);
}
```

### Sub-Persona Mode Badges

```css
.mode-badge {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 9999px;
}

.mode-badge-inquisitive { background: rgba(212, 168, 75, 0.15); color: #D4A84B; }
.mode-badge-advocate { background: rgba(139, 77, 59, 0.15); color: #8B4D3B; }
.mode-badge-encouraging { background: rgba(201, 169, 166, 0.25); color: #8A6B68; }
.mode-badge-realistic { background: rgba(107, 123, 140, 0.15); color: #6B7B8C; }
```

---

## Style Guidelines

**Style:** Nature Distilled + Wes Anderson Warmth

**Keywords:** Muted earthy colors, terracotta, organic warmth, elegant serif/sans combination, soft shadows, handmade quality, thoughtful craft

**Best For:** Decision accelerators, strategic consulting, business analysis, coaching platforms

**Key Effects:**
- Subtle parallax on hero sections
- Natural easing (ease-out) on all transitions
- Soft shadows with warm undertones (ink color base)
- Gentle hover lifts (translateY + shadow increase)

### Page Pattern

**Pattern Name:** Minimal & Direct + Trust Signals

- **CTA Placement:** Above fold with clear value proposition
- **Section Order:** Hero > Social Proof > Features > Testimonials > CTA
- **Layout:** Single column centered (max-width 1200px)

---

## Anti-Patterns (Do NOT Use)

### Forbidden Colors
- ❌ Pure black (`#000000`) - Use ink (`#2C2416`) instead
- ❌ Pure white (`#FFFFFF`) for backgrounds - Use cream (`#FAF7F2`)
- ❌ Blue (`#3B82F6`, etc.) - Use terracotta or forest
- ❌ AI purple/pink gradients - Against brand identity
- ❌ Gray (`#6B7280`, etc.) - Use slate-blue or ink-light

### Forbidden Patterns
- ❌ **Emojis as icons** - Use SVG icons (Lucide icons preferred)
- ❌ **Missing cursor:pointer** - All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** - Avoid scale > 1.02 or transforms that reflow
- ❌ **Low contrast text** - Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** - Always use transitions (150-300ms)
- ❌ **Invisible focus states** - Focus states must be visible for a11y
- ❌ **Generic corporate style** - Maintain warm, distinctive aesthetic
- ❌ **Cold, clinical visuals** - Always favor organic warmth

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

### Visual Quality
- [ ] No emojis used as icons (use Lucide SVG instead)
- [ ] All colors from ThinkHaven palette (no blue, no pure black/white)
- [ ] Shadows use warm undertone (ink-based rgba)
- [ ] Typography uses Jost (display) and Libre Baskerville (body)
- [ ] Border radius follows organic scale (8-16px typical)

### Interaction
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] Loading states use parchment skeletons with pulse

### Accessibility
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] `prefers-reduced-motion` respected
- [ ] Form inputs have visible labels
- [ ] Images have alt text

### Responsive
- [ ] Works at 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Touch targets minimum 44x44px

---

## Design Reference Sites

For inspiration on execution:
- **Adaline** - Serene nature hero, minimal logo bar, clean CTAs
- **Turbopuffer** - Technical precision with warmth, single accent color
- **Notion** - Playful professional, product suite nav
- **Rows** - Warm technical, capability badges

See: `/Users/kthkellogg/Documents/GitHub/obsidian-vault/🧠 Knowledge Base/Sources/Design-References/`
