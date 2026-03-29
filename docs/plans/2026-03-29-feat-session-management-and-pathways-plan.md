---
title: "feat: Session management — rename, pathway selection, card improvements"
type: feat
date: 2026-03-29
---

# Session Management — Rename, Pathway Selection, Card Improvements

## Enhancement Summary

**Deepened on:** 2026-03-29
**Agents used:** Architecture strategist, Code simplicity reviewer

### Scope Changes (Simplicity Review)

| Original | Revised | Rationale |
|----------|---------|-----------|
| Summary column + migration 029 | Cut | Title + pathway label is enough context at <10 users |
| Duplicate menu item | Cut | "New Session" + pick same pathway = duplicate |
| Archive menu item | Cut | Hard delete with confirm is sufficient at this scale |
| Phase badge on cards | Cut | No user requests. Defer. |
| Pathway icons | Cut | Plain text labels work fine |
| Inline edit for rename | Radix Dialog | Clickable card + inline input = event propagation swamp |

**What ships:** Rename (via dialog) + pathway selection + message count on cards. 3 files changed.

---

## Overview

Two features: (1) rename sessions from the dashboard, and (2) choose a pathway when starting a new session. Plus minor card improvements (message count) and prerequisite fixes (pathway enum mismatch, BmadSession type, `<a>` → `<Link>`).

## Problem Statement

1. **No rename** — titles are auto-generated or "New Session." Users can't rename.
2. **No pathway selection** — `/app/new` always creates "explore." Users can't choose between decision, product idea, strategy review, or open exploration.
3. **Thin card info** — cards show pathway slug and timestamp but not message count.
4. **Pathway enum mismatch** — `route.ts` PATHWAYS and `session-primitives.ts` PathwayType are out of sync.

## Implementation

### Phase 0: Prerequisite Fixes

**Fix pathway enum mismatch:**
- `session-primitives.ts` has: `'new-idea' | 'business-model' | 'business-model-problem' | 'feature-refinement' | 'strategic-optimization' | 'explore'`
- `route.ts` PATHWAYS has: `explore`, `quick-decision`, `deep-analysis`, `board-of-directors`, `strategy-sprint`
- Neither matches the new 4-pathway set. Consolidate to one source of truth.

**New canonical PathwayType:** `'decision' | 'product-idea' | 'strategy-review' | 'explore'`

Update in `session-primitives.ts`, import in `route.ts`. Old pathway values in existing sessions still work (they're stored as strings, not constrained by CHECK).

**Fix `BmadSession` local type in `page.tsx`:**
The interface (line 36-44) declares `session_data` but the query selects `title, current_phase, message_count, message_limit, status`. Fix the type to match the actual query.

**Fix `<a href="/">` → `<Link href="/">`** in `page.tsx` line 255 (pre-existing bug).

### Phase 1: Rename via Radix Dialog

Add "Rename" to the three-dot DropdownMenu. Opens a small Radix Dialog with a text input pre-filled with the current title.

**Why dialog, not inline edit:** The card is fully clickable (`onClick → navigate`). Inline edit on a clickable card requires stopping propagation on the input, handling blur vs submit, and preventing accidental navigation. The dropdown already handles propagation correctly. A dialog avoids the event swamp.

**Implementation in `app/app/page.tsx`:**
- Add `DropdownMenuItem` for "Rename" (between Open and Delete)
- Small state: `renamingSession: { id: string; title: string } | null`
- Radix `Dialog` with input field, Save/Cancel buttons
- Save: `supabase.from('bmad_sessions').update({ title }).eq('id', sessionId).eq('user_id', user?.id)` (IDOR protection)
- Optimistic update of `sessions` state
- Revert on error

```typescript
// Rename handler
const handleRenameSession = async (sessionId: string, newTitle: string) => {
  const trimmed = newTitle.trim()
  if (!trimmed) return

  // Optimistic update
  setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: trimmed } : s))

  const { error } = await supabase
    .from('bmad_sessions')
    .update({ title: trimmed })
    .eq('id', sessionId)
    .eq('user_id', user?.id)  // IDOR protection

  if (error) {
    console.error('Rename failed:', error)
    fetchSessions()  // Revert on failure
  }
}
```

### Phase 2: Pathway Selection on `/app/new`

Replace auto-create with a 4-card grid. Click a card → POST with that pathway → redirect.

**4 pathways:**

| Pathway | ID | Description |
|---------|----|-------------|
| Test an Idea | `product-idea` | Is this worth building? Validate assumptions, find blind spots. |
| Make a Decision | `decision` | Should I do X? Pressure-test options, surface tradeoffs. |
| Strategy Review | `strategy-review` | Optimize what exists. Audit, prioritize, find the next lever. |
| Open Exploration | `explore` | Think through anything. No structure, just Mary and the board. |

**`app/app/new/page.tsx`:**
- Show 4 cards in a centered grid
- Each card: pathway name + 1-line description
- `onClick`: set loading state, POST to `/api/session` with pathway ID, redirect
- Keep `AnimatedLoader` for the creating state
- Back link to `/app`

**`app/api/session/route.ts`:**
- Update `PATHWAYS` config with the 4 new IDs + message limits
- Keep `explore` as-is, add `decision` (15 msgs), `product-idea` (20 msgs), `strategy-review` (25 msgs)
- Set default title per pathway: "New Decision", "New Product Idea", "Strategy Review", "New Session"

### Phase 3: Card Improvements

**Message count in card footer:**
Already fetched in the query. One line of JSX:
```tsx
<span>{session.message_count || 0} messages</span>
```

**Better pathway display:**
Replace `session.pathway.replace(/-/g, ' ')` with a human-readable label map:
```typescript
const PATHWAY_LABELS: Record<string, string> = {
  'decision': 'Decision',
  'product-idea': 'Product Idea',
  'strategy-review': 'Strategy Review',
  'explore': 'Exploration',
  // Legacy pathways
  'quick-decision': 'Quick Decision',
  'deep-analysis': 'Deep Analysis',
  'board-of-directors': 'Board Session',
  'strategy-sprint': 'Strategy Sprint',
}
```

## Files

```
lib/session/session-primitives.ts   (modify — canonical PathwayType)
app/api/session/route.ts            (modify — PATHWAYS config, default titles)
app/app/page.tsx                    (modify — rename dialog, menu, card improvements, type fix, Link fix)
app/app/new/page.tsx                (modify — pathway selection grid)
```

**No migrations. No new columns. No new dependencies.**

## Acceptance Criteria

- [ ] Three-dot menu has: Open, Rename, Delete
- [ ] Rename opens Radix Dialog with pre-filled title input
- [ ] Rename saves via Supabase with IDOR check, optimistic update
- [ ] `/app/new` shows 4 pathway cards instead of auto-creating
- [ ] Selecting a pathway creates session with correct ID and redirects
- [ ] Session cards show message count in footer
- [ ] Pathway displayed as human-readable label (not slug)
- [ ] `BmadSession` type matches actual query columns
- [ ] `PathwayType` is single source of truth in `session-primitives.ts`
- [ ] No `<a href>` for internal navigation (use `<Link>`)

## References

- Dashboard: `app/app/page.tsx` (current card rendering, DropdownMenu)
- New session: `app/app/new/page.tsx` (auto-create flow)
- Session API: `app/api/session/route.ts` (PATHWAYS config)
- Session primitives: `lib/session/session-primitives.ts` (PathwayType)
- DropdownMenu: `components/ui/dropdown-menu.tsx` (Radix, already used)
- Dialog: `@radix-ui/react-dialog` (already installed from Sprint A)
