# ThinkHaven Design System Audit

*Prepared April 2026 · reviewing `docs/design/design-system.md`, `docs/design-conventions.md`, `app/globals.css`, `app/page.tsx`, `app/dashboard/`, `app/workspace/`, `app/components/bmad/*`*

## Executive summary

The documented Wes Anderson system is strong on paper. The shipped product doesn't know about it yet.

- **11 high-priority drifts** between docs and code
- **7 gaps** in the documented system itself
- **5 strengths** to preserve
- Overall grade: **B−** (would be A− if implementation matched)

The documented design (`design-system.md`) is genuinely distinctive — warm, calm, legible, with real opinions about typography and color. The problem is execution: the implementation layer still ships a generic blue/slate Next.js starter theme.

---

## 01 · Findings

### F-01 · Critical · `globals.css` ships the generic starter palette, not the Wes Anderson one

Every page imports `app/globals.css`. That file still defines `--primary: #2563eb`, `--chat-user-bg: #eff6ff`, `--canvas-pane: #f8fafc`, and a full `prefers-color-scheme: dark` block. None of `--cream`, `--terracotta`, `--ink` exist at runtime.

```
app/globals.css  →  --primary: #2563eb;
                    --chat-user-bg: #eff6ff;
                    --canvas-pane: #f8fafc;
body { font-family: Arial, Helvetica, sans-serif; }   ← Jost/Baskerville never loaded
```

**Fix:** Replace `globals.css` wholesale with the token block from `design-system.md` + the Google Fonts import. Delete the dark-mode block (the system is light-only by design) or explicitly design a dark variant first.

---

### F-02 · Critical · Custom Tailwind utilities don't resolve — no config extends them

`docs/design-conventions.md` instructs engineers to use `bg-terracotta`, `text-ink-light`, `hover:bg-parchment`, etc. But there is no `tailwind.config.*` in the repo, and `globals.css`'s `@theme inline` block only declares the blue/slate tokens. These class names either silently do nothing or collide with Tailwind defaults.

```
$ find thinkhaven -name "tailwind.config.*"  →  (no matches)
```

**Fix:** Under Tailwind v4, register each palette token inside the `@theme` block as `--color-cream: #FAF7F2;` etc. Then `bg-cream`, `text-terracotta`, `border-ink` all work. Also register `--font-display`, `--font-body`, `--font-mono` and spacing tokens so the documented utility classes match reality.

---

### F-03 · Critical · `app/page.tsx` (public landing) is still the starter template

First impression to every visitor. Uses `bg-gradient-to-br from-blue-50 to-indigo-100`, `text-gray-900`, `bg-blue-100` icon chips, `bg-gray-900` footer — all explicitly banned by the "Never Use" section of design-conventions.md.

```
app/page.tsx:43   bg-gradient-to-br from-blue-50 to-indigo-100
app/page.tsx:47   text-5xl font-bold text-gray-900
app/page.tsx:59   bg-blue-100 … text-blue-600
app/page.tsx:171  bg-gray-900 text-white   ← footer
```

**Fix:** Rebuild from `docs/design/pages/screen-dashboard-simplified.png` as the reference: cream page, NavBar with terracotta "Get Started", Jost hero, four mode features, Libre Baskerville body copy. One-shot replacement — don't incrementally recolor.

---

### F-04 · Critical · BMAD components (core product surface) use blue/purple gradients and banned grays

These are the components users sit inside during a strategic session.

```
BmadInterface.tsx:277   bg-gradient-to-br from-blue-500 to-purple-600
ElicitationPanel.tsx:88  'analysis':  'bg-blue-100 text-blue-800 …'
                         'strategy':  'bg-purple-100 text-purple-800 …'
PathwaySelector.tsx:188  <svg className="text-purple-500" …>
```

**Fix:** Map category → palette token (analysis→slate-blue, strategy→forest, creative→dusty-rose, default→ink-light). Replace blue-purple gradients with `bg-terracotta` solid, or a terracotta↔rust gradient if you need gradation. Ship chat + canvas + elicitation alignment as one PR.

---

### F-05 · High · Dashboard and Workspace pages use banned grays

`app/dashboard/page.tsx` has `bg-gradient-to-r from-blue-50 to-indigo-50`, `text-gray-900`, `hover:bg-gray-50`, `bg-gray-100`. The gray-replacement map already exists in `design-conventions.md` — the codebase just hasn't applied it.

**Fix:** Run a codemod/find-replace against the gray-replacement map. Ship as a single PR titled "align app to design system — part 1: grays".

---

### F-06 · High · Dark mode exists in code but not in the design system

`globals.css` has a full `@media (prefers-color-scheme: dark)` block with inverted blues. Neither design-system.md nor the mocks mention dark mode. Users on a dark OS get a broken, half-branded experience.

**Fix:** Decide: (a) ship light-only — remove the dark block and add `color-scheme: light`; or (b) intentionally design a "midnight study" dark variant (deep ink background, warmed cream text, muted terracotta).

---

### F-07 · High · Jost / Libre Baskerville / JetBrains Mono are never actually loaded

`globals.css` body rule says `font-family: Arial, Helvetica, sans-serif;`. No Google Fonts link in `app/layout.tsx`, no `next/font` import. Every "on-brand" class still renders in Arial.

**Fix:** Use `next/font/google` in `app/layout.tsx` to load Jost (400/500/600), Libre Baskerville (400/700 + italic), JetBrains Mono (400/500). Expose as `--font-display`, `--font-body`, `--font-mono` CSS variables.

---

### F-08 · Medium · Motion is named but never specified

design-system.md lists three durations and two easings. Nothing tells a developer *when* to use which. For a "Wes Anderson" system, motion is half the personality — deliberate, symmetrical, slightly mechanical.

**Fix:** Add named patterns: `enter.fade-up` (250ms, ease-out-expo, 8px translate), `enter.stagger` (40ms step), `state.pulse` (pending viability), `page.crossfade` (400ms), `hover.lift` (150ms, 2px rise), `commit.canvas-cell`.

---

### F-09 · Medium · "Board member colors" and "Mode colors" overlap and compete

design-conventions.md assigns mustard to Victoria. design-system.md assigns mustard to Inquisitive mode. On a screen showing Victoria in Inquisitive mode, the signal collapses.

**Fix:** Pick one axis as the primary color-carrier. Recommendation: **modes carry color** (visible on every message); **board members carry shape/avatar** (monogram + role label on terracotta). Update both docs to agree.

---

### F-10 · Medium · Component states are under-specified

Buttons list primary/secondary/ghost/danger/disabled but disabled is a one-line snippet. Cards have one style, no loading skeleton, no error state, no empty-state pattern. Inputs have default + focus but no error, no with-icon, no disabled.

**Fix:** For each component type, specify 5 states: default / hover / focus / disabled / loading. Add empty-state pattern (illustration slot + headline + ghost CTA) and error-state pattern (rust left-accent, inline retry).

---

### F-11 · Medium · Layout rhythm is absent

Spacing tokens exist but there's no guidance on *composition*: column grid, vertical rhythm, when to use 16px vs 24px gaps. Breakpoints appear only as `--screen-dual-pane: 768px` in globals.css.

**Fix:** 12-col grid on 1200/1400 max-widths, 72px section spacing on landing, 40px card rhythm in dashboard, breakpoints at 640/768/1024/1400. Document "density modes" — compact (chat, canvas cells) vs generous (landing, dashboard).

---

## 02 · Token drift — documented vs. shipped

| | Documented (Wes Anderson) | Shipped (`globals.css`) |
|---|---|---|
| Primary | `#C4785C` terracotta | `#2563eb` blue |
| Background | `#FAF7F2` cream | `#ffffff` pure white |
| Secondary bg | `#F5F0E6` parchment | `#fafafa` / `#f8fafc` |
| Text | `#2C2416` ink | `#171717` neutral |
| Accent | `#4A6741` forest | `#0ea5e9` sky blue |
| Secondary | `#6B7B8C` slate blue | `#64748b` tailwind slate |
| Chat user bg | `#C4785C` terracotta | `#eff6ff` blue-50 |
| Chat AI bg | `#F5F0E6` parchment | `#f0f9ff` sky-50 |
| Body font | Libre Baskerville | Arial |
| Heading font | Jost | Arial |

---

## 03 · System gaps

| Area | Status | What's missing |
|---|---|---|
| Dark mode | Missing | No decision documented. Implementation ships an off-brand auto variant. |
| Empty states | Missing | No pattern for "no sessions yet", "canvas not explored", "search empty". |
| Loading / skeletons | Missing | `loading-shimmer` is used in `page.tsx` but never specified. |
| Iconography | Missing | No rules for stroke width, filled vs line, size scale, color. |
| Data viz | Weak | Viability score covered. Canvas cell states, progress bars, charts absent. |
| Motion tokens → patterns | Weak | Durations exist; actual patterns don't. |
| Focus / a11y | Weak | No documented focus ring, no keyboard nav rules for Lean Canvas. |
| Content voice | Weak | Strong tone in mocks but not codified. |
| Layout grid | Missing | Spacing scale exists, composition doesn't. |
| Board member avatars | Weak | Colors listed but no visual spec. Mocks show `M` on terracotta. |
| Responsive rules | Missing | Dual-pane collapses at 767px — but no rules for NavBar, Canvas, sidebar. |

---

## 04 · Proposed motion vocabulary

| Pattern | Timing | Usage |
|---|---|---|
| `enter.fade-up` | 250ms, ease-out-expo, 8px translate | New chat messages, card appearance |
| `page.crossfade` | 400ms, ease-in-out, parchment overlay | Dashboard ↔ workspace |
| `enter.stagger` | 40ms step, max 6 | Session cards, canvas cells on load |
| `state.pulse` | 1.2s loop, 0.6→1.0 opacity | "Mary is thinking" indicator |
| `hover.lift` | 150ms ease-out, 2px rise | Cards — shadow deepens one step |
| `commit.canvas-cell` | 250ms ease-out-expo | Cell fills, parchment→terracotta border pulse |

---

## 05 · Next steps (sequenced)

### 01 · Make the tokens real (1 day)
Rewrite `app/globals.css` to define Wes Anderson tokens in `@theme`. Load Jost / Libre Baskerville / JetBrains Mono via `next/font` in `app/layout.tsx`. Delete the dark-mode block. **Unblocks every subsequent change.** (F-01, F-02, F-07)

### 02 · Replace the landing page in one shot (1 day)
Don't incrementally recolor `app/page.tsx` — rebuild from the dashboard mock. Ship as a throwaway of the current page. (F-03)

### 03 · Gray + blue codemod across the app (½ day)
Apply the replacement map in `design-conventions.md` mechanically. After this, no file contains a raw `blue-`, `indigo-`, `purple-`, or `gray-` class outside syntax highlighting. (F-04, F-05)

### 04 · Resolve the mode-vs-member color clash (2 hr)
Decide: modes own color, members own shape (avatar monograms on terracotta). Update both docs. (F-09)

### 05 · Specify the missing patterns (2–3 days)
Empty states, loading skeletons, error states, focus rings, motion patterns, iconography rules, voice guide. One page each under `docs/design/patterns/*.md`. (F-08, F-10, F-11)

### 06 · Establish a single source of truth (ongoing)
You have three overlapping docs (`design-system.md`, `design-conventions.md`, `lovable-portfolio-styles.css`) plus a `.pen` file and PNG mocks. Pick one as canonical — suggest `design-system.md` + a live `/design` route in the app. Conventions becomes a short "do/don't" cheatsheet linking to canonical spec.

### 07 · Guard against regression (½ day)
ESLint/Stylelint rule that fails CI on banned classes (`bg-blue-*`, `text-gray-*`, `from-indigo-*`). A regex rule is enough. Only way the system stays aligned as the product grows.

---

## 06 · Strengths to preserve

- **S-01 · A genuine aesthetic point of view.** "Vintage study where serious strategic thinking happens" is specific, memorable, differentiated. Don't water it down in pursuit of neutrality.
- **S-02 · Serif body copy.** Libre Baskerville in a chat product is opinionated and correct — reads as considered prose, not throwaway messaging.
- **S-03 · Mode colors are distinct and meaningful.** Mustard/Rust/Rose/Slate-blue map intuitively and all coexist on a cream page without competing.
- **S-04 · Existing mocks are on-spec and usable.** The PNGs in `docs/design/pages/` already demonstrate the system. Use them as the specification source when rebuilding.
- **S-05 · Semantic viability scale.** Forest/mustard/rust mapped to 8–10 / 5–7 / 1–4 gives a viability language that's pre-cognitive. Extend to canvas cell states and trial-credit states.

---

*End of audit.*
