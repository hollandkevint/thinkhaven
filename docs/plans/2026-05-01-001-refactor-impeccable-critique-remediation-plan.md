---
title: "Impeccable Critique Remediation (Steps 2-6 + Onboard)"
type: refactor
status: completed
date: 2026-05-01
deepened: 2026-05-01
origin: docs/plans/origin-impeccable-critique-2026-04-29.md  # critique findings produced in conversation; durable copy lives in PRODUCT.md / DESIGN.md (8c7964d) + landing fix (0facd9a)
---

# Impeccable Critique Remediation (Steps 2-6 + Onboard)

## Summary

Address the highest-leverage findings from the impeccable critique across the three primary product surfaces (landing, dashboard, session workspace). Six atomic units, each tracking one impeccable command: harden the dashboard, clarify the session header, quieter the feedback prompt, audit the token vocabulary, onboard first-run users to the persona-mode pattern, and polish remaining drift. Goal: move the Nielsen score from the 22/40 critique baseline toward ~30/40 without redesigning any surface.

---

## Problem Frame

The April 2026 impeccable critique found ThinkHaven's brand strategy in `PRODUCT.md` and `DESIGN.md` is sharper than what is shipping. The product reads as "warm shadcn template" rather than the documented Wes Anderson editorial system. Five priority issues block higher Nielsen heuristic scores; one heuristic (Help & Documentation) sits at 1/10 because the executive primary user has no first-run scaffolding for the persona-mode and board-of-advisors patterns. Step 1 (landing restructure) shipped in commit `0facd9a`. Steps 2-6 plus an `onboard` pass remain.

Pain felt by the executive primary user (per PRODUCT.md): they hit `confirm()` dialogs, see invisible chips, can't tell what mode an advisor is in, get a feedback modal at the wrong moment, and have no scaffolding for understanding the board pattern on first run. Brand authority leaks at each of those points.

---

## Requirements

- R1. Replace native `confirm()` and `bg-black/50` on the dashboard with a Radix Dialog destructive-confirm pattern using `bg-ink/50` overlay (resolves P0 from critique).
- R2. Remove the `Sparkles` icon and rewrite the dashboard empty-state copy ("strategic thinking journey," "AI-powered insights") in PRODUCT.md voice (senior strategist, not coach).
- R3. Resolve the duplicate new-session entry-point on the dashboard (sidebar button + body CTA card).
- R4. Render the active persona-mode badge in `SessionHeader` next to the session title, paired with the mode name (color is never the sole carrier of state per DESIGN.md `mode-badge` spec).
- R5. Rewrite the session input placeholder, access-required CTA, and `<strong>System:</strong>` framing on system messages in PRODUCT.md voice. Reduce empty-state suggestion grid from three cards to two.
- R6. Move the feedback auto-prompt off the message-limit moment to session-end / artifact-export. Surface the export button at the limit instead.
- R7. Unify color-token vocabularies: convert dashboard + session top-level layouts from shadcn aliases (`bg-background`, `text-foreground`, `border-border`, `focus:border-primary`) to direct brand tokens (`bg-cream`, `text-ink`, `border-ink/10`, `focus:border-terracotta`). Keep shadcn aliases inside reusable components.
- R8. Add first-run onboarding scaffolding so the executive primary user can recognize the persona-mode and board-of-advisors patterns without external context. Specifically: a tooltip or label on the persona-mode badge, a "what is the board?" affordance available from the session header, and a first-session welcome that names the artifact → decision → confidence sequence.
- R9. Polish sweep: gradient hairlines anywhere remaining, `text-3xl font-bold` H1s converted to Jost 500 per DESIGN.md spec, `bg-ink/5` invisible chips committed or removed, three-card empty states reduced to two-card, fake social proof line cut.
- R10. Honor PRODUCT.md and DESIGN.md as source of truth, every unit traces back to a documented rule.

---

## Scope Boundaries

- Provocative-question rethinks from the critique are explicit non-goals (one-screen landing, artifact-first session, persona-mode-as-control, sidebar removal). All structural redesigns, not in this remediation.
- Migration of existing hand-rolled modals (`SignupPromptModal`, `ExportDialog`, `BranchDialog`) to Radix is tracked elsewhere per CLAUDE.md pitfall #27.
- Re-running `$impeccable critique` after this plan ships is a manual verification step, not a unit.

### Deferred to Follow-Up Work

- **Mobile / responsive review** (`$impeccable adapt`): the original critique was source-only because the dev server hit a pre-existing turbopack `next-mdx-rule` config error. The dual-pane workspace's mobile collapse logic was never visually validated. Follow-up plan after the dev server is fixed.
- **Branch divergence resolution**: local main is 4 ahead, 3 behind origin/main (origin's #34 ICP launch, #35 beta access ops, beta invite comms). Pre-existing, must be rebased before any push.
- **Pre-existing turbopack config error** (`next.config.ts` rejects `turbopack.rules.{*,next-mdx-rule}`): blocks dev server. Not in this plan.
- **Pre-existing untouched modified files** at session start: `docs/design-conventions.md`, `docs/design/design-system.md`, `docs/design/design-system.pen`, `thinkhaven.code-workspace`. May belong with origin's pending merges.
- **Visual regression infrastructure**: this project has no visual-regression test setup; verification for non-feature-bearing styling units is manual. Establishing visual-regression coverage is a separate plan.
- **Other impeccable command passes considered and deferred** (assessed for the "any other valuable" question):
  - `$impeccable adapt`, mobile/responsive review. High value, blocked by dev-server fix. Already named above.
  - `$impeccable optimize`, UI performance review. CLAUDE.md pitfall #25 already names Mermaid/Excalidraw dynamic-import requirements; an audit pass would confirm dashboard and session don't regress on bundle size after the changes in this plan. Lightweight follow-up after U6.
  - `$impeccable layout`, spacing rhythm + visual hierarchy. Partially absorbed into U6 polish (three-card grids, font weight). A dedicated layout pass would be heavier work that this plan does not need; defer unless the polish sweep surfaces enough drift to justify it.
  - `$impeccable typeset`, typography audit. Partially absorbed into U6 (`font-bold` → `font-medium`). Defer.
  - `$impeccable delight`, `$impeccable bolder`, `$impeccable colorize`, `$impeccable overdrive`, `$impeccable animate`, `$impeccable distill`, all rejected. They push opposite to PRODUCT.md's "quiet confidence, anti-sycophancy" principle, or are already absorbed into the existing units.

---

## Context & Research

### Relevant Code and Patterns

- `apps/web/components/ui/button.tsx`, shadcn cva button with terracotta primary, used as `<Button>`. Variants: default, destructive, outline, secondary, ghost, link.
- `apps/web/app/app/page.tsx:27`, `@radix-ui/react-dialog` already imported on the same file as the `confirm()` call (line 185). Existing rename dialog at lines 475-515 is the pattern to mirror for the delete-confirm dialog.
- `apps/web/app/app/page.tsx:474-515`, Reference Radix dialog implementation: `Dialog.Root` + `Dialog.Portal` + `Dialog.Overlay` (currently `bg-black/50`, becomes `bg-ink/50`) + `Dialog.Content`. Copy this shape for the delete-confirm.
- `apps/web/app/components/workspace/SessionHeader.tsx`, header component receiving title, sessionId, messageCount, etc. Persona-mode badge insertion point.
- `apps/web/lib/ai/board-members.ts` and `apps/web/lib/ai/sub-personas.ts` (or equivalent), source of `sub_persona_state` from session data. Mode is read from `session.sub_persona_state` per `apps/web/app/app/session/[id]/page.tsx:148`.
- `DESIGN.md §5 Components → Mode Badges`, spec for the mode-badge component: `rounded-full`, label typography (Jost 500, 12px tracking 0.05em UPPERCASE), 4px / 12px padding, parchment fill, mode-color text. Color always pairs with mode name.
- `apps/web/app/globals.css:42-149`, runtime token source of truth (cream, parchment, terracotta, ink, ink-light, slate-blue, mode colors). All target tokens already defined.
- `apps/web/tailwind.config.cjs`, Tailwind exposes `bg-cream`, `bg-parchment`, `bg-terracotta`, `text-ink`, `text-ink-light`, `border-ink/X` utilities. Direct-token classes are already wired.
- `apps/web/app/app/session/[id]/page.tsx:91-101`, `useEffect` block firing the feedback auto-prompt on `limitStatus.limitReached`. The trigger to relocate.
- `apps/web/app/app/session/[id]/page.tsx:296-319`, empty-state suggestion grid (three cards). Reduce to two.

### Institutional Learnings

- **CLAUDE.md pitfall #15**, `text-secondary` maps to parchment (a background color), produces invisible text on cream/parchment. Use `text-muted-foreground` (slate-blue) or `text-ink-light` for secondary text. Direct relevance to the audit unit (R7): converting away from shadcn aliases removes this footgun on touched surfaces.
- **CLAUDE.md pitfall #19**, Design system source of truth lives in `globals.css` and `tailwind.config.cjs`. Do NOT trust `docs/design/MASTER.md` if it reappears (auto-generated by `ui-ux-pro-max` with wrong colors/fonts). Plan honors this.
- **CLAUDE.md pitfall #27**, Use `@radix-ui/react-dialog` for all new modals (focus trap, escape, aria-modal). Existing hand-rolled modals deferred. Direct support for the harden unit (R1).
- **CLAUDE.md pitfall #18**, React ErrorBoundaries don't catch event handlers. Wrap the new delete-confirm onClick body in try/catch or use error state.
- **CLAUDE.md pitfall #16**, Hooks must re-throw or return errors after catching. Affects the harden-unit error handling and the quieter-unit's new feedback trigger wiring.
- **CLAUDE.md pitfall #17**, IDOR checks on every session-scoped handler. Existing `handleDeleteSession` already has `.eq('user_id', user?.id)` IDOR check; the Radix-wrapped version must preserve it (line 195).

### External References

- DESIGN.md `mode-badge` component spec (this repo, written 2026-04-29 in commit `8c7964d`).
- PRODUCT.md "Anti-sycophancy as a visual discipline" principle (this repo, same commit).

---

## Key Technical Decisions

- **Sequencing: harden → clarify → quieter → audit → onboard → polish.** Smallest blast radius first, cross-cutting refactor (audit) in the middle so polish runs against unified tokens, onboard before polish so the new affordances get swept by polish for consistency.
- **Atomic commits per unit.** Each `$impeccable <command>` shipped as one commit. Commit messages name the command: `refactor(harden): ...`, `refactor(clarify): ...`, etc. This matches the convention from commits `8c7964d` and `0facd9a`.
- **Token-unification scope is page-shell only.** Convert `app/app/page.tsx` and `app/app/session/[id]/page.tsx` top-level layouts to direct brand tokens. Reusable component primitives (`button.tsx`, `card.tsx`, `dropdown-menu.tsx`) keep shadcn aliases for theme portability. Rationale: avoid breaking the shadcn theme bridge documented in `globals.css:82-101`.
- **Persona mode badge: hidden when no active mode.** Don't render a "no mode" placeholder. Absence is the default; presence signals an active persona state. Matches DESIGN.md "Anti-sycophancy as visual discipline" principle (state changes feel observational, not celebratory).
- **Feedback prompt new trigger: explicit user export action.** Hook into the export button click handler (or session-archive) rather than another timer. Removes the "modal at frustration moment" problem entirely instead of moving it elsewhere.
- **Onboard: scaffolding, not a tour.** No multi-step modal walkthrough. First-session welcome inline at the top of the empty-state, persistent tooltip on the mode badge, lightweight "What's a board?" sheet behind a `?` icon in `SessionHeader`. PRODUCT.md voice: senior strategist, not coach.
- **Dashboard duplicate new-session entry-point: keep the body CTA, demote the sidebar button.** The body card carries more context (greeting, prompt) and is the on-brand entry. Sidebar button becomes a smaller, ghost-variant tertiary action. Resolves R3 without changing IA.

---

## Open Questions

### Resolved During Planning

- *Where does the `?` icon for "What's a board?" live?*, In `SessionHeader`, right of the persona mode badge. Triggers a Radix Dialog (not a tooltip) since the content is multi-paragraph editorial copy.
- *Should onboard scaffolding render for returning users?*, No. Mode-badge tooltip persists (always informative); first-session welcome and "What's a board?" only render when `session.message_count === 0`.
- *Token-unification verification approach?*, Manual visual inspection per touched file (no visual-regression infra exists). The work is pure CSS class swaps with documented token equivalents; risk is lower than a typical refactor.

### Deferred to Implementation

- **Exact `?` icon choice**, Lucide `HelpCircle`, `Info`, or custom. Implementer picks during clarify-unit work.
- **Mode-badge tooltip delivery**, Radix Tooltip vs. native `title` attribute. Implementer picks based on whether other tooltips already exist on touched surfaces.
- **First-session welcome placement**, Inline above the suggestion grid vs. as a small banner above the chat. Implementer iterates during onboard-unit work; the empty-state already centers content, so above-grid is the working assumption.
- **Persistence of "first-session welcome dismissed"**, Keep simple (re-renders for every empty session) vs. localStorage flag. Defaulting to keep-simple unless implementation reveals it's annoying.

---

## Implementation Units

- U1. **Harden the dashboard delete and overlay**

**Goal:** Replace `confirm()` with a Radix Dialog destructive-confirm and `bg-black/50` with `bg-ink/50`. Remove the `Sparkles` empty-state icon. Rewrite empty-state copy in PRODUCT.md voice. Demote the sidebar new-session button so the body CTA is the single primary entry-point.

**Requirements:** R1, R2, R3, R10

**Dependencies:** None

**Files:**
- Modify: `apps/web/app/app/page.tsx`
- Test: `apps/web/__tests__/app/dashboard-delete.test.tsx` (new, narrow test for the delete-confirm dialog flow). Existing dashboard test coverage was not located during planning; the implementer should grep `apps/web/__tests__` and `apps/web/tests` for any existing dashboard tests before creating a new file. If a dashboard test file exists, extend it; if not, create the new file. The unit must ship with at least the happy-path and IDOR test scenarios below.

**Approach:**
- Mirror the existing rename dialog (lines 475-515) for the new delete-confirm dialog. Keep IDOR-safe `handleDeleteSession` unchanged (line 184-203); replace `confirm()` (line 185) with `Dialog.Root` open-state managed by a new `confirmDeleteSession` state (`{id, title} | null`).
- Replace `bg-black/50` (existing rename dialog overlay, line 477) with `bg-ink/50`.
- Remove `<Sparkles />` (line 394) and the `bg-primary/10` wrapping circle (line 393). Empty state becomes typography-led.
- Empty-state copy rewrite: "Start your first strategic session" → "Nothing yet. What are you trying to decide?". Body copy: "Create a new session to begin your strategic thinking journey with AI-powered insights" → "Open a new session and the board will pressure-test the decision you're about to make.".
- Resolve duplicate entry-point: body CTA card (lines 371-387) stays as primary. Sidebar `<Button onClick={handleNewSession}>` (line 290-296) becomes a `variant="ghost"` smaller button with text-only label "New session" (no `PlusIcon`).

**Patterns to follow:**
- Existing `Dialog.Root` rename pattern at `apps/web/app/app/page.tsx:475-515`.
- `@radix-ui/react-dialog` imports already present (line 27).
- Destructive button styling: `bg-rust hover:bg-rust/90 text-cream` matching DESIGN.md §5 destructive button spec.

**Test scenarios:**
- Happy path. Clicking the dropdown "Delete" item opens the Radix dialog showing the session title; clicking "Delete session" calls `handleDeleteSession`, the session is optimistically removed from the grid, and the dialog closes.
- Edge case. Clicking the overlay or pressing Escape dismisses the dialog without deleting (Radix focus-trap and escape behavior).
- Error path. Supabase delete fails; the optimistic removal reverts via `fetchSessions()` (existing behavior, line 201).
- Integration. The IDOR `eq('user_id', user?.id)` filter remains on the delete query (line 195). Test by mocking a different user_id and verifying delete is blocked.
- Edge case. Empty state renders without `Sparkles` and without the `bg-primary/10` circle; copy reads "Nothing yet. What are you trying to decide?" with the new CTA below it.

**Verification:**
- No `confirm()` call in `app/app/page.tsx`.
- `bg-black/50` removed; the only overlay token in use on the file is `bg-ink/50`.
- `Sparkles` import removed if no other usage; verify with `grep -n "Sparkles" apps/web/app/app/page.tsx`.
- Sidebar new-session button is `variant="ghost"`; body CTA card is the only primary-styled new-session entry.
- `npm run lint` and `npm run test:run` pass.

---

- U2. **Clarify the session header with persona mode and editorial voice**

**Goal:** Render the active persona-mode badge in `SessionHeader` per DESIGN.md spec. Replace `<strong>System:</strong>` framing on system messages with editorial styling. Rewrite the input placeholder and access-required CTA copy. Reduce the empty-state suggestion grid from three cards to two.

**Requirements:** R4, R5, R10

**Dependencies:** U1 (atomic ordering only, no code dependency)

**Files:**
- Create: `apps/web/app/components/board/ModeBadge.tsx`
- Modify: `apps/web/app/components/workspace/SessionHeader.tsx`
- Modify: `apps/web/app/app/session/[id]/page.tsx`
- Test: `apps/web/__tests__/app/components/board/ModeBadge.test.tsx`

**Approach:**
- New `ModeBadge` component implementing DESIGN.md §5 mode-badge spec: `rounded-full`, Jost 500, 12px size, 0.05em tracking, UPPERCASE label, parchment fill, mode-color text. Props: `mode: 'inquisitive' | 'advocate' | 'encouraging' | 'realistic' | null`. Returns `null` when `mode` is null (don't render placeholder).
- `SessionHeader` accepts new prop `subPersonaMode: SubPersonaState['mode'] | null` (read from `session.sub_persona_state` in the parent). Render `<ModeBadge mode={subPersonaMode} />` next to the session title with a `gap-3` separator.
- Replace lines 376-383 system-message rendering: drop `<strong>System:</strong>`, render the system content in `text-sm italic text-slate-blue` on a quieter parchment background with `border-l-0` (avoid side-stripe ban).
- Input placeholder (line 454): "Type your strategic question... (Shift+Enter for new line)" → "What are you trying to decide? (Shift+Enter for new line)".
- Access-required CTA (line 228-233): "Access Required" / "Please sign in to access this session." stays; the button styling moves to direct-token (covered in U4 audit unit).
- Empty-state suggestion grid (line 304): change `grid-cols-1 sm:grid-cols-3` to `grid-cols-1 sm:grid-cols-2`. Remove "Help me stress-test my business model" card (the most generic of the three); keep "I want to validate a new product idea" and "I'm deciding between two strategic directions".

**Patterns to follow:**
- Existing `SpeakerMessage` component for editorial chat-bubble styling.
- `mode-badge` CSS class in `globals.css:301-310` already defines the structural styles. The new React component renders this class with a mode-specific color CSS var.
- `apps/web/app/page.tsx` ModeBadge-style usage on the marketing landing for visual reference (similar component if it exists).

**Test scenarios:**
- Happy path. ModeBadge with `mode="inquisitive"` renders pill with mustard text on parchment, label "Inquisitive", uppercase. ModeBadge with `mode={null}` renders nothing.
- Happy path. SessionHeader receives a session with `sub_persona_state: { mode: 'advocate' }`; the badge appears next to the title in rust color labeled "Devil's Advocate".
- Edge case. SessionHeader receives `sub_persona_state: null`; no badge rendered, layout doesn't shift (no placeholder gap).
- Edge case. System message rendering shows italicized slate-blue text without the `<strong>System:</strong>` prefix; pass an empty system message body and verify nothing crashes.
- Integration. Empty-state suggestion grid renders exactly 2 cards on viewports ≥640px, 1 card stacked below; clicking either card sets `messageInput` to the prompt text.

**Verification:**
- `<strong>System:</strong>` does not appear in `app/app/session/[id]/page.tsx`.
- `grep -n "grid-cols-3" apps/web/app/app/session/[id]/page.tsx` returns no matches in the empty-state region.
- `ModeBadge` renders correctly for all four modes plus null in component tests.
- The session header in a manual smoke walk-through visibly shows the active mode pill when `sub_persona_state.mode` is set.

---

- U3. **Quieter the feedback prompt timing**

**Goal:** Move the feedback auto-prompt off the message-limit moment to artifact export / session-end. Replace the limit-reached experience with a clear export CTA.

**Requirements:** R6, R10

**Dependencies:** U2 (atomic ordering only)

**Files:**
- Modify: `apps/web/app/app/session/[id]/page.tsx`
- Modify: `apps/web/app/components/chat/MessageLimitWarning.tsx`
- Modify: `apps/web/lib/stores/feedbackStore.ts` (if a `triggerSource` field is needed for analytics)
- Test: `apps/web/__tests__/app/session/feedback-trigger.test.tsx` (new, narrow test for trigger relocation)

**Approach:**
- Delete the `useEffect` block at lines 91-101 entirely.
- New trigger location: `MessageLimitWarning`'s `onExport` handler. After the export panel finishes successfully, fire `useFeedbackStore.getState().open(session.id)`. The export-success hook is the natural session-end signal for this product.
- `MessageLimitWarning` receives a new prop `messageCountAtLimit?: number` (display-only) and the existing `onExport` becomes the trigger, when limit is reached, the component primarily surfaces the export button rather than a feedback prompt.
- If the user closes the limit warning without exporting, no feedback prompt fires. This is intentional, they're frustrated, not done.
- No changes to `feedbackStore.ts` core API; if a `triggerSource: 'export' | 'manual' | 'limit'` field would help product analytics, add as optional metadata.

**Patterns to follow:**
- Existing `MessageLimitWarning` callback wiring (`onNewSession`, `onExport`).
- Existing `useFeedbackStore.getState().open(session.id)` invocation at line 95 (relocate, don't rewrite).
- CLAUDE.md pitfall #16 (hooks re-throw or return errors): the new export-success hook must propagate errors rather than silently swallow.

**Test scenarios:**
- Happy path. User reaches message limit, clicks Export, export completes, feedback modal opens within 500ms of export success.
- Edge case. User reaches message limit, dismisses the warning, navigates away, feedback modal does NOT open.
- Edge case. User exports voluntarily before hitting the limit, feedback modal opens (this is fine; export is the user-driven done signal regardless of limit state).
- Error path. Export fails, feedback modal does NOT open; user sees an export error.
- Integration. The 1-second timeout (existing line 95) is removed; verify with grep that `setTimeout` no longer wraps `useFeedbackStore.getState().open` in this file.

**Verification:**
- The `useEffect` block previously at `apps/web/app/app/session/[id]/page.tsx:91-101` is deleted (or replaced with an artifact-export hook).
- `grep -n "limitReached" apps/web/app/app/session/[id]/page.tsx` returns no auto-prompt timer; only the limit-display logic remains.
- Manual smoke: complete a session, hit the limit, verify the export button is the prominent CTA and no modal auto-fires until export completes.

---

- U4. **Audit and unify token vocabularies on dashboard and session shells**

**Goal:** Convert dashboard + session top-level layouts from shadcn aliases to direct brand tokens. Reusable component primitives keep shadcn aliases. CLAUDE.md pitfall #15 is no longer reachable on touched surfaces.

**Requirements:** R7, R10

**Dependencies:** U1, U2, U3 (touches the same files; rebase on top of the surface work)

**Files:**
- Modify: `apps/web/app/app/page.tsx`
- Modify: `apps/web/app/app/session/[id]/page.tsx`

**Approach:**
- Token swaps (page-shell only):
  - `bg-background` → `bg-cream`
  - `text-foreground` → `text-ink`
  - `bg-card` → `bg-parchment`
  - `text-muted-foreground` → `text-ink-light` (warm secondary) or `text-slate-blue` (cool muted) depending on context. CLAUDE.md pitfall #15 names these explicitly.
  - `border-border` → `border-ink/10`
  - `border-border` → `border-ink/15` for emphasis (input fields)
  - `focus:border-primary` → `focus:border-terracotta`
  - `focus:ring-2 focus:ring-terracotta` direct, replacing `focus:ring-ring`
  - `hover:bg-accent` → `hover:bg-ink/5` for sidebar buttons (more subtle than sage which is the shadcn `accent` map)
  - `bg-muted` → `bg-parchment` for skeleton placeholders
- Do NOT touch `apps/web/components/ui/button.tsx`, `apps/web/components/ui/card.tsx`, `apps/web/components/ui/dropdown-menu.tsx`, or any reusable primitive. They remain shadcn-aliased for theme portability.
- The `Card` import in `app/app/page.tsx` line 7 keeps using the component; only its `className` overrides on the page swap.
- Verify post-swap: every token used in the two page files exists in `tailwind.config.cjs` extend block. No invented tokens.

**Execution note:** Pure CSS class swap. No behavioral change. Verification is visual + lint.

**Patterns to follow:**
- `apps/web/app/page.tsx` (landing) for the direct-token vocabulary, it already uses `bg-cream`, `text-ink`, `border-ink/10` throughout.
- DESIGN.md §6 Do/Don't list, the converted tokens align with "Do use ink for body text, ink-light for secondary text on cream/parchment".

**Test scenarios:**
- Test expectation: none, pure styling refactor, behavior unchanged. Manual visual verification per surface.

**Verification:**
- `grep -nE "bg-background|text-foreground|bg-card[^-]|border-border|focus:border-primary|hover:bg-accent" apps/web/app/app/page.tsx apps/web/app/app/session/[id]/page.tsx` returns no matches in the page-shell regions.
- `grep -nE "bg-background|text-foreground|border-border" apps/web/components/ui/` still returns matches (component primitives unchanged).
- `npm run build` passes.
- Manual visual diff per surface: dashboard, session loading skeleton, session error state, session main view. Cream backgrounds, ink text, terracotta focus rings.

---

- U5. **Onboard executives to the persona-mode and board patterns**

**Goal:** First-run scaffolding for the executive primary user. Persona-mode badge tooltip, "What's a board?" affordance in `SessionHeader`, and a first-session welcome that names the artifact → decision → confidence sequence. Closes the Help & Documentation gap (Nielsen #10, scored 1/10 in critique).

**Requirements:** R8, R10

**Dependencies:** U2 (uses the new `ModeBadge` component)

**Files:**
- Create: `apps/web/app/components/board/BoardExplainerSheet.tsx`
- Create: `apps/web/app/components/session/FirstSessionWelcome.tsx`
- Modify: `apps/web/app/components/board/ModeBadge.tsx` (add tooltip)
- Modify: `apps/web/app/components/workspace/SessionHeader.tsx` (add explainer trigger)
- Modify: `apps/web/app/app/session/[id]/page.tsx` (render `FirstSessionWelcome` in empty state)
- Test: `apps/web/__tests__/app/components/session/FirstSessionWelcome.test.tsx`
- Test: `apps/web/__tests__/app/components/board/BoardExplainerSheet.test.tsx`

**Approach:**
- `ModeBadge` gets a Radix Tooltip wrapper. Tooltip content is a single sentence per mode in PRODUCT.md voice:
  - Inquisitive: "Mary is asking questions before forming a position."
  - Devil's Advocate: "Mary is arguing the opposite of your stated position."
  - Encouraging: "Mary is pulling for what's working in your plan."
  - Realistic: "Mary is naming what's likely to fail and why."
- `BoardExplainerSheet` is a Radix Dialog (focus trap, escape) triggered by a `?` icon in `SessionHeader` (right of the mode badge). Content: 3 short sections in editorial voice, what the board is, who's on it, when each member shows up. References by name (Mary, Victoria, Casey, Elaine, Omar, Taylor) with their roles. No images, no celebratory framing. Closes via overlay click, Escape, or close button. PRODUCT.md voice.
- `FirstSessionWelcome` renders inline above the empty-state suggestion grid when `session.message_count === 0`. Three short lines naming the sequence:
  - "ThinkHaven sessions produce three things, in this order:"
  - "**An artifact** you can share. **A decision** you can defend. **Confidence** in where it's strong and where it isn't."
  - One sentence: "Start by describing the decision you're trying to make."
- Voice across all three: senior strategist, not coach. No "Welcome!", no exclamation marks, no rocket emojis. Match PRODUCT.md "user closes the laptop sharper, not validated".

**Patterns to follow:**
- `@radix-ui/react-dialog` (already used for rename, will be used for delete-confirm in U1).
- Radix Tooltip, `@radix-ui/react-tooltip` is not in `apps/web/package.json` as of 2026-05-01. The first commit of this unit must install it (`npm install @radix-ui/react-tooltip` from `apps/web/`) and verify the lockfile updates cleanly before any component work. If the install introduces a peer-dependency warning, resolve it before proceeding rather than `--force`-ing.
- `SpeakerMessage` editorial chat-bubble styling for the welcome's quiet, ink-text aesthetic.
- DESIGN.md "Anti-sycophancy as visual discipline": no green checks, no celebration. State the sequence; trust the user.

**Test scenarios:**
- Happy path. ModeBadge with tooltip renders the correct sentence on hover for each of the four modes.
- Happy path. `SessionHeader` `?` icon click opens the BoardExplainerSheet; pressing Escape closes it; clicking the overlay closes it.
- Happy path. FirstSessionWelcome renders when `session.message_count === 0`; does NOT render when `message_count > 0`.
- Edge case. ModeBadge with `mode={null}` does not render a tooltip wrapper around nothing.
- Edge case. BoardExplainerSheet renders correctly even when no active session is loaded (it's session-context-independent).
- Integration. Returning user with prior sessions sees no welcome banner; new user with `message_count === 0` sees it once per empty session.
- Accessibility. Both Dialog and Tooltip pass keyboard navigation; the `?` icon has `aria-label="What is a board?"`.

**Verification:**
- Persona mode badge has accessible tooltip on hover and focus.
- `?` icon visible in `SessionHeader` right of the mode badge (or right of the title when no mode is active); opens BoardExplainerSheet.
- First session welcome banner renders for `message_count === 0` only.
- All three components match DESIGN.md voice and don't violate any banned patterns (no Sparkles, no green-check celebration, no AI emojis).
- `npm run lint` passes.

---

- U6. **Polish sweep across all three surfaces**

**Goal:** Final pass after the structural work lands. Catch the minor observations from the critique and any drift introduced by the prior units.

**Requirements:** R9, R10

**Dependencies:** U1, U2, U3, U4, U5 (last unit on purpose)

**Files:**
- Modify: `apps/web/app/page.tsx` (any remaining drift)
- Modify: `apps/web/app/app/page.tsx`
- Modify: `apps/web/app/app/session/[id]/page.tsx`

**Approach:**
- Sweep for residual gradient-hairline `bg-gradient-to-r from-transparent via-*-/40 to-transparent` patterns. Already removed from landing in commit `0facd9a`; re-verify nothing reintroduced.
- Convert `text-3xl font-bold` → `text-3xl font-medium font-display` for H1 elements (DESIGN.md spec is Jost 500, never bold). Touches `apps/web/app/app/page.tsx:359` (dashboard greeting H1).
- `bg-ink/5` invisible chips: review `apps/web/app/app/session/[id]/page.tsx:388` (strategic-tags chips). Decision: commit visually with `bg-ink/8 text-ink-light` plus a hairline divider, OR remove entirely. Lean toward remove if usage is rare.
- Three-card empty states: U2 already reduced the session empty-state grid. Sweep for any other 3-card patterns in dashboard and verify dashboard's empty state doesn't re-introduce one after U1's icon removal.
- Fake social-proof: landing line 188 already replaced in commit `0facd9a`. Re-verify nothing else carries the same shape on dashboard or session.
- Animated `pulse` audit: typing indicator dots on landing (lines 154-156) and any other `animate-pulse` should be intentional. The beta-pulse keyframe (4s) was added in commit `0facd9a`; verify no other auto-pulsing decorative elements.

**Execution note:** Mostly grep-driven verification. Each finding becomes a small edit; if no findings, the unit ships as a no-op commit (still useful as a sweep marker).

**Patterns to follow:**
- DESIGN.md §6 Do/Don't list, the polish sweep is checking against this list comprehensively.
- DESIGN.md §3 Typography hierarchy spec, Jost 500, never bold for headings.

**Test scenarios:**
- Test expectation: none, sweep work is verification rather than new behavior. Manual checks.

**Verification:**
- `grep -nE "from-transparent via-.*\/40 to-transparent" apps/web/app/` returns no matches.
- `grep -nE "font-bold[^-]" apps/web/app/app/page.tsx apps/web/app/app/session/[id]/page.tsx` returns no matches in heading positions.
- `grep -nE "bg-ink/5" apps/web/app/app/session/[id]/page.tsx` matches only intentional usage (with explicit comment) or returns no matches.
- `grep -nE "grid-cols-3" apps/web/app/app/page.tsx apps/web/app/app/session/[id]/page.tsx` returns no matches in empty-state regions.
- `npm run lint`, `npm run test:run`, `npm run build` all pass.
- Manual visual diff: open all three surfaces (landing, dashboard, session-empty, session-with-content) and compare against DESIGN.md §5 component specs.

---

## System-Wide Impact

- **Interaction graph:** U1 changes the dashboard delete flow from sync (`confirm()`) to async (Radix dialog open/close state). The IDOR check (`.eq('user_id', user?.id)`) on the underlying Supabase delete remains unchanged. U2 introduces a new prop on `SessionHeader` (`subPersonaMode`) requiring callers to pass it, currently only one caller (`session/[id]/page.tsx`). U3 changes the feedback-prompt trigger graph: `MessageLimitWarning.onExport` becomes the entry point instead of `useEffect`-on-`limitReached`. Downstream feedback flow unchanged.
- **Error propagation:** U3's new feedback trigger inside `onExport` must follow CLAUDE.md pitfall #16, re-throw or return errors. U1's Radix dialog error handling is contained to the dialog state machine; failures revert via existing `fetchSessions()`.
- **State lifecycle risks:** U3 removes a `setTimeout` (1-second feedback prompt delay). Verify the cleanup `feedbackTimeoutRef` clearing logic is also removed. The `feedbackPromptedRef` ref is still needed in the new export-trigger location to prevent double-prompts on multi-export.
- **API surface parity:** No public API changes. New components (`ModeBadge`, `BoardExplainerSheet`, `FirstSessionWelcome`) are internal. `SessionHeader` adds an optional prop, backward-compatible.
- **Integration coverage:** Mode-badge ↔ session state binding (U2) needs an integration test verifying `session.sub_persona_state.mode` flows through. First-session welcome ↔ message-count rendering needs an integration test for the empty-state branch.
- **Unchanged invariants:** The shadcn theme bridge in `globals.css:82-101` is intentionally preserved. `apps/web/components/ui/*` primitives keep shadcn aliases. No changes to authentication, routing, Supabase RLS, or Stripe wiring. The dual-pane workspace's auto-open-on-content behavior is unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Token swap in U4 produces invisible-text regressions on a state we didn't manually inspect | After U4 commit, walk through every state of dashboard and session (loading, empty, error, content, dialog open) before merging. CLAUDE.md pitfall #15 is the specific class of bug to watch for. |
| `@radix-ui/react-tooltip` not installed, U5 breaks at build | Check `apps/web/package.json` before U5 starts. If absent, add as part of U5's first commit. |
| New `ModeBadge` component duplicates an existing one elsewhere in the codebase | U2 starts with a `grep -ri "modebadge\|mode-badge" apps/web/` to confirm absence. If a partial implementation exists, extend rather than create. |
| Feedback prompt relocation in U3 breaks an analytics expectation downstream | Coordinate with whoever depends on the feedback-prompt-fired event. The prompt still fires; the trigger source changes. Add `triggerSource: 'export'` metadata if needed. |
| Visual regression on dashboard or session not caught (no visual-regression infra) | Manual smoke-walk per state per unit. Document in the PR description what was visually verified. Defer dedicated visual-regression infrastructure to a separate plan. |
| Dev server still has the pre-existing turbopack config error, blocking all visual verification | Resolve the turbopack issue before U4 (cross-cutting refactor). If unresolvable in this plan, scope U4's verification to source-only diff review. |

---

## Documentation / Operational Notes

- No user-facing release notes needed; this is a quality-remediation plan, not a feature ship.
- Update `CLAUDE.md` pitfall #15 if the audit unit (U4) reveals additional shadcn-token footguns.
- After all units land, re-run `$impeccable critique` to verify Nielsen score movement. The expected score lift is from 22/40 toward ~30/40.
- The deferred `$impeccable adapt` (responsive review) is the natural next plan once the dev server is fixed.

---

## Sources & References

- **Origin: impeccable critique findings** (produced 2026-04-29 in conversation; durable shape lives in `PRODUCT.md` and `DESIGN.md` from commit `8c7964d`).
- **Step 1 already shipped:** commit `0facd9a`, landing-page editorial restructure.
- Related code:
  - `apps/web/app/app/page.tsx:185, :393-409, :474-515`, harden surfaces
  - `apps/web/app/app/session/[id]/page.tsx:91-101, :268-281, :296-319, :376-383, :454`, clarify + quieter surfaces
  - `apps/web/app/components/workspace/SessionHeader.tsx`, clarify + onboard insertion point
- External docs: `@radix-ui/react-dialog` and `@radix-ui/react-tooltip` Radix UI documentation.
- Project context: `CLAUDE.md` pitfalls #15, #16, #17, #18, #19, #27.
