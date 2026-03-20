---
title: "Session UX Overhaul: Chat-First, Simplified"
type: feat
date: 2026-03-15
---

# Session UX Overhaul: Chat-First, Simplified

## Enhancement Summary

**Deepened on:** 2026-03-15
**Agents used:** TypeScript Reviewer, Performance Oracle, Security Sentinel, Code Simplicity Reviewer, Architecture Strategist, Pattern Recognition Specialist, Frontend Race Conditions Reviewer, Framework Docs Researcher, Best Practices Researcher, Learnings Researcher

### Key Improvements Over Original Plan
1. **P0 Bug Found:** `quick-decision` is NOT in the database CHECK constraint. Would crash on insert. Requires migration 021 before implementation.
2. **P0 Bug Found:** `MessageLimitWarning` uses `querySelector('[title="Export chat conversation"]')` which breaks silently when ExportPanel trigger button is removed.
3. **Simplified approach:** Use conditional render (`{showExport && <ExportPanel />}`) instead of controlled-mode refactor. Delete `WorkspaceTab`, `activeTab`, and `useSharedInput` now, not later.
4. **Board pane race condition:** `useEffect` that auto-opens board must track user dismissal to prevent force-reopening on every streaming metadata event.
5. **Unmount safety:** `creatingRef` on `/app/new` doesn't handle component unmount during in-flight session creation. Needs `isMounted` ref.
6. **Bundle win quantified:** BmadInterface is a static import (~8,300 lines of transitive deps). Removing it saves ~15-25KB gzipped.

### New Risks Discovered
- Feedback email mismatch: plan used `feedback@thinkhaven.co`, existing `FeedbackButton` uses `kevin@kevintholland.com`
- DB CHECK constraint only allows 3 pathways (migration 001), but `PathwayType` enum has 5. Neither has `quick-decision`.
- Raw Supabase error messages leak DB internals (table names, constraint names) to the UI

---

## Overview

The session page is unusable for alpha testers. Users land on a BMad progress dashboard instead of the chat with Mary. The header has 11 items. The canvas pane is blank. Pathway selection is broken (hardcodes `new-idea` regardless of query param). This plan restructures the session page to be chat-first with a minimal header.

## Problem Statement

Kevin tested production, created a "Quick Decision" session, and hit every friction point:
- Wrong pathway (hardcoded `new-idea` instead of reading `?pathway=quick-decision`)
- Wrong default tab (BMad progress dashboard instead of Mary Chat)
- Blank canvas pane with no clear purpose
- Information overload in header (11 items)
- No clear action on first load

## Proposed Solution

1. Fix pathway query param handling on `/app/new` (with DB migration prerequisite)
2. Default to Chat tab, remove BMad tab and tab navigation entirely
3. Simplify header to: back arrow, title, ModeIndicator, ToneSelector, overflow menu
4. Auto-open board pane when Board of Directors activates (with user-dismiss tracking)
5. Update loading skeleton, E2E tests, and fix MessageLimitWarning export trigger

## Technical Approach

### Phase 0: Database Migration (PREREQUISITE)

**File:** `apps/web/supabase/migrations/021_add_quick_decision_pathway.sql` (NEW)

**Problem:** The DB CHECK constraint (migration 001, line 12) only allows 3 pathways:
```sql
CHECK (pathway IN ('new-idea', 'business-model', 'strategic-optimization'))
```

But the `PathwayType` enum (`lib/bmad/types.ts:92-98`) has 5 values. And `quick-decision` exists in neither.

**Fix:** Add migration to expand the CHECK constraint to match `PathwayType` plus `quick-decision`:

```sql
-- Migration 021: Add quick-decision pathway and sync CHECK with PathwayType enum
ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;
ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
  CHECK (pathway IN (
    'new-idea',
    'quick-decision',
    'business-model',
    'business-model-problem',
    'feature-refinement',
    'strategic-optimization'
  ));
```

Also add `QUICK_DECISION` to the `PathwayType` enum:

```typescript
// lib/bmad/types.ts
export enum PathwayType {
  NEW_IDEA = 'new-idea',
  QUICK_DECISION = 'quick-decision',  // NEW
  BUSINESS_MODEL = 'business-model',
  BUSINESS_MODEL_PROBLEM = 'business-model-problem',
  FEATURE_REFINEMENT = 'feature-refinement',
  STRATEGIC_OPTIMIZATION = 'strategic-optimization'
}
```

### Research Insights (Phase 0)

**Data Integrity:** Three agents independently discovered this constraint mismatch. The TypeScript reviewer, security sentinel, and pattern recognition specialist all flagged it. Without this migration, the plan's motivating example (`?pathway=quick-decision`) crashes with a Postgres constraint violation.

**Single Source of Truth (Pattern #16, Institutional Learning):** Use `Object.values(PathwayType)` for validation instead of a separate `VALID_PATHWAYS` array. This prevents drift between the enum and the validation list.

---

### Phase 1: Fix Pathway Selection

**File:** `apps/web/app/app/new/page.tsx`

**Problem:** Line 46 hardcodes `pathway: 'new-idea'`, ignoring `?pathway=quick-decision`.

**Fix:** Extract session creation to a child component using `useSearchParams()`, wrapped in `<Suspense>` (required by Next.js 15 for client components). Validate pathway against `PathwayType` enum values.

```tsx
// apps/web/app/app/new/page.tsx
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PathwayType } from '@/lib/bmad/types'
import AnimatedLoader from '@/app/components/ui/AnimatedLoader'

const validPathways = Object.values(PathwayType) as string[]

function isValidPathway(value: string): value is PathwayType {
  return validPathways.includes(value)
}

// New default export wraps content in Suspense:
export default function NewSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream">
        <AnimatedLoader messages={sessionMessages} className="min-h-screen" />
      </div>
    }>
      <NewSessionContent />
    </Suspense>
  )
}

function NewSessionContent() {
  const searchParams = useSearchParams()
  const isMountedRef = useRef(true)
  // ... existing creatingRef guard ...

  // Replace hardcoded pathway:
  const rawPathway = searchParams.get('pathway') ?? 'new-idea'
  const pathway = isValidPathway(rawPathway) ? rawPathway : PathwayType.NEW_IDEA

  // Add unmount cleanup:
  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const createSession = useCallback(async () => {
    // ... existing guards ...
    try {
      // ... Supabase insert with validated `pathway` ...
      if (!isMountedRef.current) return  // Don't navigate if unmounted
      router.push(`/app/session/${session.id}`)
    } catch (err) {
      if (!isMountedRef.current) return
      // Map Supabase errors to user-friendly messages:
      const errorMessage = err instanceof Error
        ? 'Failed to create session. Please try again.'
        : 'An unexpected error occurred.'
      console.error('Session creation error:', err)
      setError(errorMessage)
    }
  }, [user, router, pathway])
  // ...
}
```

### Research Insights (Phase 1)

**Type Safety (TypeScript Reviewer):** The original `as any` cast on `VALID_PATHWAYS.includes()` silences legitimate type errors. The `isValidPathway` type guard properly narrows the type.

**Unmount Race (Frontend Races Reviewer, CRITICAL):** `creatingRef` prevents double-creation but doesn't handle unmount. If the user navigates away during session creation, `router.push()` fires on an unmounted component. The `isMountedRef` check after every `await` prevents this.

**Error Leakage (Security Sentinel):** Raw Supabase error messages expose DB internals (table names, constraint names). Map to generic user-friendly messages.

**Next.js 15 Suspense (Framework Docs):** `useSearchParams` works without Suspense in development but fails in production builds. The existing `login/page.tsx` pattern is the correct reference. Test mock at `tests/setup.ts:24` already handles this.

---

### Phase 2: Session Page - Remove Tabs, Clean Dead Code

**File:** `apps/web/app/app/session/[id]/page.tsx`

#### 2a. Remove ALL tab-related code (not just default change)

Delete entirely:
- `WorkspaceTab` type (line 48) -- YAGNI, re-add if tabs return
- `activeTab` state (line 56) -- serves no purpose with one tab
- `handleTabSwitch` function (lines 148-155)
- Preserved-input restore effect (lines 158-162) -- **must be atomic with useSharedInput removal**
- Tab navigation JSX (lines 331-368)
- BMad tab render branch (lines 663-672)
- `BmadInterface` import (line 12) -- **static import, removing saves ~15-25KB gzipped**
- `useSharedInput` import and all usage (lines 15, 87) -- **delete the hook file too** (`app/components/workspace/useSharedInput.ts`)

Also remove these now-dead items:
- `MessageCircle` from lucide-react imports (line 8, only used in tab nav)
- `LayoutTemplate` from lucide-react imports (line 8, only used in canvas toggle)
- `handleScrollToCanvas` callback (lines 136-146, unreachable without canvas toggle)

#### 2b. Replace ternary with direct chat render

```tsx
{/* Chat content renders directly, no tab conditional */}
<div className="flex-1 flex flex-col overflow-hidden">
  <>
    {/* ... existing chat content (welcome message, messages, form) ... */}
  </>
</div>
```

### Research Insights (Phase 2)

**Bundle Size (Performance Oracle):** BmadInterface is a static import (NOT behind `next/dynamic`) that pulls in ~8,300 lines across 28 component files. Removing it eliminates the entire subtree from the session page's client bundle. Verify with `npm run build` and compare First Load JS.

**Simplicity (Code Simplicity Reviewer):** Keeping dead types/state "for future reuse" is YAGNI. `WorkspaceTab` with one value is meaningless. `activeTab` that never changes is dead state. Delete now, re-add in 30 seconds if needed.

**Atomic Removal (Frontend Races Reviewer):** The `useSharedInput` removal, tab switch handler removal, and restore effect removal MUST happen as a single unit. If the implementer misses one, the others break with a `ReferenceError` at runtime.

**Hook File Deletion (Simplicity + Performance):** `useSharedInput` uses a module-level mutable singleton (`let sharedInputState`) that persists across renders. With zero consumers after this PR, delete the file. Add `// @deprecated` comment to `BmadInterface.tsx` with the PR number.

---

### Phase 3: Simplify Header + Overflow Menu

**File:** `apps/web/app/app/session/[id]/page.tsx` (header section, lines 280-328)

#### 3a. New header layout

```
← [Session Title]  [Mode Pill]  [Tone Selector]  ⋯
```

**Keep in header:**
- Back arrow (`<Link href="/app">`)
- Title (`h1`) with `truncate max-w-[200px]` for long custom names
- `ModeIndicator` component
- `ToneSelector` component

**Move to overflow menu (⋯):**
- Export (conditionally renders ExportPanel)
- Feedback (mailto link, using existing `FEEDBACK_MAILTO` constant)
- Account (Link to `/app/account`)
- Sign Out (calls `signOut()`)

**Remove from header entirely:**
- Canvas toggle button (lines 298-308)
- `ArtifactList` badge (line 309)
- Email display (line 316)

#### 3b. New component: `HeaderOverflowMenu`

**File:** `apps/web/app/components/session/HeaderOverflowMenu.tsx` (NEW)

Uses `useClickOutside` hook (matches `ModeIndicator` and `ToneSelector` pattern).

```tsx
// apps/web/app/components/session/HeaderOverflowMenu.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { FEEDBACK_MAILTO } from '@/app/components/feedback/FeedbackButton'

interface HeaderOverflowMenuProps {
  onExportClick: () => void
  onSignOut: () => void
}

export default function HeaderOverflowMenu({
  onExportClick,
  onSignOut,
}: HeaderOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])
  const menuRef = useClickOutside<HTMLDivElement>(close, isOpen)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded text-muted-foreground hover:text-ink hover:bg-parchment/50 transition-colors"
        aria-label="More options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-48 bg-cream border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={() => { onExportClick(); close() }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Export Chat
          </button>
          <a
            role="menuitem"
            href={FEEDBACK_MAILTO}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Send Feedback
          </a>
          <div className="border-t border-border my-1" />
          <Link
            href="/app/account"
            role="menuitem"
            className="block px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Account
          </Link>
          <button
            role="menuitem"
            onClick={() => { onSignOut(); close() }}
            className="w-full text-left px-4 py-2.5 text-sm text-rust hover:bg-parchment/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 3c. ExportPanel integration (simplified)

**Do NOT refactor ExportPanel to controlled mode.** Instead, conditionally render it:

```tsx
// In page.tsx:
const [showExport, setShowExport] = useState(false)

// Conditionally render -- mounts fresh when opened, unmounts when closed
// This avoids getExportStats() running on every keystroke
{showExport && (
  <div className="relative">
    <ExportPanel
      messages={workspace.chat_context}
      workspaceName={workspace.name}
      workspaceId={workspace.id}
    />
  </div>
)}

<HeaderOverflowMenu
  onExportClick={() => setShowExport(true)}
  onSignOut={signOut}
/>
```

ExportPanel keeps its own internal `isOpen` state and trigger button. When conditionally rendered, it mounts with `isOpen=false`, and the user sees the trigger button. Its existing backdrop handles closing. No refactor to ExportPanel needed.

**Alternative (if ExportPanel auto-opening is wanted):** Set ExportPanel's initial `isOpen` default to `true` when rendered from the overflow menu via a new `initialOpen` prop. Simpler than full controlled mode.

#### 3d. Fix MessageLimitWarning export trigger (P0)

**File:** `apps/web/app/app/session/[id]/page.tsx` (line 619)

The current `MessageLimitWarning.onExport` callback uses `document.querySelector('[title="Export chat conversation"]')`. This breaks silently when ExportPanel isn't rendered. Replace with direct state setter:

```tsx
<MessageLimitWarning
  limitStatus={limitStatus}
  onExport={() => setShowExport(true)}
  onNewSession={() => { window.location.href = '/app' }}
/>
```

### Research Insights (Phase 3)

**Email Mismatch (Pattern Recognition):** Existing `FeedbackButton` uses `FEEDBACK_MAILTO = 'mailto:kevin@kevintholland.com...'`. The plan originally hardcoded `feedback@thinkhaven.co`. Import and reuse the existing constant.

**CSS Consistency (Pattern Recognition):**
- Use `rounded` not `rounded-lg` on trigger button (matches ModeIndicator/ToneSelector)
- Use `mt-1` not `mt-2` on dropdown (matches sibling dropdowns)
- Add `overflow-hidden` to dropdown container (matches siblings)

**Escape Key (TypeScript Reviewer + Best Practices):** Neither ModeIndicator nor ToneSelector handle Escape. The overflow menu should, since it's an action menu per WAI-ARIA APG. Added `useEffect` for Escape key handling.

**ExportPanel Simplification (Simplicity + Performance + Architecture):** Three reviewers agreed: don't add controlled mode. Conditional rendering (`{showExport && <ExportPanel />}`) is simpler, avoids `getExportStats()` running on every keystroke, and requires zero changes to ExportPanel. The performance oracle noted ExportPanel iterates all messages unconditionally on every render.

**querySelector Breakage (TypeScript + Architecture + Security):** Three agents flagged this independently. The DOM query finds nothing when ExportPanel isn't rendered, silently breaking the export-from-limit-reached flow.

---

### Phase 4: Auto-Open Board Pane (Critical Fix)

**File:** `apps/web/app/app/session/[id]/page.tsx`

**Problem:** With canvas toggle removed, nothing sets `isCanvasOpen = true`. Board of Directors renders invisibly.

**Fix with user-dismiss tracking:**

```tsx
const [userDismissedBoard, setUserDismissedBoard] = useState(false)

// Auto-open right pane on initial Board of Directors activation
useEffect(() => {
  if (boardState && !userDismissedBoard) {
    setIsCanvasOpen(true)
  }
}, [boardState, userDismissedBoard])

// Pass dismiss handler to BoardOverview:
<BoardOverview
  boardState={boardState}
  onClose={() => {
    setIsCanvasOpen(false)
    setUserDismissedBoard(true)
  }}
/>
```

### Research Insights (Phase 4)

**Force-Reopen Race (Performance + Frontend Races + Architecture):** `boardState` changes on every `speaker_change` event, `complete` event, and `metadata` event during streaming. Without `userDismissedBoard`, the pane snaps back open every time the user closes it mid-conversation. Three agents flagged this independently.

**State Machine Debt (Architecture Strategist):** `isCanvasOpen` + `boardState` is an implicit state machine with an impossible state (`boardState=truthy, isCanvasOpen=false`). The ideal fix is a discriminated `RightPane` union:
```typescript
type RightPane =
  | { type: 'closed' }
  | { type: 'canvas' }
  | { type: 'board'; state: BoardState }
```
This eliminates the useEffect sync entirely. Document as follow-up tech debt for now.

**CLS During Transition (Frontend Races):** The `dual-pane-container` has `transition-all duration-300`. When the board auto-opens, the chat pane shrinks from 100% to 60% while the user is reading. Text reflows mid-sentence. Consider using `duration-0` for programmatic opens (not user-triggered).

---

### Phase 5: Update Loading Skeleton

**File:** `apps/web/app/app/session/[id]/page.tsx` (lines 164-227)

Update skeleton to match new layout. Use `bg-parchment` for skeleton elements (matches `LoadingSkeleton.tsx` conventions, not `bg-muted` which is used inconsistently in inline skeletons).

```tsx
{/* Loading skeleton */}
<div className="dual-pane-container canvas-closed">
  <div className="chat-pane">
    {/* Simplified header skeleton */}
    <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-parchment rounded animate-pulse" />
        <div className="h-6 w-48 bg-parchment rounded animate-pulse" />
        <div className="h-7 w-24 bg-parchment/50 rounded-full animate-pulse" />
        <div className="h-7 w-28 bg-parchment/50 rounded-full animate-pulse" />
      </div>
      <div className="h-8 w-8 bg-parchment/50 rounded animate-pulse" />
    </header>

    {/* Chat content skeleton */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome message skeleton */}
          <div className="bg-parchment/50 p-6 rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-terracotta/30 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-64 bg-parchment rounded" />
                <div className="h-4 w-full bg-parchment/70 rounded" />
                <div className="h-4 w-4/5 bg-parchment/70 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="mt-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 h-[50px] bg-parchment/20 border border-border rounded-lg animate-pulse" />
          <div className="h-[50px] w-16 bg-parchment rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
  <div className="canvas-pane" />
</div>
```

### Research Insights (Phase 5)

**Skeleton Color Consistency (Pattern Recognition):** The codebase has a `LoadingSkeleton.tsx` component library using `bg-parchment`. The inline skeletons use `bg-muted`. Use `bg-parchment` for consistency with the design system.

**CLS Prevention (Framework Docs):** Header height (`h-14`), chat area structure, and input bar dimensions match the real content. No tab bar in skeleton (removed). CLS risk is minimal.

---

### Phase 6: Update E2E Tests

**File:** `apps/web/tests/e2e/smoke/auth-session.spec.ts`

```ts
// Step 5: Wait for chat to be ready (no tab switching needed)
const chatInput = page.locator('textarea[placeholder*="strategic question"]');
await expect(chatInput).toBeVisible({ timeout: 15000 });
console.log('PASS: Session page hydrated with chat ready');

// Step 6: removed (no tab to click)
// Step 7: chatInput already located above, skip redundant locator
```

**File:** `apps/web/tests/helpers/selectors.ts`

```diff
- chatTab: 'button:has-text("Mary Chat"), [data-testid="chat-tab"]',
- bmadTab: 'button:has-text("BMad Method"), [data-testid="bmad-tab"]',
+ overflowMenu: 'button[aria-label="More options"]',
```

**File:** `apps/web/app/components/feedback/FeedbackButton.tsx`

Export the `FEEDBACK_MAILTO` constant so `HeaderOverflowMenu` can import it:
```diff
- const FEEDBACK_MAILTO = 'mailto:kevin@kevintholland.com...'
+ export const FEEDBACK_MAILTO = 'mailto:kevin@kevintholland.com...'
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Migration 021 applied: `quick-decision` accepted by DB CHECK constraint
- [ ] `/app/new?pathway=quick-decision` creates session with `pathway: 'quick-decision'`
- [ ] `/app/new?pathway=garbage` falls back to `pathway: 'new-idea'`
- [ ] `/app/new` (no param) uses `pathway: 'new-idea'`
- [ ] Session page loads with chat active and Mary welcome message visible
- [ ] No BMad tab button visible, no tab navigation bar
- [ ] Header shows: back arrow, title (truncated if long), mode pill, tone selector, overflow (⋯)
- [ ] Overflow menu contains: Export Chat, Send Feedback, Account, Sign Out
- [ ] Overflow menu closes on Escape key
- [ ] Export Chat conditionally renders ExportPanel (not nested inside overflow)
- [ ] MessageLimitWarning "Export" button opens ExportPanel (not broken querySelector)
- [ ] Account navigates to `/app/account`
- [ ] Sign Out calls signOut()
- [ ] Canvas pane hidden, no "Show Canvas" button
- [ ] Board of Directors auto-opens right pane when boardState activates
- [ ] User can close board pane, and it stays closed during streaming
- [ ] Loading skeleton matches new layout (no tabs, simplified header)
- [ ] Feedback email matches existing `FEEDBACK_MAILTO` constant

### Non-Functional Requirements

- [ ] Overflow menu has ARIA attributes (`role="menu"`, `aria-expanded`, `aria-haspopup`)
- [ ] Click outside overflow menu closes it
- [ ] Escape key closes overflow menu
- [ ] No unused imports trigger ESLint warnings
- [ ] `npm run build` succeeds with no new errors
- [ ] Session page First Load JS reduced (verify BmadInterface subtree eliminated)
- [ ] No raw Supabase error messages exposed to users

### Quality Gates

- [ ] `npm run test:e2e` passes all 7 smoke tests
- [ ] `npm run lint` has no new errors (existing 714 pre-existing are OK)
- [ ] Manual test: create session via dashboard, verify chat-first experience
- [ ] Manual test: activate Board of Directors, verify pane auto-opens and can be dismissed
- [ ] Manual test: dismiss board pane, send another message, verify pane stays closed
- [ ] Compare `npm run build` First Load JS before/after for `/app/session/[id]`

## Dependencies & Risks

**Dependencies:**
- Migration 021 must be applied to Supabase before deploying Phase 1
- `PathwayType` enum must be updated before Phase 1
- `FEEDBACK_MAILTO` must be exported from `FeedbackButton.tsx`
- E2E test `auth-session.spec.ts` must update in the same PR

**Risks:**
- **Board pane breakage (CRITICAL, mitigated):** The `useEffect` with `userDismissedBoard` prevents both invisible board and force-reopen. Follow-up: refactor to `RightPane` discriminated union.
- **ExportPanel race condition (MEDIUM):** Overflow menu's `useClickOutside` (mousedown) and ExportPanel's backdrop (click) use different event phases. If ExportPanel renders immediately after overflow menu close, the same click could open and close it. Mitigation: conditional render means ExportPanel mounts on next frame, not same event.
- **Mobile header overflow (LOW):** 4 items in header left group is tight on <480px screens. ModeIndicator dropdown is 288px wide. Monitor but don't block.

## What We're NOT Changing

- BMad session primitives, phase tracking, session-tools (backend only)
- Board of Directors feature (still works, pane auto-opens with dismiss support)
- Mode Indicator + Tone Selector (stay in header)
- Guest `/try` experience (separate component)
- Canvas component itself (just hiding the toggle)
- BmadInterface component file (not deleted, just not rendered; add `@deprecated` comment)
- ExportPanel internals (no controlled-mode refactor needed)

## Critical Files

| File | Change |
|------|--------|
| `apps/web/supabase/migrations/021_add_quick_decision_pathway.sql` | **NEW**: Expand CHECK constraint, add `quick-decision` |
| `apps/web/lib/bmad/types.ts` | Add `QUICK_DECISION` to `PathwayType` enum |
| `apps/web/app/app/new/page.tsx` | Add `useSearchParams`, Suspense wrapper, pathway validation via `PathwayType`, unmount safety |
| `apps/web/app/app/session/[id]/page.tsx` | Remove tabs/BMad/dead code, simplify header, auto-open board with dismiss, update skeleton, fix MessageLimitWarning |
| `apps/web/app/components/session/HeaderOverflowMenu.tsx` | **NEW**: overflow menu with Escape key, ARIA, consistent tokens |
| `apps/web/app/components/feedback/FeedbackButton.tsx` | Export `FEEDBACK_MAILTO` constant |
| `apps/web/app/components/workspace/useSharedInput.ts` | **DELETE**: zero consumers after page.tsx cleanup |
| `apps/web/tests/e2e/smoke/auth-session.spec.ts` | Remove tab click, use chat textarea as hydration signal |
| `apps/web/tests/helpers/selectors.ts` | Remove `chatTab`/`bmadTab`, add `overflowMenu` |

## Follow-Up Tech Debt

| Item | Priority | Rationale |
|------|----------|-----------|
| Refactor `isCanvasOpen` + `boardState` to `RightPane` discriminated union | P2 | Eliminates implicit state machine and useEffect sync |
| Extract `ChatMessageList`, `WelcomePrompt`, `SessionHeader` subcomponents | P2 | Session page is still 500+ lines after this PR |
| Add ARIA to ModeIndicator (`listbox`) and ToneSelector (`listbox`) | P3 | Inconsistent with HeaderOverflowMenu's ARIA |
| Extend security headers to `/:path*` (not just `/api/*`) | P3 | X-Frame-Options missing on authenticated pages |
| Delete BmadInterface.tsx and related test files | P3 | Dead code after this PR, marked `@deprecated` |

## References

- **Pattern reference:** `apps/web/app/login/page.tsx` (Suspense + useSearchParams)
- **Dropdown pattern:** `apps/web/app/components/session/ModeIndicator.tsx` (useClickOutside)
- **Dashboard overflow menu:** `apps/web/app/app/page.tsx` (MoreVertical + DropdownMenu)
- **PathwayType enum:** `apps/web/lib/bmad/types.ts:92-98`
- **DB constraint:** `apps/web/supabase/migrations/001_bmad_method_schema.sql:12`
- **Feedback constant:** `apps/web/app/components/feedback/FeedbackButton.tsx:3`
- **CSS layout:** `apps/web/app/globals.css` lines 317-327 (dual-pane-container, canvas-closed)
- **LoadingSkeleton primitives:** `apps/web/app/components/ui/LoadingSkeleton.tsx`
- **God component decomposition:** `docs/solutions/code-quality/god-component-decomposition-and-codebase-cleanup.md`
- **React State Init Guard:** `docs/solutions/patterns/individual/pattern-25-react-state-initialization-guard.md`
- **Next.js useSearchParams docs:** https://nextjs.org/docs/app/api-reference/functions/use-search-params
- **WAI-ARIA Menu Pattern:** https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
