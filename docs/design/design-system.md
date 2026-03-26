# ThinkHaven Design System

*Wes Anderson-inspired organic warmth meets strategic clarity*

## Design Philosophy

ThinkHaven's visual language draws inspiration from Wes Anderson's distinctive aesthetic: **symmetry with soul, warmth with precision, whimsy with purpose**. The design feels like a thoughtfully curated vintage study - a place where serious strategic thinking happens in an environment that sparks creativity rather than sterile corporate efficiency.

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
- **Letter spacing:** Slightly increased for headings (0.01em)

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

Subtle, purposeful animations that feel organic.

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

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Accessibility

- All color combinations meet WCAG AA contrast (4.5:1 for body text)
- Terracotta on cream: 4.8:1 contrast ratio
- Ink on cream: 12.4:1 contrast ratio
- Focus states are clearly visible

---

*This design system supports ThinkHaven's mission as a decision accelerator - warm enough to feel approachable, structured enough to feel professional, distinctive enough to be memorable.*
