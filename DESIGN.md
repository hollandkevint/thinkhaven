---
name: ThinkHaven
description: Decision architecture platform with Wes Anderson editorial warmth.
colors:
  cream: "#FAF7F2"
  parchment: "#F5F0E6"
  terracotta: "#C4785C"
  terracotta-hover: "#B56A4E"
  terracotta-light: "#D4917A"
  forest: "#4A6741"
  forest-light: "#5C7A53"
  ink: "#2C2416"
  ink-light: "#4A3D2E"
  slate-blue: "#6B7B8C"
  dusty-rose: "#C9A9A6"
  mustard: "#D4A84B"
  mustard-light: "#E0BC6A"
  rust: "#8B4D3B"
  sage: "#A3B18A"
  pathway-warm: "#F3EBE2"
  pathway-teal: "#C3DED8"
  pathway-slate: "#C4CFDE"
  pathway-sage: "#D5DCBA"
typography:
  display:
    fontFamily: "Jost, Futura PT, Century Gothic, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Jost, Futura PT, Century Gothic, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Jost, Futura PT, Century Gothic, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Jost, Futura PT, Century Gothic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  pane: "64px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-hover}"
    textColor: "{colors.cream}"
  button-secondary:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "44px"
  card:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "44px"
  mode-badge:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: ThinkHaven

## 1. Overview

**Creative North Star: "The Studied Hand."**

ThinkHaven looks like a thoughtful expert's working surface. Warm but never decorative. Vintage-modern fusion that signals "this was designed by someone who has thought about it for a long time, and stopped." The user is an executive or product leader who already has a position. The interface should feel like a senior strategist's notebook, not a SaaS landing page or a chatbot wrapper.

The palette is organic and earthen: cream and parchment for surfaces, terracotta for one strong accent, forest for the second, ink as the only text color. Typography pairs Jost (Futura-style geometric sans) with Libre Baskerville (a workhorse serif), so headings and prose read as different voices: heading is the strategist speaking, body is the document being written. Symmetry is deliberate but never sterile. Whimsy is allowed only when it earns its place.

The system rejects three things explicitly. Generic B2B SaaS (blue gradients, hero-metric templates, identical icon-card grids). Corporate consulting deliverables (navy + gold, dense chart-stacked decks, formal pyramid frameworks rendered as UI). Crypto / AI-bro hype (neon, glassmorphism, animated gradients, oversized type). If the interface could be mistaken for any of those, it has failed.

**Key Characteristics:**
- Cream over white. Always tinted, never pure.
- One accent doing the heavy lifting (terracotta), one supporting (forest), restrained color elsewhere.
- Serif body and geometric-sans headings, not the same font for both.
- Soft, warm, ink-tinted shadows. No hard drop shadows, no neon glow.
- Light theme only. Dark mode is not a default and is not implemented.
- Symmetry without sterility. Generous whitespace. Body line length capped at 65–75ch.

## 2. Colors: The Organic Warmth Palette

The palette is assembled like a curated still life: warm neutrals as backdrop, one strong accent for action, one quiet accent for resolution, supporting colors as small notes.

### Primary

- **Terracotta** (`#C4785C`): The single strong accent. Primary CTAs (buttons, key links), focus rings, brand anchor. Reserved for action and the brand's identity, not state.
- **Terracotta Hover** (`#B56A4E`): Hover state for terracotta surfaces. ~6% darker.
- **Terracotta Light** (`#D4917A`): Selection backgrounds, low-emphasis tints.

### Secondary

- **Forest** (`#4A6741`): Success states, secondary positive accents, "Casey" board member identity. Muted, grounded.
- **Forest Light** (`#5C7A53`): Quiet hover/secondary forest tones.

### Tertiary

- **Mustard** (`#D4A84B`): Warning, the "Inquisitive" persona mode, "Victoria" board identity. Confident yellow-ochre, never bright.
- **Dusty Rose** (`#C9A9A6`): The "Encouraging" persona mode, "Taylor" board identity. Pulled-back rose, never pink.
- **Slate Blue** (`#6B7B8C`): Muted text, the "Realistic" persona mode, "Elaine" board identity, info state, placeholder text.
- **Rust** (`#8B4D3B`): Errors, destructive actions, the "Devil's Advocate" persona mode. Deeper than terracotta; never substituted for it.
- **Sage** (`#A3B18A`): Subtle highlights, the shadcn `accent` token mapping.

### Neutral

- **Cream** (`#FAF7F2`): Default page background, the canvas of the entire system. Warm white, slightly yellow-shifted.
- **Parchment** (`#F5F0E6`): Card surfaces, secondary backgrounds, sidebar fills, the canvas pane in the dual-pane workspace. Slightly more chroma than cream.
- **Ink** (`#2C2416`): The only body-text color. A warm dark brown, not black.
- **Ink Light** (`#4A3D2E`): Secondary text on warm backgrounds. Distinct from slate-blue (which is the cool equivalent on parchment).
- **Divider** (`rgba(44, 36, 22, 0.12)`): The only border the system uses for separation. Quiet, ink-tinted, never a tinted accent.

### Pathway Backgrounds

A separate scale of pale tinted neutrals used only for pathway-card backgrounds (the entry-point cards in `/app/new`):

- **Pathway Warm** (`#F3EBE2`): A warmer cream, used as the default pathway tint.
- **Pathway Teal** (`#C3DED8`), **Pathway Slate** (`#C4CFDE`), **Pathway Sage** (`#D5DCBA`): Pale wash variants for differentiating pathways.

These are the only blue/teal/cool tones in the entire system, and they appear at very low chroma. They must never be used as a brand accent or a CTA color.

### Named Rules

**The One Accent Rule.** Terracotta is the only accent that earns saturation. It carries CTAs, focus rings, key links, and the Mary persona. Forest and the persona-mode colors are used in narrower roles. No two strong accents on the same screen unless one is identity (board member or persona) and the other is action.

**The No-Pure-Black, No-Pure-White Rule.** Pure `#000` and `#fff` are forbidden in any component, background, text, or border. Cream is the only "white." Ink is the only "black."

**The Modes-Win-Over-Identity Rule.** Persona mode color (Inquisitive / Devil's Advocate / Encouraging / Realistic) overrides board-member identity color when both are present. The mode badge wears the mode color; the avatar and member accents stay in identity color.

## 3. Typography

**Display Font:** Jost (with Futura PT, Century Gothic, system sans fallback). Geometric, slightly humanist, authoritative without coldness.

**Body Font:** Libre Baskerville (with Georgia fallback). A working serif. Reads as a real document, not as decoration.

**Mono Font:** JetBrains Mono (with IBM Plex Mono fallback). Used only for code samples, data, and technical artifacts; never for branding flourish.

**Character:** the pairing is the system's clearest signal. Display sets the strategist's voice (confident, geometric, modern); body sets the document's voice (reading-quality, classical, slow). Switching between them on the same screen creates the editorial register the brand depends on.

### Hierarchy

- **Display** (Jost 500, 3rem / 48px, line-height 1.1, tracking -0.01em): Hero headlines, dashboard top-level titles. One per screen at most.
- **Headline** (Jost 500, 2.25rem / 36px, line-height 1.25, tracking -0.01em): Page titles (`<h1>`).
- **Title** (Jost 500, 1.75rem / 28px, line-height 1.25): Section headers (`<h2>`).
- **Subtitle** (Jost 500, 1.375rem / 22px, line-height 1.3): Sub-section headers (`<h3>`).
- **Body** (Libre Baskerville 400, 1rem / 16px, line-height 1.65): All long-form prose. Cap line length at 65–75ch on the artifact reading surface. Generous line-height is non-negotiable for serif body legibility.
- **Body Large** (Libre Baskerville 400, 1.125rem / 18px, line-height 1.6): Lead paragraphs and longform-page intros only.
- **Small** (Libre Baskerville 400, 0.875rem / 14px, line-height 1.5): UI body text in dense surfaces (forms, lists, dialogs).
- **Label** (Jost 500, 0.75rem / 12px, line-height 1.4, tracking 0.05em, UPPERCASE): Mode badges, captions, small labels, button text.

### Named Rules

**The Two-Voice Rule.** Heading typography (Jost) and body typography (Libre Baskerville) are different voices on purpose. Never set body copy in Jost; never set headings in Baskerville. The contrast is the brand.

**The Tracking Rule.** Body and heading letter-spacing stays at `0` (or the small negative tracking shown above for display sizes). Positive tracking is reserved for all-caps labels and captions only. Wide tracking on title-case copy is forbidden.

**The Line-Length Rule.** Long-form artifact body content is capped at 65–75ch. Below this, serif body becomes claustrophobic; above this, eye-tracking breaks down between lines. This applies to the in-app artifact reader most strongly.

## 4. Elevation

The system is **flat-by-default with quiet ambient layering.** It does not use elevation as a primary affordance. Surfaces are differentiated by background color (cream vs. parchment) and by 1px ink-tinted dividers, not by shadow stacking. Shadows exist only as soft ambient lift on cards, dialogs, and floating elements. No hard drop shadows, no neon glows, no inner glow effects.

### Shadow Vocabulary

- **`shadow-sm`** (`0 1px 2px rgba(44, 36, 22, 0.05)`): Hairline lift. Used on subtle controls (buttons in some states, small chips). Often unnecessary.
- **`shadow`** (`0 2px 8px rgba(44, 36, 22, 0.08)`): The default card shadow. Quiet, warm, barely visible at rest.
- **`shadow-md`** (`0 4px 16px rgba(44, 36, 22, 0.10)`): Lifted state for cards on hover, popovers at rest.
- **`shadow-lg`** (`0 8px 32px rgba(44, 36, 22, 0.12)`): Modals, dialogs, dropdown menus when open.
- **`shadow-inner`** (`inset 0 2px 4px rgba(44, 36, 22, 0.04)`): Reserved for inset states (depressed buttons, focused input wells). Use sparingly.

All shadow alpha colors are ink-tinted (`rgba(44, 36, 22, X)`), never neutral gray and never pure black. This is what makes them feel warm.

### Named Rules

**The Warm-Shadow Rule.** Every shadow is keyed to the ink color. `rgba(0, 0, 0, X)` is forbidden in shadow definitions. Cool/gray shadows immediately register as off-brand.

**The Flat-At-Rest Rule.** Cards rest with `shadow` (low) or no shadow at all. Hover and active states may lift to `shadow-md`. Reserve `shadow-lg` for floating UI (dialogs, dropdowns, popovers) only.

## 5. Components

### Buttons

- **Shape:** moderately rounded (8px / `rounded.md`). Never pill, never sharp 0px.
- **Primary:** terracotta background, cream text, label typography (Jost 500, 12px tracking 0.05em UPPERCASE) at 12px / 24px padding, 44px tall. Hover darkens to terracotta-hover. Active state scales to 0.98.
- **Secondary:** parchment background, ink text, otherwise identical to primary. Used when the page has a stronger primary action elsewhere.
- **Ghost:** transparent background, ink text, accent-tinted hover. Used for tertiary actions, navigation back-links, and toolbar controls.
- **Destructive:** rust background, cream text. Reserved for delete / kill / remove. Never used for a generic "secondary" action.
- **Focus:** terracotta ring (3px outer ring, 50% opacity) on `:focus-visible` only.
- **Distinctive behavior:** active scale-down to 0.98 on press, 200ms transition on color. No bouncy easing. No translate-y lift.

### Cards

- **Corner Style:** 12px radius (`rounded.lg`).
- **Background:** parchment (`#F5F0E6`).
- **Border:** 1px solid `rgba(44, 36, 22, 0.10)`. The border is the workhorse — shadows are secondary.
- **Shadow Strategy:** flat-at-rest (`shadow`) at 0.08 ink alpha. Hover lifts to `shadow-md`.
- **Internal Padding:** 24px default. Dense card variants may go to 16px.
- **Nested cards are forbidden.** A card inside a card is always wrong; restructure with dividers, headers, or sections instead.

### Inputs / Fields

- **Background:** cream (`#FAF7F2`). Distinct from card bg so inputs read as wells, not as tints on parchment.
- **Border:** 1.5px solid `rgba(44, 36, 22, 0.15)`. Border weight is structural — thinner reads as a placeholder line, not an input.
- **Radius:** 8px.
- **Padding:** 12px / 16px, 44px tall (matches button height).
- **Focus:** terracotta border, 3px terracotta ring at 15% opacity. No glow, no animation.
- **Placeholder:** slate-blue text (cool muted, distinct from body ink).
- **Error:** rust border, rust ring. Error message in rust, body small typography, with an inline icon.

### Mode Badges

The signature persona-state badge. Pill-shaped (`rounded.full`), label typography (Jost 500, 12px tracking 0.05em UPPERCASE), 4px / 12px padding. Background is the persona's mode color at high lightness; text is the persona's mode color at full saturation. Mode color always pairs with the mode name written out — color is never the sole carrier of state.

### Dual-Pane Workspace

The app's signature layout. The session screen splits horizontally: chat pane (cream background, 60% width minimum 400px) on the left, canvas pane (parchment background, 40% width minimum 300px) on the right, separated by a 1px ink-tinted divider that the user can drag. The divider hovers terracotta. The canvas pane collapses to 0% with the chat expanding to full width when no canvas content exists. Single-column on viewports under 768px (60vh chat / 40vh canvas, divider becomes horizontal).

### Pathway Cards

Entry-point cards on `/app/new`, one per pathway (new idea, business model, feature refinement). Each card uses one of the four pathway tint backgrounds (`pathway-warm`, `pathway-teal`, `pathway-slate`, `pathway-sage`) at very low chroma. These are the only places pale teal / slate / sage tones appear as fills.

### Navigation

Top nav uses parchment background, ink text, no shadow at rest. Active route is rendered in terracotta with the route label still in its standard typography (no underline, no pill background — the color carries the state). Mobile nav collapses to a hamburger that opens an overlay using `shadow-lg`.

## 6. Do's and Don'ts

### Do:

- **Do** lead every screen with cream (`#FAF7F2`) as the page background. Pure white is forbidden.
- **Do** use ink (`#2C2416`) for all body text, ink-light (`#4A3D2E`) for secondary text on cream/parchment, and slate-blue (`#6B7B8C`) for muted UI text only.
- **Do** pair Jost (display, geometric sans) with Libre Baskerville (body, serif). The two-voice contrast is the brand.
- **Do** cap long-form artifact body copy at 65–75ch.
- **Do** keep terracotta as the single strong accent. CTAs, focus rings, key links.
- **Do** keep shadows ink-tinted (`rgba(44, 36, 22, X)`), warm and quiet.
- **Do** use `@radix-ui/react-dialog` for every new modal (focus trap, escape, aria-modal). Hand-rolled modals are tracked for migration.
- **Do** respect `prefers-reduced-motion`: all transitions become instant, animations cease.

### Don't:

- **Don't** use pure black (`#000`) or pure white (`#fff`) anywhere — fills, text, borders, shadows. The cream/ink axis replaces both.
- **Don't** use blue gradients, indigo accents, or the `from-blue-50 to-indigo-100` Next.js starter palette. The 2020-era SaaS aesthetic is the explicit anti-reference. (See PRODUCT.md anti-references.)
- **Don't** use navy + gold consulting-deck color schemes (anti-reference: McKinsey/Bain decks).
- **Don't** use neon, animated gradients, glassmorphism, or any "AI/crypto-bro" visual cue (anti-reference).
- **Don't** use side-stripe borders greater than 1px as a colored accent on cards, list items, or messages. (The current `.board-speaker-message` class uses `border-left: 3px solid var(--board-mary)`, which violates this rule and is tracked for replacement.)
- **Don't** use gradient text (`background-clip: text` over a gradient). Emphasis comes from weight and size.
- **Don't** use glassmorphism, backdrop-blur, or "frosted" glass cards. Solid parchment surfaces only.
- **Don't** apply animated background gradients, scroll-driven gradient sweeps, or any "kinetic background" effect.
- **Don't** wrap everything in a container or a card. Most things are fine on the cream surface with quiet hierarchy.
- **Don't** stack identical icon-card grids (the four-icon SaaS feature row). If two cards are doing the same thing, change the structure.
- **Don't** treat dark mode as a default. Dark mode is not implemented. The system is light by design; if a dark variant is needed it must be designed deliberately, not generated.
- **Don't** use `bg-secondary` for text or as a text-bearing background by mistake — `--secondary` maps to parchment (a background color), so `text-secondary` produces invisible text on cream/parchment surfaces. Use `text-muted-foreground` (slate-blue) or `text-ink-light` instead.
- **Don't** import Mermaid, Excalidraw, or any heavy library at module scope in pages rendered on every navigation. Use `next/dynamic({ ssr: false })`.
- **Don't** use bouncy or elastic motion curves. The system uses ease-out at 150ms / 250ms / 400ms for all state transitions.
- **Don't** use modal as a first thought. Exhaust inline and progressive disclosure before reaching for a dialog.
