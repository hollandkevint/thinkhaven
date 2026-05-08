# ThinkHaven Design System

*Wes Anderson-inspired organic warmth meets strategic clarity*

## Design Philosophy

ThinkHaven's visual language draws inspiration from Wes Anderson's distinctive aesthetic: **symmetry with soul, warmth with precision, whimsy with purpose**. The design feels like a thoughtfully curated vintage study - a place where serious strategic thinking happens in an environment that sparks creativity rather than sterile corporate efficiency.

## Source of Truth

The runtime source of truth is `apps/web/app/globals.css` for CSS variables/component primitives and `apps/web/tailwind.config.cjs` for Tailwind utility tokens. The visual reference source is `docs/design/design-system.pen` plus the screen mocks under `docs/design/pages/`. This document explains how to apply those sources; if generated design docs disagree with runtime tokens, trust the runtime files and update the docs.

The April 2026 audit artifacts live at `docs/design/Design System Audit from Thinkhaven.md` and `docs/design/Design System Audit - Thinkhaven.html`. The core token/font drift called out there has been addressed in runtime code; the remaining guidance below captures the system-level gaps the audit identified.

### Core Principles

1. **Organic Warmth** - Warm neutrals and muted earth tones create a welcoming, human environment
2. **Deliberate Symmetry** - Clean layouts with intentional visual balance
3. **Typography as Character** - Futura-inspired sans-serif for headings, readable serif for body text
4. **Subtle Whimsy** - Playful touches that don't undermine professionalism
5. **Vintage-Modern Fusion** - Classic aesthetics with contemporary usability

---

## Color Palette

### Primary Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--cream` | #FAF7F2 | 38 40% 96% | Primary background |
| `--parchment` | #F5F0E6 | 40 45% 93% | Secondary background, cards |
| `--terracotta` | #C4785C | 18 45% 56% | Primary accent, CTAs |
| `--forest` | #4A6741 | 107 22% 34% | Success, secondary accent |
| `--ink` | #2C2416 | 38 35% 13% | Primary text |

### Supporting Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--dusty-rose` | #C9A9A6 | 6 23% 72% | Encouraging mode indicator |
| `--mustard` | #D4A84B | 42 62% 56% | Warning, attention |
| `--slate-blue` | #6B7B8C | 210 14% 48% | Muted text, borders |
| `--rust` | #8B4D3B | 15 41% 39% | Error, destructive actions |
| `--sage` | #A3B18A | 90 23% 62% | Subtle highlights |

### Mode Indicator Colors

| Mode | Color | Token |
|------|-------|-------|
| Inquisitive | Warm Gold | `--mode-inquisitive: #D4A84B` |
| Devil's Advocate | Deep Terracotta | `--mode-advocate: #8B4D3B` |
| Encouraging | Dusty Rose | `--mode-encouraging: #C9A9A6` |
| Realistic | Slate Blue | `--mode-realistic: #6B7B8C` |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | var(--forest) | Positive feedback, viability high |
| `--warning` | var(--mustard) | Cautions, viability medium |
| `--error` | var(--rust) | Errors, viability low, kill recommendations |
| `--info` | var(--slate-blue) | Neutral information |

### Color Ownership

Use color to signal one primary axis at a time.

- **Modes own semantic color.** Inquisitive, Devil's Advocate, Encouraging, and Realistic states use the mode tokens above wherever the user is meant to read behavioral state.
- **Board members own identity accents.** Member colors are limited to avatar fills, speaker borders, and small identity accents. Do not use member colors as state or mode colors.
- **When both appear together, mode wins.** A Victoria message in Inquisitive mode should use Victoria's identity accent for the avatar/border and the inquisitive token for the mode badge.
- **Mary remains the brand anchor.** Mary/facilitator identity uses terracotta, which also remains the primary CTA color.

---

## Typography

### Font Stack

**Primary (Headings):** Futura PT / Jost / Century Gothic
```css
--font-display: 'Jost', 'Futura PT', 'Century Gothic', sans-serif;
```

**Secondary (Body):** Libre Baskerville / Georgia
```css
--font-body: 'Libre Baskerville', 'Georgia', serif;
```

**Monospace (Code/Data):** JetBrains Mono / IBM Plex Mono
```css
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;
```

### Type Scale

| Element | Size | Weight | Line Height | Font |
|---------|------|--------|-------------|------|
| Display | 3rem (48px) | 500 | 1.1 | Display |
| H1 | 2.25rem (36px) | 500 | 1.2 | Display |
| H2 | 1.75rem (28px) | 500 | 1.25 | Display |
| H3 | 1.375rem (22px) | 500 | 1.3 | Display |
| H4 | 1.125rem (18px) | 600 | 1.35 | Display |
| Body | 1rem (16px) | 400 | 1.65 | Body |
| Body Large | 1.125rem (18px) | 400 | 1.6 | Body |
| Small | 0.875rem (14px) | 400 | 1.5 | Body |
| Caption | 0.75rem (12px) | 400 | 1.4 | Display |

### Typography Principles

- **Headings:** Futura-style sans-serif creates confident, modern authority
- **Body text:** Serif font improves readability for longer strategic content
- **Generous line height:** 1.65 for body text ensures comfortable reading
- **Letter spacing:** Keep body and heading letter spacing at `0`; use small positive tracking only for all-caps labels and captions

---

## Spacing System

Based on 8px grid with golden ratio influences.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem (4px) | Tight spacing, inline elements |
| `--space-2` | 0.5rem (8px) | Small gaps |
| `--space-3` | 0.75rem (12px) | Standard small |
| `--space-4` | 1rem (16px) | Base unit |
| `--space-5` | 1.25rem (20px) | Medium |
| `--space-6` | 1.5rem (24px) | Standard gaps |
| `--space-8` | 2rem (32px) | Section spacing |
| `--space-10` | 2.5rem (40px) | Large gaps |
| `--space-12` | 3rem (48px) | Major sections |
| `--space-16` | 4rem (64px) | Page sections |
| `--space-20` | 5rem (80px) | Hero spacing |

---

## Border Radius

Organic, slightly rounded corners - not too sharp, not too soft.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem (4px) | Small elements, tags |
| `--radius` | 0.5rem (8px) | Buttons, inputs |
| `--radius-md` | 0.75rem (12px) | Cards, containers |
| `--radius-lg` | 1rem (16px) | Modals, large cards |
| `--radius-xl` | 1.5rem (24px) | Feature sections |
| `--radius-full` | 9999px | Pills, avatars |

---

## Shadows

Soft, warm shadows that create depth without harshness.

```css
--shadow-sm: 0 1px 2px rgba(44, 36, 22, 0.05);
--shadow: 0 2px 8px rgba(44, 36, 22, 0.08);
--shadow-md: 0 4px 16px rgba(44, 36, 22, 0.1);
--shadow-lg: 0 8px 32px rgba(44, 36, 22, 0.12);
--shadow-inner: inset 0 2px 4px rgba(44, 36, 22, 0.04);
```

---

## Component Patterns

### Cards

```css
.card {
  background: var(--parchment);
  border: 1px solid rgba(44, 36, 22, 0.1);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}
```

### Buttons

**Primary:**
```css
.btn-primary {
  background: var(--terracotta);
  color: var(--cream);
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-6);
}
```

**Secondary:**
```css
.btn-secondary {
  background: transparent;
  color: var(--ink);
  border: 1.5px solid var(--ink);
  font-family: var(--font-display);
}
```

### Chat Interface

**User messages:**
```css
.chat-user {
  background: var(--terracotta);
  color: var(--cream);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-md);
}
```

**Assistant messages:**
```css
.chat-assistant {
  background: var(--parchment);
  color: var(--ink);
  border: 1px solid rgba(44, 36, 22, 0.08);
  border-radius: var(--radius-md) var(--radius-md) var(--radius-md) var(--radius-sm);
}
```

### Mode Indicators

Small, subtle badges that indicate current sub-persona mode:

```css
.mode-badge {
  font-family: var(--font-display);
  font-size: var(--text-caption);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}
```

### Viability Score

Visual indicator for kill decision framework:

```css
.viability-score {
  font-family: var(--font-display);
  font-weight: 600;
  /* Color based on score: forest (8-10), mustard (5-7), rust (1-4) */
}
```

---

## Animation

Subtle, purposeful animations that feel deliberate and slightly mechanical.

```css
--transition-fast: 150ms ease-out;
--transition-base: 250ms ease-out;
--transition-slow: 400ms ease-out;

--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
```

### Motion Principles

1. **Subtle over dramatic** - Animations enhance, never distract
2. **Natural easing** - Ease-out for entrances, ease-in-out for state changes
3. **Purposeful delay** - Stagger related elements for visual hierarchy
4. **Respect reduced motion** - Honor `prefers-reduced-motion`

### Motion Vocabulary

| Pattern | Timing | Usage |
|---------|--------|-------|
| `enter.fade-up` | 250ms, ease-out-expo, 8px translate | New chat messages, cards, small panels |
| `enter.stagger` | 40ms step, max 6 items | Session cards and Lean Canvas cells on initial load |
| `state.pulse` | 1.2s loop, 0.6 -> 1 opacity | "Mary is thinking" and pending viability indicators |
| `page.crossfade` | 400ms, ease-in-out | Dashboard to workspace transitions; parchment overlay, no slide |
| `hover.lift` | 150ms, ease-out, 2px rise | Clickable cards only |
| `commit.canvas-cell` | 250ms, ease-out-expo | Canvas cell fills or upgrades from empty to committed |

---

## Layout Rhythm

Use a 12-column grid for marketing and dashboard layouts, with constrained content widths rather than free-floating sections.

| Context | Max Width | Rhythm |
|---------|-----------|--------|
| Landing | 1200px | 72px section spacing desktop, 48px tablet, 32px mobile |
| App shell | 1400px | 40px dashboard/card rhythm, 24px panel rhythm |
| Chat/canvas | Full app shell | Compact density: 16px message rhythm, 12px control gaps |
| Modals | 480-720px | 24px internal padding, 16px stacked control rhythm |

Breakpoints: 640px, 768px, 1024px, 1400px. The chat/canvas split collapses below 768px; navigation stacks or becomes a compact menu below 640px.

---

## States & Feedback

Every reusable component should define default, hover, focus, disabled, and loading states before shipping. These are the baseline patterns:

| Component | Required States |
|-----------|-----------------|
| Button | Default, hover, focus ring, disabled opacity/cursor, loading spinner with stable width |
| Card | Default, hover lift for clickable cards, focus ring when keyboard reachable, loading skeleton, empty content |
| Input | Default, focus, error with rust border/message, disabled, optional icon prefix |
| Dialog | Open, close, loading submit, destructive confirmation, Escape/focus-trap behavior via Radix |
| Canvas cell | Empty, in-progress, explored, committed, error/retry |

### Empty, Loading, and Error Patterns

- **Empty states:** Illustration slot or monogram mark, concise headline, one ghost/secondary CTA. Use parchment panels on cream pages.
- **Loading states:** Parchment/cream shimmer, no blue or gray skeletons. Preserve final layout dimensions to prevent shift.
- **Error states:** Rust left accent or border, short plain-language message, inline retry when recovery is possible.

---

## Iconography

Use Lucide icons unless a custom product glyph is already established. Icons use 1.75-2px stroke, 16px inside compact controls, 20px in standard buttons, and 24px for panel headers. Icon color should inherit text color except destructive/error icons, which use rust.

---

## Wes Anderson Touches

### Symmetry

- Center-aligned hero sections
- Balanced two-column layouts
- Visual weight distribution

### Vintage Details

- Thin borders (1-1.5px) in muted colors
- Subtle texture overlays (optional, very light)
- Rounded corners that feel handcrafted

### Color Blocking

- Distinct but harmonious color zones
- Clear visual hierarchy through color
- Warm tones create cohesion

### Typography Personality

- Headlines feel confident and authoritative (Futura-style)
- Body text feels thoughtful and readable (Serif)
- Strategic use of ALL CAPS for small labels

---

## Screens & Components (.pen file)

The visual design source of truth is `docs/design/design-system.pen`. It contains all reusable components and screen mockups.

### Screens

| Screen | Description |
|--------|-------------|
| Landing Page | NavBar + Hero + Features (4 modes) + CTA section |
| Chat Interface | Sidebar (sessions list) + chat pane |
| Dashboard & Session Launcher | NavBar + sidebar + session cards + launcher |
| Trial Gate Paywall | Centered modal over NavBar, message limit warning |
| Chat Session + Lean Canvas | Split pane: chat left, 9-box canvas right |
| Pricing Page | NavBar + two-tier pricing cards (Free vs Pro) + FAQ |
| Guest Signup Modal | Overlay modal for guest conversion at message limit |
| Canvas Export + Session Title | Chat+canvas with export button and auto-title header |

### Reusable Components

| Component | Description |
|-----------|-------------|
| Button/Primary | Terracotta fill, cream text, 8px radius |
| Button/Secondary | Transparent, ink border 1.5px |
| Button/Ghost | Terracotta text only |
| Card | Parchment bg, subtle border + shadow, 12px radius |
| ModeBadge | Pill badge (9999px radius) for AI mode indicator |
| Input | Label + field with subtle border |
| ViabilityScore | Score/10 with forest green accent |
| NavBar | Logo + nav links + CTA button |
| ChatBubble/User | Terracotta bg, cream text, asymmetric radius |
| ChatBubble/Assistant | Parchment bg, ink text, subtle border |
| SessionTimer | Timer clock + phase progress indicators |
| Credit Balance | Session count + upgrade CTA (3 states) |

---

## Implementation Notes

### Font Loading

Fonts are loaded through `next/font/google` in `apps/web/app/layout.tsx`, not a raw `<link>` tag. The exported variables are `--font-display`, `--font-body`, and `--font-mono`.

### Dark Mode

ThinkHaven is intentionally light-only for now. Runtime CSS sets `color-scheme: light`; do not add `prefers-color-scheme: dark` variants without a designed "midnight study" palette.

### Accessibility

- All color combinations meet WCAG AA contrast (4.5:1 for body text)
- Terracotta on cream: 4.8:1 contrast ratio
- Ink on cream: 12.4:1 contrast ratio
- Focus states use a terracotta ring and must remain visible on cream, parchment, and white surfaces
- Keyboard navigation is required for Lean Canvas cells, dialog controls, and any menu/listbox interactions
- Honor `prefers-reduced-motion` for all named motion patterns

---

*This design system supports ThinkHaven's mission as a decision accelerator - warm enough to feel approachable, structured enough to feel professional, distinctive enough to be memorable.*
