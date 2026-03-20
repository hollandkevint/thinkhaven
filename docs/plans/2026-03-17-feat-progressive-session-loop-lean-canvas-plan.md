---
title: "Progressive Session Loop with Lean Canvas"
type: feat
date: 2026-03-17
deepened: 2026-03-17
brainstorm: docs/brainstorms/2026-03-17-progressive-session-loop-brainstorm.md
---

# Progressive Session Loop with Lean Canvas

## Enhancement Summary

**Deepened on:** 2026-03-17
**Alpha audit on:** 2026-03-18
**Review agents used:** 18 total (15 deepening + 3 alpha audit: pattern-recognition-specialist, spec-flow-analyzer, dead-code-explorer)

### Key Improvements from Deepening
1. **Eliminated `offer_board` tool** -- Mary offers board via conversation + existing `switch_speaker`, saving ~150 LOC and a new SSE event type
2. **Fixed showstopper bugs** -- Supabase RPC misuse in tool handler, missing pathway CHECK constraint, missing `useTools: true` in client, `workspaceId` undefined
3. **Corrected canvas layout** to match canonical Ash Maurya Lean Canvas (Problem/UVP/Customer top row)
4. **Eliminated `lean_canvas_update` SSE event** -- canvas state piggybacks on `complete` event's `additionalData`
5. **RPC returns updated JSONB** instead of void, matching `append_chat_message` pattern
6. **Added JSONB key validation** in RPC to prevent Claude from injecting arbitrary keys
7. **Tool examples in description** for improved tool call accuracy (SDK `Tool` type has no `input_examples` field)
8. **Inject canvas state + exchange count** into system prompt for phase-aware behavior

### Showstoppers Found and Resolved
- `explore` pathway not in DB CHECK constraint (INSERT would fail)
- `explore` not in `PathwayType` enum or `PATHWAY_WEIGHTS` (TypeScript compile error)
- Supabase RPC nested inside `.update()` (returns Promise, not value)
- Client never sends `useTools: true` (agentic loop never runs)
- `workspaceId` undefined at route.ts:296 (coaching context pipeline dead, challenge loop won't function)
- `merge_lean_canvas` returns void (silent failures)

---

## Overview

Replace the pathway-selection-then-chat flow with a single-entry progressive loop: user types idea, Mary challenges it through 3 structured loops using BMAD analyst techniques, offers the Board of Directors, and a Lean Canvas fills progressively in the sidebar. Login → validated canvas in under 15 minutes.

## Problem Statement

The current app requires 3 screens (dashboard → pathway selection → session) before the user types anything. Pathway selection creates decision paralysis. Board of Directors is locked behind one specific pathway. No visual output exists. The result: users bounce before reaching the value.

## Proposed Solution

2 phases (simplified from original 5), each independently shippable:

1. **Skip pathways + Mary's challenge loop** -- "New Session" goes straight to chat, system prompt restructured, fix `workspaceId` bug + `useTools` flag
2. **Lean Canvas sidebar** -- Right panel fills progressively via tool calls, canvas state on `complete` event

Board escalation is handled via prompt engineering + existing `switch_speaker` tool (no separate phase needed). Canvas export is a separate follow-up plan.

## Technical Approach

### Phase 0: Alpha Blockers (Pre-requisite)

These must be fixed before Phase 1, as they break fundamental user flows.

**B1. `workspaceId` undefined at route.ts:296** -- Every authenticated chat request fails to build coaching context. Mary responds as generic Claude with no system prompt, no challenge loop, no persona.
- File: `apps/web/app/api/chat/stream/route.ts:296`
- Fix: Replace `workspaceId` with `user.id`

**B2. Guest signup redirects to nonexistent `/auth` route (404)** -- Zero guest-to-paid conversion. Every guest who hits the message limit and clicks "Sign up" sees a dead page.
- Files: `app/components/guest/GuestChatInterface.tsx:237`, `app/components/guest/SignupPromptModal.tsx:26`
- Fix: Change `/auth?mode=signup&from=guest` to `/signup?from=guest`

**B3. `useTools: true` never sent by client** -- Agentic loop never runs. Board of Directors `switch_speaker` tool and all document generation tools are inert.
- File: `app/app/session/[id]/useStreamingChat.ts:195-202`
- Fix: Add `useTools: true` to the fetch body

**B4. Guest message counter initializes to 5 instead of 10** -- First impression shows wrong count.
- File: `app/components/guest/GuestChatInterface.tsx:27`
- Fix: `useState(10)` or derive from `GuestSessionStore.getRemainingMessages()`

**B5. Account deletion is fake** -- `handleDeleteAccount` sets success message but never deletes data. GDPR concern.
- File: `app/app/account/page.tsx:61-81`
- Fix: Either implement real deletion or remove the UI button until implemented

**B6. Session migration never triggers after OAuth signup** -- OAuth callback redirects to `/app`, but migration logic only runs on `/try` page. Guest conversations abandoned in localStorage.
- Fix: Move `SessionMigration` check to dashboard `useEffect` or auth callback

**Design System Cleanup (can ship alongside Phase 0):**

| Issue | Scope | Fix |
|-------|-------|-----|
| 93x `border-divider` uses nonexistent token | 26 files | Add `divider: 'var(--divider)'` to tailwind.config.cjs colors |
| 3x `text-secondary` = invisible text | 2 files (CanvasContextSync, VisualSuggestionIndicator) | Replace with `text-muted-foreground` |
| 20+ dead CSS tokens/classes | globals.css + tailwind.config.cjs | Remove: session-mode-*, executive-cream, mode-badge-*, viability-*, btn-primary/secondary, chart-*, board-* CSS vars |
| 7 dead canvas components never imported | `app/components/canvas/` | Remove: TldrawCanvas, CanvasWorkspace, DualPaneLayout, EnhancedCanvasWorkspace, MermaidEditor, MermaidRenderer, CanvasContextSync |
| PathwayCard component (dead after Phase 1) | `app/components/pathway/` | Remove after pathway selection is removed |
| `/api/bmad` route references `workspaceId` extensively | `app/api/bmad/route.ts` | Audit and clean up legacy workspace references |

---

### Phase 1: Skip Pathway Selection + Mary's Challenge Loop

**Files:** `apps/web/app/app/new/page.tsx`, `apps/web/app/app/page.tsx`, `apps/web/lib/pathways.ts`, `apps/web/lib/bmad/session-primitives.ts`, `apps/web/lib/bmad/types.ts`, `apps/web/lib/ai/workspace-context.ts`, `apps/web/lib/ai/mary-persona.ts`, `apps/web/app/api/chat/stream/route.ts`

**Pre-requisite bugfix (CRITICAL):** Fix `workspaceId` undefined at route.ts:296. Replace with `user.id` (workspace_id === user_id in per-session model). Without this fix, the coaching context pipeline is dead and Mary's challenge loop system prompt won't function. This must be the first commit.

**TypeScript type additions (CRITICAL):** Add `EXPLORE = 'explore'` to `PathwayType` enum in `lib/bmad/types.ts`. Add `'explore'` to the `BmadSessionData.pathway` union in `lib/ai/workspace-context.ts`. Add `'explore'` entry to `PATHWAY_WEIGHTS` in `mary-persona.ts` (can mirror `'new-idea'` weights). Without these, TypeScript will reject `pathway: 'explore'` assignments.

Replace the PathwayCard grid with auto-session-creation. "New Session" on the dashboard creates a session with default values and redirects to the session page.

```typescript
// apps/web/app/app/new/page.tsx - simplified
export default function NewSessionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const creatingRef = useRef(false)

  const createSession = useCallback(async () => {
    if (!user || creatingRef.current) return
    creatingRef.current = true

    try {
      const { data: session, error } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: user.id,
          workspace_id: user.id,
          pathway: 'explore',
          title: 'New Session',
          current_phase: 'discovery',
          current_step: 'chat',
          status: 'active',
          message_count: 0,
          message_limit: 20,
        })
        .select('id')
        .single()

      if (error) throw error
      if (session) router.push(`/app/session/${session.id}`)
    } catch (err) {
      creatingRef.current = false // Reset only on error for retry
      console.error('Error creating session:', err)
    }
  }, [user, router])

  useEffect(() => { createSession() }, [createSession])

  return <AnimatedLoader messages={['Starting your session...']} />
}
```

### Research Insights: Session Creation

**Race condition (React Strict Mode):** `creatingRef` prevents double-creation. Reset ONLY on error, not on validation failure. The existing pattern in `new/page.tsx` already handles this correctly.

**Rate limiting:** Move session creation to an API route (`POST /api/sessions`) with the existing `withRateLimit` middleware, OR add a Postgres trigger limiting active sessions per user to 20. API route approach is recommended (also addresses todo #018 session creation duplication).

**Credit deduction:** Use `deduct_credit_transaction()` RPC per CLAUDE.md pitfall #2. The current client-side insert bypasses credit checks.

---

**Migration 024:** Add `'explore'` to pathway CHECK constraint, add `lean_canvas` column, create `merge_lean_canvas` RPC.

```sql
-- Migration 024: Lean Canvas + Explore Pathway
-- Rollback: DROP FUNCTION merge_lean_canvas; ALTER TABLE bmad_sessions DROP COLUMN lean_canvas;
--   then restore old CHECK constraint from migration 020.

-- 1. Atomic constraint update (wrapped in transaction to prevent gap)
BEGIN;
  ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;
  ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
    CHECK (pathway IN (
      'new-idea', 'business-model', 'strategic-optimization',
      'quick-decision', 'deep-analysis', 'board-of-directors', 'strategy-sprint',
      'explore'
    ));
COMMIT;

-- 2. Add lean_canvas JSONB column (NOT NULL prevents silent data loss)
ALTER TABLE bmad_sessions
  ADD COLUMN IF NOT EXISTS lean_canvas JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Atomic JSONB merge RPC with key validation
CREATE OR REPLACE FUNCTION merge_lean_canvas(p_session_id UUID, p_updates JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_keys text[] := ARRAY[
    'problem','customer_segments','unique_value_proposition',
    'solution','channels','revenue_streams',
    'cost_structure','key_metrics','unfair_advantage'
  ];
  update_key text;
  sanitized JSONB := '{}'::jsonb;
  result JSONB;
  rows_affected integer;
BEGIN
  -- Strip unknown keys, coerce values to text, enforce 500 char limit
  FOR update_key IN SELECT jsonb_object_keys(p_updates) LOOP
    IF update_key = ANY(allowed_keys) THEN
      sanitized := sanitized || jsonb_build_object(
        update_key,
        left(p_updates->>update_key, 500)
      );
    END IF;
  END LOOP;

  UPDATE bmad_sessions
  SET lean_canvas = COALESCE(lean_canvas, '{}'::jsonb) || sanitized
  WHERE id = p_session_id
    AND user_id = auth.uid()
  RETURNING lean_canvas INTO result;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RETURN NULL; -- Caller detects failure via NULL return
  END IF;

  RETURN result;
END;
$$;
```

### Research Insights: Migration Safety

- **Transaction wrapping** is critical for DROP+ADD constraint. Without it, concurrent INSERTs can write arbitrary pathway values in the gap between DROP and ADD.
- **`NOT NULL DEFAULT '{}'`** prevents any code path from nullifying the canvas. `COALESCE` in RPC is defense-in-depth.
- **RPC returns JSONB** (not void) so the tool handler can detect failures (NULL return) and the SSE event sends authoritative DB state, not optimistic client-side merge.
- **Key validation in RPC** prevents Claude from injecting arbitrary JSONB keys (`__proto__`, `constructor`, or unknown fields).
- **500 char per-box limit** prevents storage abuse while being generous for lean canvas content.

---

**Pathway registration:** Add `'explore'` to `PATHWAYS` in `pathways.ts` and `PHASE_ORDER` in `session-primitives.ts`.

**Welcome message:** Replace the current 4-button welcome prompt with: "What idea or decision are you working on?" Single focused question. One text input, no suggestion grid.

**`useTools: true` fix (CRITICAL):** The client in `useStreamingChat.ts` line 198 does NOT send `useTools: true` in the fetch body. Without this, the agentic loop in `route.ts` never runs and no tools execute. Fix: always send `useTools: true` for authenticated sessions.

```typescript
// useStreamingChat.ts - in streamClaudeResponse
body: JSON.stringify({
  message,
  sessionId: current.id,
  conversationHistory: current.chat_context?.slice(-10) || [],
  useTools: true, // CRITICAL: enables agentic loop
}),
```

---

**Mary's Challenge Loop (System Prompt):**

**File:** `apps/web/lib/ai/mary-persona.ts`

Restructure Mary's system prompt using **dynamic phase injection** based on `exchangeCount`. Only include the current phase's instructions (not all phases at once).

```typescript
// In generateSystemPrompt(), add dynamic challenge loop section
private generateChallengeLoopSection(exchangeCount: number, canvasState: LeanCanvas): string {
  const emptyBoxes = LEAN_CANVAS_FIELDS.filter(f => !canvasState[f])

  if (exchangeCount === 0) {
    return `CURRENT PHASE: ELICIT
Use First Principles Thinking. Ask exactly ONE question about the fundamental problem this solves and who feels the pain most acutely.
Do NOT ask multiple questions. Do NOT call any tools yet.`
  }
  if (exchangeCount === 1) {
    return `CURRENT PHASE: CHALLENGE
Use Assumption Reversal. Identify the user's riskiest assumption and challenge it.
After your response, you MUST call update_lean_canvas with {problem, customer_segments}.
Ask exactly ONE follow-up question.`
  }
  if (exchangeCount === 2) {
    return `CURRENT PHASE: SYNTHESIZE
Summarize what you've heard in 2-3 sentences.
You MUST call update_lean_canvas with {solution, unique_value_proposition}.
Then suggest bringing in the Board of Directors for investor, co-founder, and operator perspectives.`
  }
  // exchangeCount >= 3: deep exploration
  return `CURRENT PHASE: DEEP EXPLORATION
${emptyBoxes.length > 0 ? `Empty canvas boxes: ${emptyBoxes.join(', ')}. Focus on filling these.` : 'All boxes filled. Refine the weakest one.'}
Update the lean canvas when new evidence emerges. Ask ONE question per turn.
Use Provocation Technique on the weakest canvas area.`
}
```

### Research Insights: Prompt Engineering

- **Dynamic phase injection** (only current phase instructions) outperforms giving Claude all phases at once. Keeps system prompt lean.
- **"MUST" + specific tool name** is the strongest prompt-only lever for tool call reliability.
- **Inject canvas state** (filled/empty boxes) into the system prompt so Mary can reason about what to fill next.
- **Tool examples in description string** (not `input_examples` field, which doesn't exist on SDK `Tool` type). Embed examples in the `description` text for Claude to learn from.
- **Board escalation via prompt** (not tool): At exchange 3+, Mary's prompt tells her to suggest the board. User responds "yes" → Mary calls `switch_speaker`. No `offer_board` tool needed.

**Board prompt addition in `board-members.ts`:**

Add to `generateBoardSystemPrompt` facilitation rules:
```
After synthesizing a board member's perspective, update the lean canvas using update_lean_canvas.
Map investor concerns to Revenue Streams/Cost Structure, co-founder perspectives to Problem/Solution,
operator feedback to Key Metrics/Channels.
```

### Phase 2: Lean Canvas Sidebar

**New files:**
- `apps/web/app/components/canvas/LeanCanvas.tsx` - 9-box canvas component
- `apps/web/lib/ai/tools/lean-canvas-tool.ts` - tool handler + validation
- `apps/web/lib/canvas/lean-canvas-schema.ts` - shared schema constant (single source of truth)

**Modified files:**
- `apps/web/lib/ai/tools/index.ts` - Add to `TOOL_NAMES`, `MARY_TOOLS`, input/result types
- `apps/web/lib/ai/tool-executor.ts` - Add `case` branch for `update_lean_canvas`
- `apps/web/app/app/session/[id]/useStreamingChat.ts` - Add `lean_canvas: LeanCanvas | null` to `SessionData`, read canvas from `complete` event's `additionalData.leanCanvas`, send `useTools: true`
- `apps/web/app/app/session/[id]/page.tsx` - Right panel shows LeanCanvas, auto-open logic with `canvasAutoOpenedRef`, add `lean_canvas` to session `.select()`
- `apps/web/app/api/chat/stream/route.ts` - After agentic loop, if `update_lean_canvas` tool ran, attach result to `complete` event's `additionalData`
- `apps/web/lib/ai/tools/session-tools.ts` - Add `lean_canvas` to `read_session_state` response, use `??` (not `||`) for `board_state` nullish coalescing
- `apps/web/lib/ai/context-builder.ts` - Add canvas state to dynamic context injection

**Shared schema (single source of truth):**

```typescript
// lib/canvas/lean-canvas-schema.ts
export const LEAN_CANVAS_FIELDS = [
  'problem', 'customer_segments', 'unique_value_proposition',
  'solution', 'channels', 'revenue_streams',
  'cost_structure', 'key_metrics', 'unfair_advantage',
] as const

export type LeanCanvasField = typeof LEAN_CANVAS_FIELDS[number]

export interface LeanCanvas {
  problem?: string
  customer_segments?: string
  unique_value_proposition?: string
  solution?: string
  channels?: string
  revenue_streams?: string
  cost_structure?: string
  key_metrics?: string
  unfair_advantage?: string
}

export function isNonEmptyCanvas(canvas: LeanCanvas | null | undefined): canvas is LeanCanvas {
  if (!canvas) return false
  return Object.values(canvas).some(v => typeof v === 'string' && v.trim().length > 0)
}

export function getFilledBoxes(canvas: LeanCanvas): LeanCanvasField[] {
  return LEAN_CANVAS_FIELDS.filter(f => {
    const val = canvas[f]
    return val != null && val.trim().length > 0
  })
}

export function getEmptyBoxes(canvas: LeanCanvas): LeanCanvasField[] {
  return LEAN_CANVAS_FIELDS.filter(f => {
    const val = canvas[f]
    return val == null || val.trim().length === 0
  })
}
```

**Tool definition (examples embedded in description, since SDK `Tool` type has no `input_examples` field):**

```typescript
// In tools/index.ts - add to TOOL_NAMES
export const TOOL_NAMES = {
  // ... existing
  UPDATE_LEAN_CANVAS: 'update_lean_canvas',
} as const

// Add to MARY_TOOLS array
{
  name: TOOL_NAMES.UPDATE_LEAN_CANVAS,
  description: `Update one or more boxes on the Lean Canvas in a SINGLE call. Batch all updates into one call. Only update boxes where you have NEW evidence from the conversation. Each value should be 1-3 sentences, max 500 characters.

Examples:
- After discussing the problem: {"updates": {"problem": "SMBs waste 10+ hrs/week on manual invoicing", "customer_segments": "Small business owners with 1-10 employees"}}
- After discussing the solution: {"updates": {"solution": "AI-powered invoice generation from email threads", "unique_value_proposition": "Zero data entry invoicing"}}`,
  input_schema: {
    type: 'object',
    properties: {
      updates: {
        type: 'object',
        description: 'Key-value pairs where key is the canvas box name and value is the content',
        additionalProperties: false,
        properties: {
          problem: { type: 'string', description: 'Top 1-3 problems the business solves' },
          customer_segments: { type: 'string', description: 'Target customers who feel the problem most acutely' },
          unique_value_proposition: { type: 'string', description: 'Single clear message that states why you are different and worth buying' },
          solution: { type: 'string', description: 'Top 3 features or capabilities' },
          channels: { type: 'string', description: 'Path to customers (inbound, outbound, viral, etc.)' },
          revenue_streams: { type: 'string', description: 'Revenue model and pricing' },
          cost_structure: { type: 'string', description: 'Customer acquisition costs, distribution costs, hosting, people' },
          key_metrics: { type: 'string', description: 'Key activities you measure (acquisition, activation, retention, revenue, referral)' },
          unfair_advantage: { type: 'string', description: 'Something that cannot be easily copied or bought' },
        },
      },
    },
    required: ['updates'],
  },
}
```

**Tool handler (in new `lean-canvas-tool.ts`):**

```typescript
// lib/ai/tools/lean-canvas-tool.ts
import { createClient } from '@/lib/supabase/server'
import { LEAN_CANVAS_FIELDS, type LeanCanvas, type LeanCanvasField } from '@/lib/canvas/lean-canvas-schema'
import type { ToolResult } from './index'

export interface UpdateLeanCanvasInput {
  updates: Partial<LeanCanvas>
}

export interface UpdateLeanCanvasResult extends ToolResult {
  data?: {
    updated_boxes: string[]
    current_canvas: LeanCanvas
    empty_boxes: string[]
  }
}

function validateLeanCanvasUpdates(raw: Record<string, unknown>): Partial<LeanCanvas> {
  const validated: Partial<LeanCanvas> = {}
  for (const key of LEAN_CANVAS_FIELDS) {
    if (key in raw && typeof raw[key] === 'string') {
      validated[key] = (raw[key] as string).slice(0, 500)
    }
  }
  return validated
}

export async function updateLeanCanvas(
  sessionId: string,
  input: UpdateLeanCanvasInput
): Promise<UpdateLeanCanvasResult> {
  try {
    const validated = validateLeanCanvasUpdates(input.updates as Record<string, unknown>)

    if (Object.keys(validated).length === 0) {
      return { success: false, error: 'No valid canvas fields in updates' }
    }

    const supabase = await createClient()
    if (!supabase) return { success: false, error: 'Service unavailable' }

    const { data: updatedCanvas, error } = await supabase.rpc('merge_lean_canvas', {
      p_session_id: sessionId,
      p_updates: validated,
    })

    if (error) return { success: false, error: `Canvas update failed: ${error.message}` }
    if (!updatedCanvas) return { success: false, error: 'Session not found or access denied' }

    const canvas = updatedCanvas as LeanCanvas
    const filledBoxes = LEAN_CANVAS_FIELDS.filter(f => canvas[f])
    const emptyBoxes = LEAN_CANVAS_FIELDS.filter(f => !canvas[f])

    return {
      success: true,
      data: {
        updated_boxes: Object.keys(validated),
        current_canvas: canvas,
        empty_boxes: emptyBoxes,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Error updating lean canvas: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
```

### Research Insights: Tool Handler

- **Return full canvas state** in tool result so Claude knows which boxes are filled/empty and can plan next moves.
- **Validate and strip unknown keys** in TypeScript layer (defense-in-depth alongside RPC validation).
- **500 char truncation** enforced in both TypeScript and RPC.
- **Error pattern** matches existing handlers: try/catch, `{ success: false, error: \`Error ...\` }`.

---

**LeanCanvas component (canonical 3x3 layout):**

```
┌──────────┬──────────┬──────────┐
│ Problem  │   UVP    │ Customer │
│          │          │ Segments │
├──────────┼──────────┼──────────┤
│ Solution │ Unfair   │ Channels │
│          │ Advantage│          │
├──────────┼──────────┼──────────┤
│ Cost     │ Key      │ Revenue  │
│ Structure│ Metrics  │ Streams  │
└──────────┴──────────┴──────────┘
```

### Research Insights: Canvas UX

- **Layout reordered** to match canonical Ash Maurya Lean Canvas: Problem/UVP/Customer top row, financials bottom row. UVP is center-top ("the heart" of the canvas).
- **Progressive fill order** maps to conversation: Problem + Customers fill first (loops 1-2, top row left-to-right), Solution + UVP fill next (loop 3), financials last (board loops).
- **Display-only for MVP**: 9 `<div>` cells in CSS grid, ~40 lines of JSX. No clickable empty boxes (defer to v2). No completion percentage (visually obvious which boxes are empty).
- **Empty box styling**: dashed border (`border-dashed border-ink/20`), muted label text. Filled boxes: solid border with `border-l-2 border-terracotta` accent.
- **`React.memo`** with shallow comparison on 9 box values to prevent unnecessary re-renders.
- **Canvas auto-open**: Use `canvasAutoOpenedRef` (fires once), mirror `userDismissedBoard` pattern to respect user dismissal.

```typescript
// Auto-open pattern (in page.tsx)
const canvasAutoOpenedRef = useRef(false)

useEffect(() => {
  if (session?.lean_canvas && isNonEmptyCanvas(session.lean_canvas) && !canvasAutoOpenedRef.current) {
    canvasAutoOpenedRef.current = true
    setIsCanvasOpen(true)
  }
}, [session?.lean_canvas])
```

---

**Canvas state delivery (via `complete` event, no new SSE event type):**

Instead of adding a `lean_canvas_update` SSE event type, piggyback canvas state on the existing `complete` event's `additionalData` field. After the agentic loop, if any `update_lean_canvas` tool ran, attach the final canvas to `additionalData`:

```typescript
// In route.ts, after agentic loop completes:
const canvasToolResult = agenticResult.toolsExecuted.find(t => t.name === 'update_lean_canvas')
const additionalData: Record<string, unknown> = {}
if (canvasToolResult) {
  // Read current canvas from DB for authoritative state
  const { data: canvasRow } = await supabase
    .from('bmad_sessions')
    .select('lean_canvas')
    .eq('id', sessionId)
    .single()
  if (canvasRow?.lean_canvas) {
    additionalData.leanCanvas = canvasRow.lean_canvas
  }
}

// In encodeComplete call:
controller.enqueue(encoder.encodeComplete(undefined, limitStatus, {
  ...existingAdditionalData,
  ...additionalData,
}))
```

Client-side, read canvas from the existing `complete` handler in `useStreamingChat.ts`:

```typescript
// In the existing 'complete' handler (line 277-283)
} else if (data.type === 'complete') {
  if (data.limitStatus) setLimitStatus(data.limitStatus)
  if (data.additionalData?.boardState) setBoardState(data.additionalData.boardState as BoardState)
  // NEW: update canvas from complete event
  if (data.additionalData?.leanCanvas) {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, lean_canvas: data.additionalData.leanCanvas as LeanCanvas }
      sessionRef.current = updated
      return updated
    })
  }
  await finalizeAssistantMessage(assistantContent, assistantMessageId)
}
```

### Research Insights: Why No New SSE Event Type

- The agentic loop buffers the full response before streaming to client. Canvas updates happen during tool execution, not mid-stream. A single update on `complete` achieves the same visual result.
- Eliminates: new `StreamChunk` type, `encodeLeanCanvasUpdate()` method, mid-stream SSE handler, lost-update race condition on rapid events.
- The `complete` event's `additionalData` field already carries `boardState`. Canvas fits the same pattern.
- If real-time mid-stream canvas animation is needed later, the SSE event can be added then (YAGNI).

---

**Board escalation (via prompt, not tool):**

Mary suggests the board at exchange 3 in her text response. If the user agrees (types "yes" or similar), Mary calls `switch_speaker` to activate Victoria. The `switch_speaker` handler must defensively initialize `board_state` if it doesn't exist:

```typescript
// In switchSpeaker (session-tools.ts) - use ?? not || (empty object is falsy with ||)
const currentBoardState: BoardState = (session.board_state as BoardState)
  ?? { activeSpeaker: 'mary', taylorOptedIn: false }
```

### Research Insights: Board Activation

- **No `offer_board` tool needed.** Mary suggesting the board in conversation is simpler and more natural. Eliminates: tool definition, SSE event type, `BoardInviteCard` component, client-side handler.
- **`switch_speaker` must handle null `board_state`** (defensive initialization). Currently assumes `board_state` exists.
- **Re-offer if declined:** Add to Mary's prompt: "If the user declines the board, continue solo. Re-suggest around message 15 if 5+ canvas boxes are filled."

---

**Agent-native additions (so Mary can reason about canvas):**

1. Add `lean_canvas` to `read_session_state` response (one-line `.select()` change).
2. Add canvas state to dynamic context via `ContextBuilder.formatContextAsMarkdown`.
3. Deprecate `lean_canvas` option from `generate_document` tool's `DOCUMENT_TEMPLATES` to avoid confusion with the new progressive approach.

## Acceptance Criteria

### Functional

- [ ] "New Session" on dashboard goes directly to empty chat (no pathway selection)
- [ ] Welcome message is a single question: "What idea or decision are you working on?"
- [ ] Mary asks one sharp question per turn (no multi-question responses)
- [ ] Lean Canvas appears in right panel after first `update_lean_canvas` tool call
- [ ] Canvas uses canonical Ash Maurya layout (Problem/UVP/Customer top row)
- [ ] Mary offers the board via conversation text after 3 exchanges
- [ ] Accepting activates Board of Directors via `switch_speaker`
- [ ] Board members each use a distinct challenge technique
- [ ] Mary updates canvas after each board member speaks (via prompt instruction)
- [ ] `read_session_state` includes current canvas data
- [ ] Existing sessions from pathway selection still work (backward compatible)
- [ ] `useTools: true` sent by client for all authenticated sessions

### Non-Functional

- [ ] Login to first message: 2 clicks (dashboard → new session → type)
- [ ] First canvas box populated by loop 2-3 (under 5 minutes)
- [ ] Full canvas draft by loop 6-7 (under 15 minutes)
- [ ] `npm run build` passes
- [ ] Session page size does not increase more than 5KB
- [ ] `merge_lean_canvas` RPC validates keys and enforces 500 char limit

## Performance Optimizations

| Priority | Action | Impact |
|----------|--------|--------|
| P1 | `React.memo` + `useMemo` on LeanCanvas component | Prevents re-renders from unrelated parent state changes |
| P2 | Use `COALESCE(lean_canvas, '{}'::jsonb)` in RPC | Prevents NULL merge edge case (already in migration) |

**Deferred optimizations (implement when profiling shows need):**
- Parallelize `ToolExecutor.executeAll` with `Promise.allSettled` -- saves 100-240ms per message but changes execution semantics. Implement when tool count per round regularly exceeds 2.
- AbortController on stream -- fixes pre-existing concurrent stream race condition. Ship as separate bugfix PR to avoid mixing concerns.

## Security Checklist

- [x] `merge_lean_canvas` RPC uses `SECURITY DEFINER` + `auth.uid()` (matches `append_chat_message` pattern)
- [x] RPC validates keys against 9-field allowlist (prevents JSONB key injection)
- [x] RPC enforces 500 char per-field limit (prevents storage abuse)
- [x] `NOT NULL DEFAULT '{}'` prevents NULL canvas state
- [x] Stream route validates session ownership before agentic loop
- [ ] **TODO (follow-up):** Move session creation to API route with rate limiting
- [ ] **TODO (follow-up):** Fix CORS wildcard on stream headers (separate security PR)

## Dependencies

- Per-session data model (PR #18, merged) - `lean_canvas` column goes on `bmad_sessions`
- Agentic tool loop (existing) - `update_lean_canvas` is a new tool
- Board of Directors (existing) - `switch_speaker` tool (with defensive `board_state` init)

## Risks

- **Prompt engineering risk (MEDIUM):** Mary's behavior depends on system prompt instructions. Mitigation: dynamic phase injection, examples in tool description, test with 10+ real conversations.
- **Tool call reliability (MEDIUM):** Claude may not call `update_lean_canvas` at the right moments. Mitigation: per-field descriptions in tool schema, examples in tool description, canvas state injected into system prompt gives clear signal on what to fill.
- **Canvas box mapping (LOW):** Conversation content doesn't always map cleanly to 9 boxes. Mitigation: Mary synthesizes, some boxes may stay empty (shows gaps to explore).
- **`workspaceId` bug (RESOLVED):** Pre-existing bug at route.ts:296 breaks coaching context pipeline. Must be fixed in Phase 1 commit 1.
- **`useTools` flag gap (RESOLVED):** Client must send `useTools: true` for the agentic loop to run.

## Implementation Order

```
Phase 0: Alpha blockers + cleanup         [1 day]   ← unblocks all user flows
Phase 1: Skip pathways + challenge loop   [2 days]  ← UX improvement + prompt
Phase 2: Lean Canvas sidebar              [2 days]  ← new component + tool + migration
```

**Phase 0 commit order (PR #1: Alpha Blockers):**
1. Fix `workspaceId` → `user.id` at route.ts:296
2. Fix guest signup URL `/auth` → `/signup` in GuestChatInterface + SignupPromptModal
3. Add `useTools: true` to client fetch body in useStreamingChat
4. Fix guest message counter `useState(5)` → `useState(10)`
5. Move session migration check to dashboard or auth callback
6. Remove fake account deletion button (or implement real deletion)
7. Add `divider` to tailwind.config.cjs colors (fixes 93 `border-divider` references)
8. Remove dead canvas components (7 files) and dead CSS tokens (~20 definitions)

**Phase 1 commit order (PR #2: Skip Pathways + Challenge Loop):**
1. [x] Add `'explore'` to `PathwayType` enum, `PATHWAY_WEIGHTS`, `PHASE_ORDER`, `PATHWAYS`, DB CHECK
2. [x] Rewrite `new/page.tsx` to auto-create session
3. [x] Restructure Mary's system prompt with challenge loop
4. [x] Remove PathwayCard component (now dead)

**Phase 2 (PR #3: Lean Canvas Sidebar):**
Migration + tool + component + canvas on `complete` event.

Phase 0 and Phase 1 can potentially ship as one PR if the diff is manageable. Phase 2 is independent.

## Complete File Manifest

### Phase 1 (PR #1: Skip Pathways + Challenge Loop)

| File | Change |
|------|--------|
| `app/api/chat/stream/route.ts` | **Fix `workspaceId` → `user.id` at line 296**, add `useTools` default |
| `app/app/new/page.tsx` | Skip pathway selection, auto-create with `'explore'` |
| `lib/bmad/types.ts` | Add `EXPLORE = 'explore'` to `PathwayType` enum |
| `lib/ai/workspace-context.ts` | Add `'explore'` to `BmadSessionData.pathway` union |
| `lib/pathways.ts` | Add `'explore'` pathway definition |
| `lib/bmad/session-primitives.ts` | Add `'explore'` to `PHASE_ORDER` |
| `lib/ai/mary-persona.ts` | Add `'explore'` to `PATHWAY_WEIGHTS`, challenge loop system prompt |
| `app/app/session/[id]/useStreamingChat.ts` | Send `useTools: true` in fetch body |

### Phase 2 (PR #2: Lean Canvas Sidebar)

| File | Change |
|------|--------|
| `supabase/migrations/024_lean_canvas_and_explore.sql` | New column, CHECK constraint, RPC |
| `lib/canvas/lean-canvas-schema.ts` | New: shared schema, type guard, helpers |
| `lib/ai/tools/lean-canvas-tool.ts` | New: tool handler with validation |
| `app/components/canvas/LeanCanvas.tsx` | New: 9-box display component |
| `lib/ai/tools/index.ts` | Add `TOOL_NAMES.UPDATE_LEAN_CANVAS`, types, `MARY_TOOLS` entry |
| `lib/ai/tool-executor.ts` | Add `case` branch |
| `app/app/session/[id]/useStreamingChat.ts` | Add `lean_canvas: LeanCanvas \| null` to `SessionData`, read from `complete` event |
| `app/app/session/[id]/page.tsx` | Right panel LeanCanvas, auto-open with `canvasAutoOpenedRef`, add `lean_canvas` to `.select()` |
| `app/api/chat/stream/route.ts` | Attach canvas to `complete` event's `additionalData` |
| `lib/ai/board-members.ts` | Add canvas update instruction to board facilitation rules |
| `lib/ai/tools/session-tools.ts` | Add `lean_canvas` to `read_session_state`, use `??` for `board_state` init |
| `lib/ai/context-builder.ts` | Add canvas state to dynamic context |

## What We're NOT Building

- Visual PDF/PNG canvas export (markdown first, visual later if needed)
- Pathway selection as an "Advanced" option (removed entirely)
- Board members directly editing canvas boxes (Mary synthesizes)
- Mobile-specific canvas layout (desktop first, mobile bottom sheet is follow-up)
- Auto-titling sessions from first message (follow-up)
- `offer_board` tool or `BoardInviteCard` component (board offered via conversation)
- `lean_canvas_update` SSE event type (canvas piggybacks on `complete` event)
- `board_invite` SSE event type (not needed)
- Clickable empty canvas boxes (defer to v2)
- Canvas completion percentage counter (visually obvious)
- Direct user editing of canvas boxes (read-only for v1)
- Canvas export (separate follow-up plan)
- AbortController on stream (separate bugfix PR)
- `Promise.all` for tool execution (premature optimization, defer)

## Design System Updates Needed

The `.pen` design file (`docs/design/design_system.pen`) needs these updates once Pencil MCP is available:

**New screens to add:**
- **Screen/Chat-First Session** -- Updated session page: chat area (left), LeanCanvas sidebar (right, 3x3 grid), simplified header (back arrow, title, overflow menu)
- **Screen/Auto-Create Session** -- Loading state with AnimatedLoader, no pathway cards
- **Screen/Dashboard-Simplified** -- "New Session" button (no pathway cards), session list with canvas completion indicators

**New components to add:**
- **Component/LeanCanvas** -- 9-box grid following canonical Ash Maurya layout (Problem/UVP/Customer top row). Dashed borders for empty boxes, solid + terracotta accent for filled boxes.
- **Component/LeanCanvasBox** -- Individual box with label, content, empty/filled states

**Screens to update:**
- **Screen/Dashboard** -- Remove pathway card grid, add single "New Session" button
- **Screen/Chat Interface** -- Add LeanCanvas in right panel, remove BMad tab references

**Components to remove (dead):**
- PathwayCard (pathway selection removed)
- Any canvas-era components (TldrawCanvas, CanvasWorkspace, etc.)

**Token audit:**
- Remove unused tokens: session-mode-*, executive-cream, mode-badge-*, viability-*, chart-*
- Add missing token: `divider` color for borders

## References

- **Brainstorm:** `docs/brainstorms/2026-03-17-progressive-session-loop-brainstorm.md`
- **BMAD analyst agent:** `.bmad-core/agents/analyst.md` (Mary's original persona)
- **BMAD brainstorming techniques:** `.bmad-core/data/brainstorming-techniques.md`
- **Existing tools:** `apps/web/lib/ai/tools/session-tools.ts` (switch_speaker)
- **Agentic loop:** `apps/web/app/api/chat/stream/route.ts` (tool execution)
- **Per-session data model:** PR #18 (merged), migration 022-023
- **Board members:** `apps/web/lib/ai/board-members.ts`
- **Board of Directors architecture:** `docs/solutions/architecture-patterns/personal-board-of-directors-multi-perspective-ai.md`
- **Security review patterns:** `docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md`
- **Ash Maurya Lean Canvas layout:** https://blog.leanstack.com/what-is-the-right-fill-order-for-a-lean-canvas/
- **Anthropic tool use best practices:** https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
- **Anthropic `input_examples`:** https://www.anthropic.com/engineering/advanced-tool-use
- **Anthropic context engineering:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
