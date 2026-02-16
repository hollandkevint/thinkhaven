---
title: Design System Audit & Hardening
type: refactor
date: 2026-02-15
brainstorm: docs/brainstorms/2026-02-15-design-system-audit-brainstorm.md
---

# Design System Audit & Hardening

Eliminate every "GenAI-built" visual signal from ThinkHaven. Replace all blue/gray/purple defaults with the Wes Anderson palette, delete demo pages, and create a design conventions doc.

49 files currently use off-brand colors. The tester flow (Signup → Session → Dashboard) has jarring color transitions between warm cream pages and cold blue/white pages.

## Acceptance Criteria

- [ ] Zero `from-blue-50 to-indigo-100` gradients anywhere in the app
- [ ] Zero `bg-blue-*` classes outside of syntax highlighting
- [ ] Session welcome card uses terracotta/parchment (not blue)
- [ ] Mary avatar is `bg-terracotta` on all pages (not blue-500 or #6b6b6b)
- [ ] WaitlistForm uses terracotta button (not blue-600)
- [ ] Login/Signup pages use `bg-cream` background (not white)
- [ ] Auth pages use `font-display` for headings, palette colors for errors/success
- [ ] Demo pages deleted, all references removed or redirected to `/try`
- [ ] Copyright year updated to 2026
- [ ] Error/success/warning states use palette colors consistently
- [ ] MarkdownRenderer blockquotes/links use palette colors (not blue)
- [ ] Design conventions doc exists at `docs/design-conventions.md`
- [ ] `npm run build` passes

## Color Mapping Reference

Use this table for every replacement:

| Off-brand class | Wes Anderson replacement | Context |
|----------------|------------------------|---------|
| `from-blue-50 to-indigo-100` | `bg-cream` | Page backgrounds |
| `bg-blue-600` / `bg-blue-500` | `bg-terracotta` | Buttons, avatars, accents |
| `hover:bg-blue-700` | `hover:bg-terracotta-hover` | Button hover |
| `bg-blue-50` | `bg-parchment` | Light accent backgrounds |
| `bg-blue-100` | `bg-terracotta/10` | Subtle accent |
| `border-blue-200` / `border-blue-300` | `border-ink/8` | Borders |
| `text-blue-600` / `text-blue-700` | `text-terracotta` | Accent text |
| `text-blue-800` / `text-blue-900` | `text-ink` | Dark text |
| `focus:ring-blue-500` | `focus:ring-terracotta` | Focus rings |
| `focus:border-blue-500` | `focus:border-terracotta` | Focus borders |
| `from-blue-500 to-purple-600` | `bg-terracotta` | Gradient avatars → solid |
| `bg-gray-50` | `bg-parchment` | Light backgrounds |
| `bg-gray-100` | `bg-parchment` | Skeleton/muted backgrounds |
| `bg-gray-200` | `bg-ink/10` | Progress bar tracks, skeletons |
| `border-gray-200` / `border-gray-300` | `border-ink/8` | Borders |
| `text-gray-400` | `text-slate-blue/60` | Placeholder text |
| `text-gray-500` | `text-slate-blue` | Muted text |
| `text-gray-600` | `text-ink-light` | Secondary text |
| `text-gray-700` | `text-ink-light` | Body text |
| `text-gray-800` / `text-gray-900` | `text-ink` | Primary text |
| `hover:bg-gray-50` | `hover:bg-parchment` | Hover states |
| `hover:border-gray-400` | `hover:border-ink/20` | Hover borders |
| `bg-white` (page bg) | `bg-cream` | Full-page backgrounds |
| `bg-white` (card interior) | `bg-white` (keep) | Cards on cream = OK |
| `#ef4444` / `text-red-500` | `text-rust` / `var(--error)` | Error states |
| `#f59e0b` / `text-orange-500` | `text-mustard` | Warning states |
| `#10b981` / `text-green-500` | `text-forest` / `var(--success)` | Success states |
| `text-yellow-500` / `text-yellow-800` | `text-mustard` | Warning text |
| `bg-yellow-50` / `border-yellow-200` | `bg-mustard/10 border-mustard/20` | Warning containers |
| `border-blue-600` (spinner) | `border-terracotta` | Loading spinners |
| `backgroundColor: '#6b6b6b'` | `bg-terracotta` | Mary avatar |
| `rgba(0, 121, 255, 0.1)` | `bg-terracotta/10` | User message bubble tint |

## Phase 1: Session Page (Highest Impact)

The session workspace is where users spend the most time. Fix the welcome card, Mary avatar, user message bubbles, and the BMad tab icon.

### Task 1.1: Retheme session welcome card

**File**: `app/app/session/[id]/page.tsx` lines 690-760

Replace all blue classes in the welcome card:
- `bg-blue-50` → `bg-parchment`
- `border border-blue-200` → `border border-ink/8`
- `bg-blue-500` (Mary avatar) → `bg-terracotta`
- `text-blue-900` → `text-ink`
- `text-blue-700` → `text-ink-light`
- `bg-white hover:bg-blue-100 border border-blue-200` (suggestion buttons) → `bg-white hover:bg-parchment border border-ink/8`
- `text-blue-800 hover:text-blue-900` → `text-ink-light hover:text-ink`
- `bg-blue-100` (tip box) → `bg-terracotta/10`
- `text-blue-800` (tip text) → `text-ink`
- `border border-blue-300` (kbd) → `border border-ink/15`

### Task 1.2: Fix Mary avatar color on session page

**File**: `app/app/session/[id]/page.tsx`

- Line 692: `bg-blue-500` → `bg-terracotta`
- Line ~807: `backgroundColor: '#6b6b6b'` → `backgroundColor: 'var(--terracotta)'` or use className `bg-terracotta`

### Task 1.3: Fix user message bubble tint

**File**: `app/app/session/[id]/page.tsx`

- Line ~789: `backgroundColor: 'rgba(0, 121, 255, 0.1)'` → use design token (terracotta/10 or parchment)
- Line ~659: `backgroundColor: 'rgba(0, 121, 255, 0.1)'` → same fix for message count badge

### Task 1.4: Fix BMad tab gradient icon

**File**: `app/app/session/[id]/page.tsx`

- Line 674: `bg-gradient-to-br from-blue-500 to-purple-600` → `bg-terracotta`

### Task 1.5: Fix streaming message loading bubble

**File**: `app/app/session/[id]/page.tsx`

- Line ~877: `bg-gray-100` → `bg-parchment`

### Task 1.6: Fix strategic tag badges

**File**: `app/app/session/[id]/page.tsx`

- Lines ~888-889: `backgroundColor: 'rgba(0, 121, 255, 0.1)'` → `bg-ink/5 text-ink`

## Phase 2: Chat Components

These appear inside every session and guest mode chat.

### Task 2.1: Retheme MarkdownRenderer blockquotes and links

**File**: `app/components/chat/MarkdownRenderer.tsx`

- Line 114: `border-blue-500 bg-blue-50` → `border-terracotta bg-terracotta/5`
- Line 116: `text-blue-500` → `text-terracotta`
- Line 119: `text-blue-900` → `text-ink`
- Line 138: `text-blue-600 hover:text-blue-800 decoration-blue-200 hover:decoration-blue-400` → `text-terracotta hover:text-terracotta-hover decoration-terracotta/30 hover:decoration-terracotta/60`
- Lines 151, 157, 162, 167: Replace `gray-200`, `bg-gray-50`, `bg-white`, `hover:bg-gray-50` in table elements with palette equivalents

**Keep**: `prose-code:bg-gray-100`, `!bg-gray-900` (syntax highlighting backgrounds are intentionally neutral for code readability). Also keep `bg-gray-800/80` language label in code blocks.

### Task 2.2: Retheme MessageInput

**File**: `app/components/chat/MessageInput.tsx`

- Line 233: `hover:bg-gray-50` → `hover:bg-parchment`
- Line 243: `hover:bg-gray-50` → `hover:bg-parchment`
- Line 255: `focus-within:ring-blue-200 focus-within:border-blue-300` → `focus-within:ring-terracotta/20 focus-within:border-terracotta/30`
- Line 266: `placeholder:text-gray-400` → `placeholder:text-slate-blue/60`
- Line 281: `bg-blue-50` → `bg-terracotta/10`
- Line 282: `text-gray-400 hover:text-secondary hover:bg-gray-50` → `text-slate-blue/60 hover:text-secondary hover:bg-parchment`
- Line 294: `text-orange-500` → `text-mustard`; `text-gray-400` → `text-slate-blue/60`
- Line 307: `text-gray-400 bg-gray-100` → `text-slate-blue/60 bg-parchment`
- Line 320: `text-gray-500` → `text-slate-blue`

### Task 2.3: Retheme StreamingMessage avatar

**File**: `app/components/chat/StreamingMessage.tsx`

- Line ~192: `bg-gradient-to-br from-blue-500 to-purple-600` → `bg-terracotta`
- Fix any other `gray-*` references for hover states

### Task 2.4: Retheme TypingIndicator avatar

**File**: `app/components/chat/TypingIndicator.tsx`

- Line 42: `bg-gradient-to-br from-blue-500 to-purple-600` → `bg-terracotta`

### Task 2.5: Retheme ChatInterface avatar

**File**: `app/components/chat/ChatInterface.tsx`

- Line ~361: `bg-gradient-to-br from-blue-500 to-purple-600` → `bg-terracotta`

### Task 2.6: Retheme MessageHistorySidebar

**File**: `app/components/chat/MessageHistorySidebar.tsx`

Replace all `gray-*` and `bg-white` references with palette equivalents. Key patterns:
- `bg-white` → keep for sidebar background (card-like container)
- `hover:bg-gray-50` → `hover:bg-parchment`
- `text-gray-500` → `text-slate-blue`
- `text-gray-400` → `text-slate-blue/60`

### Task 2.7: Retheme remaining chat components

Files: `QuickActions.tsx`, `BookmarksPanel.tsx`, `BranchDialog.tsx`, `ExportDialog.tsx`, `MessageActionMenu.tsx`

Apply same gray-* → palette mappings as above.

## Phase 3: Auth & Public Pages

### Task 3.1: Retheme Login page

**File**: `app/login/page.tsx`

- Line 70: `bg-white` → `bg-cream`
- Line 87: `hover:border-gray-400` → `hover:border-ink/20`
- Line 165: `color: 'var(--muted)'` → keep (maps correctly)
- Line 174-178: Error message `rgba(239, 68, 68, 0.05)` → `bg-rust/5`; `border: '1px solid var(--error)'` → keep; `color: 'var(--error)'` → keep
- Line 220: `bg-gray-200 animate-pulse` → `bg-ink/10 animate-pulse`
- Add `font-display` to heading/label elements

### Task 3.2: Retheme Signup page

**File**: `app/signup/page.tsx`

- Line 95: `bg-white` → `bg-cream`
- Line 112: `hover:border-gray-400` → `hover:border-ink/20`
- Lines 198-227: Password strength indicator — replace `#ef4444` → `var(--error)`, `#f59e0b` → `var(--warning, #D4A84B)`, `#10b981` → `var(--success, #4A6741)`
- Lines 232-241: Success message — `rgba(16, 185, 129, 0.05)` → `bg-forest/5`; `#10b981` → `var(--success)`
- Lines 245-256: Error message — `rgba(239, 68, 68, 0.05)` → `bg-rust/5`; `#ef4444` → `var(--error)`
- Line 198: `bg-gray-200` → `bg-ink/10`
- Add `font-display` to heading/label elements

### Task 3.3: Retheme Waitlist page

**File**: `app/waitlist/page.tsx`

Full retheme — replace every class:
- `bg-gradient-to-br from-blue-50 to-indigo-100` → `bg-cream`
- `bg-white rounded-2xl shadow-xl` → `bg-white rounded-2xl shadow-sm border border-ink/8`
- `text-gray-900` → `text-ink`
- `text-gray-600` → `text-ink-light`
- `text-gray-500` → `text-slate-blue`
- `border-gray-200` → `border-ink/8`
- `text-blue-600` → `text-terracotta`

### Task 3.4: Retheme WaitlistForm

**File**: `components/waitlist/WaitlistForm.tsx`

- Line 50: `border-gray-300 focus:ring-blue-500 focus:border-blue-500` → `border-ink/15 focus:ring-terracotta focus:border-terracotta`
- Line 55: `bg-blue-600 hover:bg-blue-700` → `bg-terracotta hover:bg-terracotta-hover`
- Line 63: `text-red-600` → `text-rust`; `text-green-600` → `text-forest`

### Task 3.5: Fix copyright year

**File**: `app/page.tsx`

- Line 357: `2025` → `2026`

## Phase 4: Delete Demo Pages

### Task 4.1: Delete demo files

Delete these files/directories:
- `app/demo/` (entire directory — `page.tsx` and `[scenario]/page.tsx`)
- `lib/demo/demoData.ts`
- `types/demo.ts`

### Task 4.2: Update navigation

**File**: `app/components/ui/navigation.tsx`

- Remove demo button (line ~69) and mobile demo menu item (line ~134)
- Replace with link to `/try` or remove entirely

### Task 4.3: Update landing page footer

**File**: `app/page.tsx`

- Line 335: Remove or replace `<a href="/demo">Live Demo</a>` — change to `/try` with label "Try Free"

### Task 4.4: Update Try page header

**File**: `app/try/page.tsx`

- Line 74: `<a href="/demo">Learn more</a>` → remove or change to `/assessment`

### Task 4.5: Update Assessment results CTA

**File**: `app/assessment/results/page.tsx`

- Line 265: `router.push('/demo')` "Watch Demo" → `router.push('/try')` "Try It Free"

### Task 4.6: Clean up test references

- Update `tests/helpers/routes.ts`: Remove `/demo` route definitions
- Update `tests/helpers/selectors.ts`: Remove demo selectors
- Update `tests/components/landing-page.test.tsx`: Remove demo navigation tests
- Update `tests/components/ui/navigation.test.tsx`: Remove demo button test
- Delete `playwright/demo.spec.ts`
- Delete `__tests__/demo/demoData.test.ts`
- Update `lib/supabase/middleware.ts` line 89: Remove `/demo` from testOnlyRoutes

## Phase 5: Assessment Flow

### Task 5.1: Retheme Assessment page

**File**: `app/assessment/page.tsx`

Full retheme — replace `from-blue-50 to-indigo-100` → `bg-cream`, all `gray-*` → palette equivalents.

### Task 5.2: Retheme StrategyQuiz

**File**: `app/components/assessment/StrategyQuiz.tsx`

Replace all blue/gray classes:
- `bg-blue-600` → `bg-terracotta`
- `hover:border-blue-500 hover:bg-blue-50` → `hover:border-terracotta hover:bg-terracotta/5`
- `border-blue-600 bg-blue-50` → `border-terracotta bg-terracotta/5`
- `text-blue-600` → `text-terracotta`
- `text-gray-*` → palette equivalents
- `bg-gray-200` → `bg-ink/10`
- `border-gray-200` → `border-ink/8`

### Task 5.3: Retheme Assessment Results page

**File**: `app/assessment/results/page.tsx`

Full retheme:
- Background: `bg-cream`
- Progress bars: `bg-terracotta` instead of `bg-blue-600`
- Score badges: `bg-forest` (high), `bg-mustard` (medium), `bg-rust` (low) instead of green/yellow/orange
- Recommendation card: `bg-gradient-to-r from-terracotta to-terracotta-hover text-cream` instead of blue/indigo gradient
- All `text-gray-*` → palette equivalents

## Phase 6: Secondary Pages & Components

### Task 6.1: Retheme New Session page

**File**: `app/app/new/page.tsx`

- Lines 74, 92: `bg-gradient-to-br from-blue-50 to-indigo-50` → `bg-cream`
- Error text: `text-gray-600 hover:text-gray-900` → `text-ink-light hover:text-ink`

### Task 6.2: Retheme Validate Success page

**File**: `app/validate/success/page.tsx`

Replace all `from-blue-50 to-indigo-100` → `bg-cream`, gray-* → palette.

### Task 6.3: Retheme ErrorState component

**File**: `app/components/ui/ErrorState.tsx`

- `text-orange-500` → `text-mustard`
- `text-red-500` → `text-rust`
- `text-yellow-500` → `text-mustard`
- `text-gray-600` → `text-ink-light`
- `text-gray-500` → `text-slate-blue`
- `bg-yellow-50 border-yellow-200` → `bg-mustard/10 border-mustard/20`
- `text-yellow-800` → `text-ink`

### Task 6.4: Retheme MermaidRenderer spinner

**File**: `app/components/canvas/MermaidRenderer.tsx`

- Line 75: `border-blue-600` → `border-terracotta`

### Task 6.5: Retheme LoadingIndicator

**File**: `app/components/bmad/LoadingIndicator.tsx`

- `bg-gray-200` → `bg-ink/10`
- `border-gray-200` → `border-ink/8`

### Task 6.6: Retheme SignupPromptModal

**File**: `app/components/guest/SignupPromptModal.tsx`

- `text-gray-400 hover:text-gray-600` → `text-slate-blue/60 hover:text-slate-blue`
- `text-green-500` → `text-forest`
- `text-gray-900` / `text-gray-600` / `text-gray-700` → `text-ink` / `text-ink-light`
- `bg-gray-50` → `bg-parchment`
- `bg-gray-100 text-gray-700 hover:bg-gray-200` → `bg-parchment text-ink-light hover:bg-cream`
- `text-gray-500` → `text-slate-blue`

### Task 6.7: Retheme Try page header

**File**: `app/try/page.tsx`

- Line 68: `backgroundColor: 'white'` → `backgroundColor: 'var(--cream)'`

### Task 6.8: Retheme Monitoring page

**File**: `app/monitoring/page.tsx`

- `bg-gray-50` → `bg-cream`
- `bg-white` header → `bg-parchment`
- `text-gray-900` → `text-ink`
- `text-gray-600` → `text-ink-light`
- `text-gray-500` → `text-slate-blue`
- `bg-blue-100 text-blue-800` → `bg-terracotta/10 text-terracotta`
- `text-gray-600 hover:text-gray-900` → `text-slate-blue hover:text-ink`

### Task 6.9: Retheme Account page white cards

**File**: `app/app/account/page.tsx`

- Lines 122, 158, 200: `bg-white` → `bg-card` (resolves to white via CSS vars, but semantically correct)

## Phase 7: BMad Components (Batch)

BMad components have 70+ off-brand color references across 20+ files. These are lower priority since BMad is not the primary tester flow.

### Task 7.1: Batch retheme BMad components

Files to update (apply same color mapping table):
- `app/components/bmad/BmadInterface.tsx`
- `app/components/bmad/ElicitationPanel.tsx`
- `app/components/bmad/EnhancedSessionManager.tsx`
- `app/components/bmad/ErrorMonitorDashboard.tsx`
- `app/components/bmad/OutputTypeSelector.tsx`
- `app/components/bmad/SessionManager.tsx`
- `app/components/bmad/session/UniversalSessionManager.tsx`
- `app/components/bmad/session/ContextTransfer.tsx`
- `app/components/bmad/session/PathwaySwitcher.tsx`
- `app/components/bmad/session/SessionHistory.tsx`
- `app/components/bmad/pathways/PhaseProgress.tsx`
- `app/components/bmad/pathways/PriorityMatrix.tsx`
- `app/components/bmad/pathways/PriorityScoring.tsx`
- `app/components/bmad/pathways/ScoreSlider.tsx`
- `app/components/bmad/pathways/BriefEditor.tsx`
- `app/components/bmad/pathways/BriefPreview.tsx`
- `app/components/bmad/pathways/ConceptDocument.tsx`
- `app/components/bmad/pathways/ExportOptions.tsx`
- `app/components/bmad/pathways/FeatureAnalysisQuestions.tsx`
- `app/components/bmad/pathways/FeatureBriefGenerator.tsx`
- `app/components/bmad/pathways/FeatureInput.tsx`
- `app/components/bmad/pathways/FeatureRefinementPathway.tsx`
- `app/components/bmad/pathways/MarketExploration.tsx`
- `app/components/bmad/pathways/NewIdeaPathway.tsx`

### Task 7.2: Retheme remaining workspace components

Files:
- `app/components/workspace/ExportPanel.tsx`
- `app/components/canvas/EnhancedCanvasWorkspace.tsx`
- `app/components/canvas/MermaidEditor.tsx`
- `app/components/canvas/CanvasWorkspace.tsx`
- `app/components/canvas/DualPaneLayout.tsx`
- `app/components/monetization/FeedbackForm.tsx`

### Task 7.3: Retheme legacy pages

Files:
- `app/workspace/[id]/page.tsx`
- `app/dashboard/page.tsx`
- `app/account/page.tsx`
- `app/bmad/page.tsx`

## Phase 8: Design Conventions Doc

### Task 8.1: Create design conventions doc

**File**: `docs/design-conventions.md`

Content:
1. **Color palette** — Full reference with hex values, CSS variable names, and Tailwind class names
2. **Color usage rules** — When to use each color, with examples
3. **Typography** — When to use `font-display` (Jost) vs body (Libre Baskerville) vs mono (JetBrains Mono)
4. **Component patterns** — Preferred styling approach (Tailwind tokens first, CSS vars for dynamic values)
5. **Never-use list** — `blue-*`, `indigo-*`, `purple-*`, `gray-*` outside code blocks, hardcoded RGBA/hex
6. **State colors** — Error (rust), success (forest), warning (mustard), info (slate-blue)
7. **Board member colors** — Mary=terracotta, Victoria=mustard, Casey=forest, Elaine=slate-blue, Omar=ink, Taylor=dusty-rose
8. **Spacing/layout patterns** — Standard gaps, padding, container widths

## Phase 9: Build Verification

### Task 9.1: Run build and fix errors

```bash
npm run build
```

Fix any TypeScript or build errors introduced by the retheme.

### Task 9.2: Verify E2E tests still pass

```bash
npm run test:e2e
```

Update any tests that reference deleted demo pages or changed class names.

## Dependencies & Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Build breaks from class name typos | Medium | Run build after each phase |
| Gray classes intentionally used in code blocks | Medium | Keep syntax highlighting grays — only replace UI element grays |
| Test failures from demo deletion | High | Clean up test references in Phase 4.6 |
| BMad retheme introduces layout bugs | Low | BMad is not in tester flow — can fix later |
| Missing Tailwind classes (terracotta-hover, etc.) | Low | Already defined in tailwind.config.cjs |

## Out of Scope

- Board of Directors Phases 5-6 (Taylor opt-in, polish)
- Onboarding flow / product tour
- Mobile hamburger menu
- Sentry / external error monitoring
- Analytics beyond Vercel basics
- ESLint color enforcement rules
- Custom component library extraction
- Dark mode

## References

- Brainstorm: `docs/brainstorms/2026-02-15-design-system-audit-brainstorm.md`
- Tailwind config: `apps/web/tailwind.config.cjs` (lines 19-57 for palette)
- CSS variables: `apps/web/app/globals.css` (lines 47-68 for palette, 82-101 for shadcn mapping)
- Well-themed reference page: `apps/web/app/page.tsx` (landing page)
- Well-themed reference component: `apps/web/app/components/ui/navigation.tsx`
- Board member colors: `apps/web/app/globals.css` lines 213-226
