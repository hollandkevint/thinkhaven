---
title: "feat: ThinkHaven Product Vision v2"
type: feat
date: 2026-03-29
---

# ThinkHaven Product Vision v2 — Implementation Plan

## Enhancement Summary

**Deepened on:** 2026-03-29
**Sections enhanced:** All 7 features + prerequisite refactor added
**Agents used:** TypeScript reviewer, Performance oracle, Security sentinel, Architecture strategist, Frontend races reviewer, Code simplicity reviewer, Best practices researcher, Framework docs researcher, Pattern recognition specialist, Learnings checker (10 total)

### Key Improvements from Research
1. **Prerequisite refactor added:** Extract session page into sub-components before adding features
2. **Scope simplified:** Excalidraw replaced with Mermaid renderer for Sprint C; TTS deferred; onboarding cut to 1 screen
3. **Security fixes:** Existing trial feedback route has caller-supplied user_id vulnerability; new feedback needs session IDOR check + rate limiting
4. **Race conditions found:** useStreamingChat missing AbortController, WorkspaceContext debounced save loses data on unmount
5. **Type safety:** Zod validation for feedback API, web-speech.d.ts type augmentation needed
6. **Performance:** Gate heavy components behind user action, use opacity not filter:saturate, singleton modal pattern

### Scope Changes (Simplicity Review)

| Original | Revised | Rationale |
|----------|---------|-----------|
| 4-screen onboarding | 1-screen modal | No data showing users are confused. Ship simple, iterate. |
| 3 animation types | Pulse only | Speaker switch slide and Taylor hover are premature. |
| Excalidraw panel (~500KB) | Mermaid renderer (~80KB, read-only) | tldraw was already removed for bundle concerns. Ship read-only diagrams first. |
| STT + TTS | STT only | Browser TTS voices sound bad. Per-board-member mapping is unreliable across platforms. |
| Resend email integration | Cut | <10 users. Query Supabase manually. Add email later if needed. |
| Design system sync as sprint task | Post-sprint cleanup | Not blocking. |

---

## Overview

Transform ThinkHaven from a text-only decision session tool into a multi-modal decision design system. Seven features across three sprints: quick wins (UI fix, feedback modal), user guidance (onboarding, board animation), and experimental capabilities (Mermaid diagrams, voice input).

**Brainstorm:** `docs/brainstorms/2026-03-29-product-vision-v2-brainstorm.md`

## Problem Statement

1. **No structured feedback capture** — FeedbackButton is a mailto link. Zero data collection.
2. **No onboarding** — New users don't understand what ThinkHaven is vs ChatGPT/Claude.
3. **Board members feel static** — Cards in the right panel have no sense of presence.
4. **No visual thinking** — Text-only sessions can't produce diagrams.
5. **No voice interaction** — Founders who think by talking can't use their preferred input mode.
6. **CTA bug** — Landing page subtext may clip on narrow viewports.

---

## Sprint 0: Prerequisite Refactor (Do First)

### 0.1 Extract Session Page Sub-Components

The session page is 484 lines and every sprint adds to it. Extract before adding features.

**Extract:**
- `app/components/workspace/SessionHeader.tsx` — title, help icon, export, feedback button
- `app/components/workspace/ChatPanel.tsx` — message list, input area, typing indicator
- `app/components/workspace/RightPanel.tsx` — panel open/close, tab switching, content rendering

**Refactor right panel state:**
```typescript
// Replace binary isCanvasOpen with:
type PanelTab = 'canvas' | 'board' | 'diagram' | null;
const [activePanel, setActivePanel] = useState<PanelTab>(null);
```

**Why:** Architecture review identified that the binary `isCanvasOpen` toggle breaks when adding a third panel type. The god-component-decomposition learning (docs/solutions) confirms: extract hooks early, avoid 700+ line files.

### 0.2 Fix Existing Race Conditions

The frontend races reviewer found critical bugs in existing code. Fix before building on top.

**Critical:**
- `useStreamingChat.ts` — Add `AbortController` to `streamClaudeResponse`. If user navigates away mid-stream, cancel the fetch. Pattern: `const controller = new AbortController(); fetch(url, { signal: controller.signal })`. Cleanup in `useEffect` return.
- `WorkspaceContext.tsx:144-155` — Debounced auto-save uses stale closures and has no unmount cleanup. Use refs for timeout handle and latest state. Flush-save on unmount.

**Moderate:**
- `GuestChatInterface.tsx:176` — Uncancelled `setTimeout`. Store timeout ID, clear on unmount.
- `SpeakerMessage.tsx:45` — Inline ReactMarkdown `components` prop. Extract to module-level constant (already done correctly in session page `MARKDOWN_COMPONENTS`).

### 0.3 Fix Existing Security Issue

**Critical (found by security reviewer):** `app/api/feedback/trial/route.ts:52-71` uses caller-supplied `userId` for the INSERT. Violates CLAUDE.md convention: "SECURITY DEFINER RPCs must not accept caller-supplied user_id." Fix: use `user.id` from `getUser()` directly, remove `userId` from payload.

#### Files

```
app/app/session/[id]/page.tsx              (refactor — extract sub-components)
app/components/workspace/SessionHeader.tsx  (new)
app/components/workspace/ChatPanel.tsx      (new)
app/components/workspace/RightPanel.tsx     (new)
app/app/session/[id]/useStreamingChat.ts   (fix — add AbortController)
lib/workspace/WorkspaceContext.tsx          (fix — stale closure, unmount cleanup)
app/components/guest/GuestChatInterface.tsx (fix — uncancelled timeout)
app/components/board/SpeakerMessage.tsx     (fix — extract MARKDOWN_COMPONENTS)
app/api/feedback/trial/route.ts            (fix — use user.id not payload.userId)
```

---

## Sprint A: Quick Wins (Ship This Week)

### A1. CTA Subtext Fix

**File:** `app/page.tsx:78-83`

The subtext "No account needed. No credit card. 5 messages to see if it's for you." may truncate on narrow viewports.

**Tasks:**
- [ ] Check if `max-w-xl` on the parent `<p>` plus `mx-auto` creates overflow on mobile
- [ ] Verify text wraps properly at 320px, 375px, 414px widths
- [ ] Fix container constraints if clipping confirmed
- [ ] Visual QA on Chrome, Safari, mobile viewport

**Research insight (landing page learning):** The `landing-page-data-duplication-and-ssr.md` solution documents prior SSR issues on this page. Any fix should be tested with both `npm run dev` and `npm run build && npm start`.

---

### A2. In-App Feedback Modal

Replace mailto `FeedbackButton` with an in-app modal.

**Questions (Likert 1-5):**
1. "How useful was this for your decision?"
2. "How likely are you to use ThinkHaven again?"
3. Free text: "What would make ThinkHaven more valuable?" (optional)

#### Design Decisions (Updated)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modal implementation | **Install `@radix-ui/react-dialog`** | TypeScript reviewer: hand-rolled dropdown was already replaced with Radix (commit f556716). Don't repeat the mistake. Gives focus trapping, Escape-to-close, aria-modal for free. |
| Validation | **Zod schema** | Zod `^4.1.5` is already installed. Single source of truth for runtime validation + TypeScript type. |
| Guest feedback | Auth-only. Guests see "Sign up to share feedback" | Prevents spam, links feedback to user. |
| Auto-prompt trigger | `limitReached` only | Sessions have no explicit "end" state. |
| Email delivery | **Cut for now** | <10 users. Query Supabase `feedback` table manually. Add Resend later when volume warrants it. |
| Double-submit | Rate limit via `UNIQUE(user_id, session_id)` constraint | Security reviewer: prevents spam + duplicate rows at DB level. |
| Session context | Include `session_id` with **IDOR check** | Security reviewer: verify user owns the referenced session before insert. |
| Table | New `feedback` table (migration 028) | Different questions from `trial_feedback`. Keep both. |
| Success UX | 2-second success state, then modal closes | Matches existing pattern. |
| Modal rendering | **Singleton via zustand store** | Performance reviewer: three FeedbackButton instances (sidebar, header, nav) should open one shared modal, not three. |

#### Zod Schema

```typescript
// lib/feedback/feedback-schema.ts
import { z } from 'zod';

export const FeedbackSchema = z.object({
  decision_usefulness: z.number().int().min(1).max(5),
  return_likelihood: z.number().int().min(1).max(5),
  free_text: z.string().max(2000).optional(),
  session_id: z.string().uuid().optional(),
  source: z.enum(['manual', 'auto_limit']),
});

export type FeedbackPayload = z.infer<typeof FeedbackSchema>;
```

#### Database Migration (028)

```sql
-- 028_feedback.sql
-- 1. Feedback table for in-app feedback collection
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.bmad_sessions(id) ON DELETE SET NULL,
  decision_usefulness SMALLINT NOT NULL CHECK (decision_usefulness BETWEEN 1 AND 5),
  return_likelihood SMALLINT NOT NULL CHECK (return_likelihood BETWEEN 1 AND 5),
  free_text TEXT CHECK (char_length(free_text) <= 2000),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto_limit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- 2. Indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);

-- 3. RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_insert_own ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY feedback_select_own ON public.feedback
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

**Research insights:**
- `(SELECT auth.uid())` wrapper is a Supabase-recommended optimization (evaluated once per query, not per-row)
- `UNIQUE(user_id, session_id)` prevents spam at DB level
- `CHECK (char_length(free_text) <= 2000)` adds defense-in-depth beyond API validation
- Drop the `idx_feedback_created_at` index (simplicity reviewer: single-digit users don't need it)

#### Implementation

**Install:** `@radix-ui/react-dialog`

**New:** `lib/feedback/feedback-schema.ts` — Zod schema (above)

**New:** `lib/stores/feedbackStore.ts` — Zustand store for singleton modal state
```typescript
// Minimal store: open/close + optional sessionId
import { create } from 'zustand';

interface FeedbackStore {
  isOpen: boolean;
  sessionId: string | null;
  open: (sessionId?: string) => void;
  close: () => void;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  isOpen: false,
  sessionId: null,
  open: (sessionId) => set({ isOpen: true, sessionId: sessionId ?? null }),
  close: () => set({ isOpen: false, sessionId: null }),
}));
```

**New:** `app/components/feedback/FeedbackModal.tsx`
- Uses `@radix-ui/react-dialog` (focus trapping, Escape, aria-modal)
- Reads `useFeedbackStore` for open/close state
- Two Likert rows (1-5 buttons, terracotta selected state)
- Textarea for free text
- Success state with 2s auto-close (store timeout ref, clear on unmount per races reviewer)
- Rendered **once** in app layout, not per-button

**Modify:** `app/components/feedback/FeedbackButton.tsx`
- Replace `<a href={mailto}>` with `<button onClick={() => useFeedbackStore.getState().open(sessionId)}>`
- Keep all three variants (sidebar, header, nav)
- Accept optional `sessionId` prop

**New:** `app/api/feedback/route.ts`
- **Null-check `createClient()`** (CLAUDE.md pitfall #10, return 503)
- Auth via `getUser()` (401 if no auth)
- Validate with `FeedbackSchema.safeParse(body)`
- **IDOR check:** if `session_id` provided, verify user owns it via Supabase query
- Insert to `feedback` table using `user.id` (NEVER from request body)
- Return generic error messages only (security reviewer: no raw error leaks)
- Use `NextResponse.json()` (pattern recognition: majority of routes use this)

**Modify:** `app/app/layout.tsx` or `app/providers.tsx`
- Render single `<FeedbackModal />` instance

**Modify:** `app/components/workspace/SessionHeader.tsx` (post-extraction)
- Pass `session.id` to `FeedbackButton`
- On `limitReached`: call `useFeedbackStore.getState().open(sessionId)` after 1s delay (store timeout, clear on unmount)

#### Files

```
@radix-ui/react-dialog                     (install)
lib/feedback/feedback-schema.ts             (new — Zod schema)
lib/stores/feedbackStore.ts                 (new — zustand singleton)
app/components/feedback/FeedbackModal.tsx    (new — Radix Dialog)
app/components/feedback/FeedbackButton.tsx   (modify — open store)
app/api/feedback/route.ts                   (new — validated, IDOR-checked)
supabase/migrations/028_feedback.sql        (new)
app/providers.tsx                           (modify — render FeedbackModal once)
```

---

### A3. Design System Sync

Post-sprint cleanup. Update `docs/design/design-system.pen` via Pencil MCP with feedback modal component after shipping.

---

## Sprint B: Onboarding + Board Animation (Weeks 2-3)

### B1. Onboarding Flow (Simplified to 1 Screen)

**Simplicity revision:** 4 screens with step indicators is premature. No data shows users are confused. Ship one screen, iterate based on feedback.

#### Design Decisions (Updated)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Screens | **1 screen** | Simplicity reviewer: 4 screens is product-manager fantasy for alpha. 3 bullet points + CTA. |
| Trigger location | `/app` (auth users), `/try` (guests) | `/` already has marketing copy. |
| Storage | localStorage `thinkhaven_onboarding_completed` | Works for guests. Auth users: localStorage is fine at this stage. If cross-device becomes an issue, migrate to Supabase `user_metadata` later. |
| Re-trigger | Help icon (`HelpCircle` from lucide) in session header | Clears flag and re-shows modal. Uses component state for re-trigger (not localStorage manipulation). |
| Modal collision | z-60 priority over SignupPromptModal (z-50) | Won't overlap in practice, but z-index prevents it. |
| Implementation | `@radix-ui/react-dialog` (already installing for feedback) | Consistent with new modal pattern. |

#### Content (1 Screen)

**Title:** "ThinkHaven is a decision design system"

**Three bullet points:**
1. Not a chatbot. Structured sessions that test whether your idea is worth building.
2. Six AI advisors challenge your thinking from different angles. Mary facilitates.
3. You get artifacts (Lean Canvas, diagrams), not just chat.

**CTA:** "Got it" (closes modal)

#### Implementation

**New:** `app/components/onboarding/OnboardingModal.tsx`
- Radix Dialog
- **Lazy-init state from localStorage** (performance reviewer): `const [show] = useState(() => !localStorage.getItem('thinkhaven_onboarding_completed'))`
- No useEffect flash. Single read, no re-render.
- Set flag on dismiss (click "Got it" or Escape)
- ~40 lines total

**Modify:** `app/app/layout.tsx` — Render `<OnboardingModal />` for auth users
**Modify:** `app/try/page.tsx` — Render `<OnboardingModal />` for guests
**Modify:** `app/components/workspace/SessionHeader.tsx` — Help icon to re-trigger (component state, not localStorage clear)

#### Files

```
app/components/onboarding/OnboardingModal.tsx  (new — ~40 lines)
app/app/layout.tsx                             (modify)
app/try/page.tsx                               (modify)
app/components/workspace/SessionHeader.tsx      (modify — help icon)
```

---

### B2. Board Member Card Animation (Pulse Only)

**Simplicity revision:** Ship only the active speaker pulse. Defer speaker-switch slide and Taylor hover warmup until users notice.

#### Design Decisions (Updated)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Animation types | **Pulse only** | Simplicity reviewer: one animation communicates "this member is talking." |
| Implementation | CSS `@keyframes` | No new dependency needed. Cards already have `transition-all`. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables pulse | Accessibility requirement. |
| Performance | `transform` and `opacity` only | Performance reviewer: `filter:saturate` is NOT GPU-composited, causes paint jank on mobile Safari. |
| `will-change` | Conditional on active card only | Performance reviewer: blanket `will-change` on 6 cards wastes GPU memory. |
| `transition-all` | Replace with explicit properties | Pattern/perf reviewers: `transition-all` transitions every CSS property. Use `transition: transform 200ms ease, opacity 200ms ease` instead. |

#### Animation

**Active speaker pulse:** `scale(1.0 → 1.02 → 1.0)`, 3s loop, CSS `@keyframes`.

```css
/* globals.css */
@keyframes board-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@media (prefers-reduced-motion: reduce) {
  .animate-board-pulse { animation: none !important; }
}
```

#### Implementation

**Modify:** `app/globals.css` — Add `@keyframes board-pulse` + reduced-motion query
**Modify:** `tailwind.config.cjs` — Add `board-pulse` to animation config
**Modify:** `app/components/board/BoardMemberCard.tsx`:
- Add `animate-board-pulse` class when `isActive`
- Replace `transition-all` with explicit transition properties
- Add conditional `will-change: transform` on active card only

#### Files

```
app/globals.css                           (modify — keyframes, reduced-motion)
tailwind.config.cjs                       (modify — animation config)
app/components/board/BoardMemberCard.tsx   (modify — pulse class, explicit transitions)
```

---

## Sprint C: Experimental (Weeks 4-7)

### C1. Mermaid Diagram Renderer (Replaces Excalidraw)

**Simplicity revision:** Full Excalidraw (~500KB+) with bidirectional editing is massive scope for an "experimental" sprint. tldraw was already removed for similar bundle concerns (PR #24). Ship a read-only Mermaid renderer first. If users love diagrams and ask to edit them, add Excalidraw later.

**What ships:** AI generates Mermaid in fenced code blocks. A markdown renderer detects ` ```mermaid ` blocks and renders them as SVG using `mermaid.js` (already in `package.json` at `^11.12.0`).

#### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Library | `mermaid` (already installed, ~80KB) | vs. Excalidraw (~500KB+). 6x smaller. Already a dependency. |
| Interaction | Read-only | YAGNI. Ship diagrams users can see. Editing is a separate feature. |
| AI generation | Fenced Mermaid code blocks in responses | No new tool needed. Claude already generates Mermaid reliably. |
| Storage | Part of chat messages (no new DB column) | Mermaid is just text in the message. No migration needed. |
| Panel integration | Rendered inline in chat messages | No panel tab switching needed. |

#### Implementation

**Modify:** `app/components/chat/MarkdownRenderer.tsx` (or session page `MARKDOWN_COMPONENTS`)
- Detect ` ```mermaid ` code blocks
- Render with `mermaid.render()` to SVG
- Wrap in error boundary (malformed Mermaid syntax should show the raw text, not crash)

**No new files, no new dependencies, no new migrations.**

#### Research Insights

If Mermaid proves popular and users want editing, the upgrade path to Excalidraw is:
- `@excalidraw/mermaid-to-excalidraw` (v2.2.2) converts flowcharts to native elements; other diagram types render as images
- Excalidraw v0.18.0 supports React 19 (PR #9182, Feb 2025)
- Must use dynamic import, CSS import inside wrapper, explicit container height
- Container MUST have explicit pixel/percentage height (renders nothing with `height: auto`)

#### Files

```
MARKDOWN_COMPONENTS in session page or MarkdownRenderer.tsx  (modify — add mermaid block renderer)
```

---

### C2. Voice Input (STT Only, No TTS)

**Simplicity revision:** Ship speech-to-text mic input only. Cut TTS — browser voices sound bad and per-board-member mapping is unreliable across platforms. Add TTS later with ElevenLabs/Google Cloud TTS for quality voices.

#### Design Decisions (Updated)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| STT provider | Web Speech API (`webkitSpeechRecognition`) | Browser-native, free, no API key. Chrome/Edge primary. |
| TTS | **Cut entirely** | Simplicity reviewer: browser TTS voices are bad. Per-board-member mapping unreliable. Ship later with proper voices. |
| Interaction model | Toggle (click to start/stop) | More accessible than press-and-hold. |
| Transcription flow | Populate textarea for review, user sends manually | 10-message limit makes auto-send too risky. |
| Browser support | Chrome/Edge primary, hide mic on unsupported | Feature detection via `window.SpeechRecognition \|\| window.webkitSpeechRecognition`. |
| Recording during stream | Disabled (mic button disabled while `sendingMessage`) | Consistent with textarea disable. |
| Feature detection | **In `useEffect`, not module scope** | TypeScript reviewer: Next.js SSR means module-level `window` access fails. |
| TypeScript types | **Add `types/web-speech.d.ts`** | TypeScript reviewer: `webkitSpeechRecognition` has no built-in types. Without this, Voice I/O will be `any` everywhere. |
| Privacy | **Disclosure near mic button** | Security reviewer: Chrome sends audio to Google servers. Add "Voice processed by your browser" notice. |
| Voice input path | **Funnel through textarea** | Architecture reviewer: populate textarea, user clicks Send. Single code path for message submission. Zero changes to streaming pipeline. |

#### Type Augmentation

```typescript
// types/web-speech.d.ts
interface Window {
  webkitSpeechRecognition: typeof SpeechRecognition;
}
```

TypeScript `lib.dom.d.ts` (4.4+) includes `SpeechRecognition` and `SpeechSynthesis` base types. Only the webkit prefix needs augmentation.

#### Implementation

**New:** `types/web-speech.d.ts` — Type augmentation for webkit prefix

**New:** `lib/voice/useSpeechRecognition.ts` — Custom hook
- Feature detection in `useEffect` (not module scope)
- `SpeechRecognition` instance management via ref
- `isListening`, `isSupported`, `start()`, `stop()` interface
- Handle Chrome auto-stop after silence (~5s with `continuous: false`)
- Track `lastProcessedIndex` ref for interim result deduplication
- Cleanup: `recognition.abort()` on unmount
- Use `useRef` initialization guard to prevent double-init in React Strict Mode (learning #25)

**New:** `app/components/chat/VoiceInput.tsx`
- Mic button with recording state indicator (pulsing red dot)
- Uses `useSpeechRecognition` hook
- Populates parent's textarea via callback (funnel through existing input path)
- Feature detection: renders nothing if API unavailable
- Permission error: show brief message, hide mic
- Privacy notice: small text "Voice processed by your browser" on first use
- ~50 lines

**Modify:** `app/components/workspace/ChatPanel.tsx` (post-extraction)
- Add `<VoiceInput>` next to textarea
- Pass `onTranscript` callback that sets message input

#### Research Insights (from best practices researcher)

| Pitfall | Mitigation |
|---------|-----------|
| `start()` throws if already running | Gate on `isListening` state |
| Chrome auto-stops after ~5s silence | Use `continuous: false` (default), restart on `onend` if desired |
| Safari requires Siri enabled | Feature-detect; show "Enable Siri" message if API exists but fails |
| iOS PWA: API completely unavailable | Feature detection handles this (renders nothing) |
| Mobile keyboard interferes with speech | Blur focused textarea before starting recognition |
| `onresult` rebuilds all interim results | Track `lastProcessedIndex` ref, process only new results |

#### Files

```
types/web-speech.d.ts                      (new — type augmentation)
lib/voice/useSpeechRecognition.ts           (new — custom hook)
app/components/chat/VoiceInput.tsx          (new — mic button ~50 lines)
app/components/workspace/ChatPanel.tsx      (modify — integrate VoiceInput)
```

---

## Acceptance Criteria

### Sprint 0 (Prerequisite)
- [ ] Session page split into SessionHeader, ChatPanel, RightPanel sub-components
- [ ] Right panel uses `PanelTab` enum instead of `isCanvasOpen` boolean
- [ ] `useStreamingChat` has AbortController with cleanup on unmount
- [ ] WorkspaceContext debounced save uses refs and flushes on unmount
- [ ] Existing trial feedback route uses `user.id` not `payload.userId`

### Sprint A
- [ ] Landing page subtext fully visible on 320px-1440px viewports
- [ ] Feedback modal opens from sidebar, header, and nav (singleton via zustand)
- [ ] Feedback modal uses Radix Dialog (focus trap, Escape, aria-modal)
- [ ] Feedback validates via Zod schema
- [ ] Submit → row in `feedback` table with IDOR-checked session_id
- [ ] `createClient()` null-checked in API route
- [ ] Auto-prompt feedback modal when `limitReached` (1s delay, cleanup on unmount)
- [ ] `UNIQUE(user_id, session_id)` prevents duplicate feedback per session

### Sprint B
- [ ] First visit to `/app` or `/try` shows single-screen onboarding modal
- [ ] Onboarding uses Radix Dialog, lazy-inits from localStorage (no flash)
- [ ] Onboarding doesn't re-show after dismiss
- [ ] Help icon in session header re-triggers onboarding
- [ ] Active board member card has subtle breathing pulse animation
- [ ] Pulse uses `transform` only (GPU-composited), no `filter:saturate`
- [ ] `prefers-reduced-motion` disables pulse
- [ ] `transition-all` replaced with explicit transition properties on BoardMemberCard

### Sprint C
- [ ] Mermaid code blocks in AI responses render as SVG diagrams inline
- [ ] Malformed Mermaid shows raw code block (no crash)
- [ ] No new dependencies for diagrams (mermaid already installed)
- [ ] Mic button visible on Chrome/Edge, hidden on unsupported browsers
- [ ] Voice input populates textarea for review before sending
- [ ] Privacy notice shown near mic button
- [ ] Permission denied → mic button hidden with message
- [ ] `types/web-speech.d.ts` provides proper TypeScript types

## Dependencies & Risks (Updated)

| Risk | Mitigation |
|------|-----------|
| Session page refactor breaks existing behavior | Sprint 0 is prerequisite. Test thoroughly before proceeding. |
| Radix Dialog installation | Only one new dependency. Well-maintained, small bundle. |
| Mermaid rendering edge cases | Error boundary wraps renderer. Malformed syntax shows raw text. |
| Web Speech API Chrome-only | Feature detection. Hidden on unsupported. Not a core feature. |
| `UNIQUE(user_id, session_id)` allows one feedback per session | Intentional. If needed, change to `UNIQUE(user_id, session_id, source)` to allow one manual + one auto_limit. |

## Existing Bugs to Fix (Found by Reviewers)

These should be fixed in Sprint 0 alongside the refactor:

| Bug | File | Severity |
|-----|------|----------|
| useStreamingChat: no AbortController, state updates on unmounted component | `useStreamingChat.ts` | Critical |
| WorkspaceContext: stale closure in debounced save, data loss on unmount | `WorkspaceContext.tsx:144-155` | Critical |
| Trial feedback route: caller-supplied user_id in INSERT | `api/feedback/trial/route.ts:52-71` | Critical |
| GuestChatInterface: uncancelled 5s setTimeout | `GuestChatInterface.tsx:176` | Moderate |
| SpeakerMessage: inline ReactMarkdown components prop | `SpeakerMessage.tsx:45` | Moderate |
| StateBridge: shared timeout ref across two effects | `StateBridge.tsx:34,62` | Low |
| ArtifactEditor: nested setTimeout without cleanup | `ArtifactEditor.tsx:55` | Low |

## References

- Existing feedback form: `app/components/monetization/FeedbackForm.tsx`
- Existing modal pattern: `app/components/guest/SignupPromptModal.tsx`
- Existing feedback API: `app/api/feedback/trial/route.ts`
- Board member types: `lib/ai/board-types.ts`
- Tool definitions: `lib/ai/tools/index.ts`
- Canvas sync pattern: `lib/canvas/useCanvasSync.ts`
- Migration pattern: `supabase/migrations/006_trial_feedback.sql`
- Design system: `docs/design/design-system.pen`, `app/globals.css`, `tailwind.config.cjs`
- Brainstorm: `docs/brainstorms/2026-03-29-product-vision-v2-brainstorm.md`

### Learnings Applied (from docs/solutions/)
- Pattern #25: React State Initialization Guard — voice I/O, onboarding
- Pattern #29: Explicit Error Handling — voice permissions, feedback API
- Pattern #2: Single Source of Truth for UI — use canonical shadcn components
- Pattern #10: Atomic State Transitions — onboarding step state
- God Component Decomposition — extract session page sub-components
- Security Hardening — IDOR checks, no PII logging, no raw error messages
- Pattern #32: Reusable Auth Guards — centralize auth checks in API routes
