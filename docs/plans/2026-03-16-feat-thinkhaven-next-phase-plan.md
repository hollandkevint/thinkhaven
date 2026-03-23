---
title: "ThinkHaven Next Phase: Design System Foundation → UX Fixes → Feature Gaps"
type: feat
date: 2026-03-16
status: superseded
superseded_by: docs/plans/2026-03-22-feat-multi-sprint-product-roadmap-plan.md
---

> **SUPERSEDED 2026-03-22.** Phase 0 blockers and Phase 1 design system partially shipped. Phases 2-5 are superseded by the multi-sprint product roadmap.

# ThinkHaven Next Phase Plan

## Research Summary

**5 parallel agents analyzed:** design system audit, UX flow analysis, production feedback/tech debt, competitor UX research, feature gap inventory.

**Current state:** 13 complete features, 5 partially built, 12 not started. The app has a solid core (streaming chat, Board of Directors, pathway selection, mode/tone switching) but critical conversion paths are broken, the design system has silent failures, and the session data model has a fundamental disconnect.

---

## Phase 0: Critical Bugs (Ship-Blocking)

These must be fixed before any alpha tester touches the app again.

### 0a. `/auth` signup route is a 404

**Impact:** Every guest who exhausts their trial and clicks "Sign up" hits a dead end. Three components route to `/auth?mode=signup&from=guest` but no `/auth/page.tsx` exists.

**Fix:** Update `SignupPromptModal`, `GuestChatInterface.handleSignupClick`, and `TrialPaywallCard` to route to `/signup?from=guest`. Add a `from=guest` handler on the signup page that triggers session migration after account creation.

**Files:** `app/components/guest/SignupPromptModal.tsx:26`, `app/components/guest/GuestChatInterface.tsx:241`, `app/components/guest/TrialPaywallCard.tsx:21`

### 0b. Session page ignores `params.id`

**Impact:** Every session loads the same `user_workspace` row. The URL's session ID is decorative. Dashboard shows multiple sessions but clicking any of them loads identical content.

**Fix:** The session page (`page.tsx:96`) must query `bmad_sessions` by both `params.id` AND `user.id`, loading per-session chat history. This is a fundamental data model decision that blocks all other session work.

**Files:** `app/app/session/[id]/page.tsx:89-120`, `app/app/session/[id]/useStreamingChat.ts`

### 0c. Migration numbering collision

**Impact:** Two migration files both numbered `020`. `020_add_pathway_types.sql` is committed; `020_add_session_mode_and_tier.sql` is untracked.

**Fix:** Renumber `020_add_session_mode_and_tier.sql` to `021`. Adjust any planned migrations accordingly.

### 0d. Guest message counter initializes wrong

**Impact:** `GuestChatInterface` hardcodes `useState(5)` but `MAX_MESSAGES` is 10. Returning guests with cached sessions see 5, fresh guests see 10.

**Fix:** Initialize from `GuestSessionStore.getRemainingMessages()`.

**File:** `app/components/guest/GuestChatInterface.tsx:31`

---

## Phase 1: Design System Foundation

Fix the silent failures first, then standardize. Everything downstream (new screens, features) builds on this.

### 1a. Register missing Tailwind tokens (P0 bugs)

These classes exist in code but do nothing because they're not in `tailwind.config.cjs`:

| Broken class | Files affected | Fix |
|---|---|---|
| `bg-primary-hover` | 17+ files | Register `primary-hover` in config OR replace with `hover:bg-terracotta-hover` |
| `border-divider` | 30+ files | Register `divider` color in config |
| `text-error`, `bg-error` | 8+ files | Register `error` color |
| `text-success`, `bg-success` | 6+ files | Register `success` color |
| `text-warning`, `bg-warning` | 4+ files | Register `warning` color |
| `text-info`, `bg-info` | 3+ files | Register `info` color |

**File:** `tailwind.config.cjs` (add semantic color tokens from CSS variables already defined in `globals.css`)

### 1b. Fix broken text classes

| Bug | Files | Fix |
|---|---|---|
| `text-secondary` (invisible on parchment) | `CanvasContextSync.tsx`, `VisualSuggestionIndicator.tsx` (3 occurrences) | Replace with `text-muted-foreground` |
| `text-muted-foreground-foreground` (typo, nonexistent) | `MarkdownRenderer.tsx` (4 occurrences) | Replace with `text-muted-foreground` |

### 1c. Standardize `text-white` → `text-cream`

64 instances of `text-white` across 27 files. Design system specifies `cream (#FAF7F2)` for light text on dark backgrounds. Pure `#FFF` clashes with the warm palette. Replace in custom buttons (not shadcn Button, which already uses `text-primary-foreground`).

### 1d. Remove dead CSS component classes

Half of `globals.css` component layer has zero consumers: `btn-primary`, `btn-secondary`, `.card`, `.card-elevated`, `.input`, `strategic-framework`, `insight-highlight`, `action-item`, `chat-message-user/assistant/system`, `viability-high/medium/low`, `canvas-container`, `mode-badge-*`. Delete them.

### 1e. Add missing UI primitives

| Component | Why | Effort |
|---|---|---|
| `Textarea` in `components/ui/` | 20 hand-rolled `<textarea>` elements across 13 files | 30 min |
| `EmptyState` | Ad-hoc empty states everywhere, .pen design exists | 1 hr |
| `Toast` (shadcn) | No success/error transient feedback system | 30 min (install) |
| `Dialog` (shadcn) | 3 hand-rolled modals with custom backdrop handling | 30 min (install) |

### 1f. Consolidate ErrorBoundary implementations

Three competing versions: `ui/ErrorBoundary.tsx` (shadcn Card), `bmad/ErrorBoundary.tsx` (custom), `dual-pane/PaneErrorBoundary.tsx` (CSS class + LoadingPane + OfflineIndicator). Consolidate to one. The `ui/ErrorBoundary.tsx` version is the best candidate.

### 1g. Update .pen design file

Add components for any new primitives. Ensure parity between code and design. The session UX overhaul components (HeaderOverflowMenu, ToneSelector, WelcomePrompt) were already backfilled today.

---

## Phase 2: UX Flow Fixes

With the design system solid, fix the broken flows that kill engagement and conversion.

### 2a. Export panel close handler

**Problem:** ExportPanel opens from overflow menu but has no close mechanism from the parent. `showExport` stays `true` forever.

**Fix:** Wire `onClose={() => setShowExport(false)}` or use ExportPanel's own backdrop to set parent state.

### 2b. Auto-scroll on authenticated session page

**Problem:** Guest chat has `scrollToBottom` with `messagesEndRef`. Authenticated sessions don't. Long conversations don't auto-scroll.

**Fix:** Add `messagesEndRef` and scroll behavior matching `GuestChatInterface`. Add a "scroll to bottom" floating button when user scrolls up (industry standard per Claude.ai and ChatGPT).

### 2c. Ephemeral error messages instead of persisted

**Problem:** `useStreamingChat` adds API errors as permanent system messages saved to Supabase. Transient network errors pollute chat history forever.

**Fix:** Show errors as dismissible banners or toast notifications. Don't call `addChatMessage` for errors.

### 2d. Mode/tone switch before first message

**Problem:** `switchMode` and `switchTone` silently no-op when `bmadSessionId` is null (before first message). No user feedback.

**Fix:** Either show a tooltip ("Send a message first to enable mode switching") or eagerly initialize `bmadSessionId` on session load.

### 2e. Tier gating for authenticated users

**Problem:** `ModeIndicator` only checks `isGuest`. Authenticated free users can select Executive Prep mode without a tier check.

**Fix:** Pass user tier to `ModeIndicator`. Show lock icons for modes requiring higher tiers, with upgrade CTA.

### 2f. Account deletion must actually delete

**Problem:** `handleDeleteAccount` shows a message, waits 2 seconds, signs out. No data is deleted. GDPR/CCPA risk.

**Fix:** Create `/api/user/delete` route that cascades deletes through `bmad_sessions`, `user_workspace`, then `supabase.auth.admin.deleteUser()`.

### 2g. Add "Forgot password" to login page

No recovery path for locked-out users. Add link to login page, wire to `supabase.auth.resetPasswordForEmail()`.

---

## Phase 3: Session Experience Enhancement

With flows fixed, improve the core session experience based on competitor research.

### 3a. Replace welcome wall with suggested prompts

**Current:** Multi-paragraph welcome from Mary with 4 generic suggestion buttons.

**Better:** Single line ("What decision are you working through?") + 3-4 tappable prompts showing ThinkHaven's specific value:
- "Should I leave my job to start a company?"
- "Is my pricing strategy defensible?"
- "Help me decide between two strategic directions"
- "I need to prepare for my board meeting"

**Why:** Every 10-minute delay in Time-to-First-Value costs 8% conversion (1Capture benchmark). Mary's first challenge should land in response 1, not response 5.

### 3b. Phase rail for structured sessions

A slim progress indicator showing session phases: `Context > Challenge > Synthesis > Artifact`. Current phase highlighted, completed phases checkmarked. Replaces the removed BMad progress dashboard with something lightweight and useful.

Applies to: Board of Directors, Executive Prep, Deep Analysis sessions.

### 3c. Board member "thinking" indicators

When Mary brings in Victoria, show a 1-2 second typing indicator with Victoria's avatar and color before her message appears. Makes multi-persona feel real instead of instant.

### 3d. Board members referencing each other

Victoria saying "I disagree with Casey's optimism..." is the moment the Board of Directors becomes a genuine advisory panel instead of sequential monologues. This is the differentiation moment.

**Implementation:** Add context from previous board member responses to the `switch_speaker` tool call, so the next speaker can reference and react to prior positions.

### 3e. Personalized paywall copy

At the message limit, reference the specific session: "You're working through [decision topic]. Mary has more to say about your pricing strategy." Personalization at the paywall converts 67% higher than generic copy.

### 3f. Inline email capture at paywall

Instead of redirecting to `/signup` (page transition = conversion cliff), show an email field + "Continue" button directly in the paywall card. Create the account inline, handle payment separately.

---

## Phase 4: Feature Completion

Ship the partially-built features that are blocked by uncommitted code.

### 4a. Commit and review uncommitted work

The working tree has 166 uncommitted changes across mode indicator, trial gate, executive tier, and Stripe integration. These need:
1. Migration renumbering (020 → 021)
2. IDOR review on new API routes (`/api/session/mode`, `/api/session/tone`, `/api/user/tier`, `/api/webhooks/stripe`)
3. At least one test per new component
4. Security review of Stripe webhook handler

### 4b. PathwayType enum reconciliation

Three sources of truth with different values:
- TypeScript `PathwayType` enum: 5 values
- Migration 001 CHECK: 3 values
- Migration 020 CHECK: 7 values

Consolidate to one source. The `lib/pathways.ts` `PATHWAYS` array (4 values) should be the single source, with the DB constraint matching.

### 4c. `ANTHROPIC_MODEL` env var

Model hardcoded 5 times in `lib/ai/claude-client.ts` as `claude-sonnet-4-20250514`. Token costs hardcoded at Sonnet 3.5 rates (outdated). Add an env var to enable switching to Haiku 4.5 (67% cost reduction) without code changes.

### 4d. Session list with search on dashboard

Table-stakes feature that's missing. Dashboard needs conversation history with search, grouped by recency. Each session shows title, pathway badge, date, message count, and a 1-line preview.

### 4e. Progressive artifact fill in right panel

During Board of Directors or Executive sessions, the right panel shows an artifact skeleton from the start. As assumptions are identified, they populate the Assumption Register. As risks surface, the Risk Matrix fills. This "living document" pattern is a genuine differentiator not found in ChatGPT or Claude.

---

## Phase 5: Polish & Growth

After the core experience is solid.

### 5a. Mobile bottom sheet for Board Overview

Side panel doesn't work on phones. Convert to a swipe-up bottom sheet with peek state (board member avatars in a horizontal row) and expanded state (full stance summaries).

### 5b. Voice input (Web Speech API)

Low effort, high perceived value on mobile. Browser speech-to-text transcription into the input box. 70% of consumers prefer voice or chat for quick answers.

### 5c. AI-suggested mode transitions

When Mary detects stress-test questions in assessment mode, she suggests a mode switch with inline accept/dismiss buttons. Already spec'd in March 2026 feature doc.

### 5d. Analytics integration

No product analytics exist. Add Segment or PostHog for funnel tracking: signup → first session → completion → conversion. Can't optimize what you can't measure.

### 5e. Email pipeline

Assessment quiz captures emails but no sending. Guest migration needs a toast notification. Future: session summaries, re-engagement. Add Resend or SendGrid.

---

## Implementation Order

```
Phase 0 (Blockers)     ██████████  ← Fix before any alpha testing
  0a. /auth 404 fix         [30 min]
  0b. Session data model    [4-8 hrs, design decision]
  0c. Migration numbering   [15 min]
  0d. Guest counter init    [5 min]

Phase 1 (Design System) ██████████  ← Foundation for everything
  1a. Register tokens       [1 hr]
  1b. Fix text classes      [30 min]
  1c. text-white → cream    [2 hrs]
  1d. Dead CSS cleanup      [1 hr]
  1e. Missing primitives    [2 hrs]
  1f. ErrorBoundary merge   [2 hrs]
  1g. .pen file sync        [1 hr]

Phase 2 (UX Flows)      ██████████  ← Fix what's broken
  2a-2g                     [1-2 days total]

Phase 3 (Enhancement)   ██████████  ← Improve core experience
  3a-3f                     [3-5 days total]

Phase 4 (Features)      ██████████  ← Ship what's half-built
  4a-4e                     [1-2 weeks total]

Phase 5 (Polish)        ██████████  ← Growth and mobile
  5a-5e                     [1-2 weeks total]
```

---

## Critical Architecture Decision Required

**Before Phase 0b can be implemented, Kevin needs to decide:**

> Is ThinkHaven a **single-workspace-per-user** model (where sessions are metadata labels on one shared chat history) or a **per-session isolated** model (where each session has its own independent chat)?

The current code contradicts itself:
- Dashboard shows multiple sessions from `bmad_sessions` table
- Pathway selection creates new rows in `bmad_sessions`
- Session page ignores the session ID and loads a single `user_workspace` row

**Recommendation:** Per-session isolated. Users expect clicking "Quick Decision" and "Deep Analysis" to produce two separate conversations. The `bmad_sessions` table already stores per-session metadata. The session page should read from `bmad_sessions` by ID, loading session-specific chat history.

---

## References

- [1Capture: Trial Conversion Benchmarks 2025](https://www.1capture.io/blog/free-trial-conversion-benchmarks-2025) -- TTFV data, conversion rates
- [NN/G: AI Onboarding](https://www.nngroup.com/articles/new-AI-users-onboarding/) -- First-session UX research
- [Shape of AI: UX Patterns](https://www.shapeof.ai/) -- Action Plan, multi-agent patterns
- [Microsoft: UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/) -- Multi-agent orchestration guidance
- [NN/G: Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/) -- Mobile UX for panels
- Design system audit: `apps/web/app/globals.css`, `apps/web/tailwind.config.cjs`
- UX flow analysis: 25 gaps identified across 5 user flows
- Feature inventory: 13 complete, 5 partial, 12 not started
- Production state: 45/71 unit tests failing, 714 ESLint problems, 3 ErrorBoundary implementations
