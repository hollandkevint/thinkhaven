---
title: "feat: Personal Board of Directors"
type: feat
date: 2026-02-14
source: docs/design/personal-board-of-directors-ux-brainstorm.md
---

# Personal Board of Directors

## Overview

Evolve Thinkhaven's existing 4-mode sub-persona system into a **facilitated panel of named board members**, each with distinct worldviews, biases, and speaking styles. Mary remains the facilitator. Board members speak inline in the chat with visual attribution. A Board Overview sidebar replaces the deprioritized canvas pane.

This is an evolution — not a rewrite. The architectural primitives exist: `switch_persona_mode`, sub-persona state tracking, streaming metadata, dual-pane layout.

## Problem Statement

Mary's sub-persona modes (Inquisitive, Devil's Advocate, Encouraging, Realistic) are **tonal variations of one analyst**. A user getting "Devil's Advocate mode" is still talking to the same entity with the same worldview.

What users need: fundamentally different perspectives. An investor who reflexively asks about TAM. A co-founder who asks "do YOU want this?" An operator who asks "what ships this quarter?" These are structurally different viewpoints, not tonal adjustments.

The current system can't express this because modes have no identity, no persistent stance, and no interaction with each other.

## Proposed Solution

### Board Members

| Character | Role | Worldview | Bias | Color (Hex) |
|-----------|------|-----------|------|-------------|
| **Mary** | Facilitator | Session orchestration | Balanced facilitation | Terracotta `#C4785C` |
| **Victoria** | Investor Lens | Market size, returns, defensibility, timing | Scalability over sustainability | Mustard `#D4A84B` |
| **Casey** | Co-founder Lens | Daily reality, life impact, personal alignment | Excitement and personal stakes | Forest `#4A6741` |
| **Elaine** | Coach Lens | Pattern recognition, seen 50 of these before | What usually happens | Slate Blue `#6B7B8C` |
| **Omar** | Operator Lens | What ships, resource constraints, timelines | Pragmatism over vision | Ink `#4A3D2E` |
| **Taylor** | Life Coach *(opt-in)* | Emotions, relationships, personal drivers | Inner alignment over market | Dusty Rose `#C9A9A6` |

### Interaction Model

1. **Mary facilitates** — controls flow, names tensions between members, decides who speaks
2. **Board members speak inline** with colored avatar, name + role subtitle, left border
3. **Handoff annotations** between speakers: subtle divider with facilitator context
4. **Board Overview sidebar** (right pane) shows each member's current stance, concern, and disposition
5. **Progressive disclosure**: Mary controls flow for first ~10 exchanges, then offers user the ability to invoke members directly

### Key Architectural Decisions

1. **Single Claude API call** — board members are prompt-engineered within the system prompt. Mary decides which voice to surface via `switch_speaker` tool. No multi-agent orchestration.
2. **Speaker tag protocol** — Claude outputs `[SPEAKER:victoria]` (lowercase key) tags. Frontend parses during streaming.
3. **Backward compatibility** — existing sessions continue with old sub-persona behavior. New sessions get the board. Both code paths coexist via a `sessionVersion` flag.
4. **Taylor is opt-in** — facilitator surfaces the option when emotional content is detected. Per-session opt-in. User can opt out.
5. **Canvas replacement** — Board Overview sidebar replaces canvas pane. Canvas code stays but is hidden by default.

## Technical Approach

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│ System Prompt                                            │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Mary Facilitator │  │ BoardMemberRegistry           │  │
│  │ (existing)       │  │  - Victoria (investor)        │  │
│  │                  │  │  - Casey (co-founder)         │  │
│  │ Decides who      │  │  - Elaine (coach)             │  │
│  │ speaks via       │──│  - Omar (operator)            │  │
│  │ switch_speaker   │  │  - Taylor (opt-in life coach) │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                                                          │
│  Tools: switch_speaker, assess_board_sentiment           │
│  Tags: [SPEAKER:victoria] in Claude output               │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼ SSE Stream
┌──────────────────────────────────────────────────────────┐
│ Streaming Parser (streaming.ts)                          │
│  - State machine buffers partial [SPEAKER:xxx] tags      │
│  - Splits stream into per-speaker message blocks         │
│  - Validates speaker key against BoardMemberRegistry     │
│  - Falls back to Mary for unknown/missing tags           │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────┬────────────────────────────┐
│ Chat Pane (60%)             │ Board Overview (40%)       │
│                             │                            │
│ ┌─ Mary ──────────────────┐ │  M  Mary          .        │
│ │ "Tell me about this     │ │     Facilitating           │
│ │ idea..."                │ │                            │
│ └─────────────────────────┘ │  V  Victoria      ..       │
│                             │     Investor Lens          │
│ -- Mary brought in Victoria │     "TAM unclear"          │
│                             │                            │
│ ┌─ Victoria | mustard ────┐ │  C  Casey         ..       │
│ │ "Who signs the check?   │ │     Co-founder Lens        │
│ │ Walk me through the     │ │     "Love the why"         │
│ │ buying motion."         │ │                            │
│ └─────────────────────────┘ │  O  Omar          ..       │
│                             │     Operator Lens          │
│ [Type your response...]    │     "Need specs"           │
└─────────────────────────────┴────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Foundation — Board Member Registry + System Prompt (Backend)

**Goal:** Mary can produce board-member-attributed responses using the existing streaming infrastructure.

**Tasks:**

- [x] Create `apps/web/lib/ai/board-members.ts` — `BoardMemberRegistry`
  - Type: `BoardMember { id, name, role, worldview, bias, voiceDescription, color, isOptIn }`
  - Export: `BOARD_MEMBERS: readonly BoardMember[]` with mary, victoria, casey, elaine, omar, taylor
  - Export: `getActiveBoardMembers(taylorOptedIn: boolean): readonly BoardMember[]`
  - Export: `resolveSpeakerKey(key: string): BoardMember` (validates against registry, falls back to Mary)

- [x] Extend `apps/web/lib/ai/mary-persona.ts` — `generateSystemPrompt()`
  - Board prompt injected via `generateBoardSystemPrompt()` when `boardState` present
  - Uses tool-call approach (not speaker tags) per review recommendation
  - Add facilitation rules: when to bring in each member, how to name tensions
  - Taylor opt-in conditional: only include Taylor's definition if opted in

- [x] Add `switch_speaker` tool in `apps/web/lib/ai/tools/index.ts`
  - New tool: `switch_speaker` — input: `{ speaker_key: string, handoff_reason: string }`
  - `switch_persona_mode` kept as-is (backward compat for existing sessions)
  - Cut: `assess_board_sentiment`, `offer_taylor_optin` (per review simplification)

- [x] Extend streaming metadata in `apps/web/app/api/chat/stream/route.ts`
  - Add `boardState` to `StreamChunk.metadata`: `{ activeSpeaker, taylorOptedIn }`
  - Speaker segments tracked through agentic loop
  - `speaker_change` event type for handoff annotations

- ~~Add `sessionVersion` flag~~ — Cut per review simplification. Board mode activates when boardState is present in session.

**Acceptance Criteria:**
- ~~Claude produces responses with `[SPEAKER:xxx]` tags~~ → Uses tool-call approach instead
- [x] `switch_speaker` tool works and Mary uses it to transition between members
- [ ] System prompt fits within 3,000 tokens (needs measurement)
- [x] Existing sessions continue working unchanged (no sessionVersion needed)
- [ ] `assess_board_sentiment` returns structured stance data

#### Phase 2: Streaming Parser — Speaker Tag Parsing + Message Splitting

**Goal:** The streaming pipeline correctly parses `[SPEAKER:xxx]` tags and splits responses into per-speaker message blocks.

**Tasks:**

- [ ] Create `apps/web/lib/ai/speaker-tag-parser.ts` — state machine parser
  - Buffers partial tags during SSE streaming (handles `[SPEAK` → `ER:vic` → `toria]` across chunks)
  - Emits `{ speakerKey: string, content: string }` blocks
  - Validates speaker key against `BoardMemberRegistry` — unknown keys fall back to `mary`
  - Handles malformed tags gracefully: `[SPEAKER: victoria]` (extra space), `[SPEAKER:Victoria]` (capitalized), `[SPEAKER:the_investor]` (wrong key) → normalize or fallback
  - Handles multiple speaker switches within a single streamed response
  - Strips tags from rendered content (user never sees raw tags)

- [ ] Integrate parser into `apps/web/lib/ai/streaming.ts`
  - Wrap existing `StreamEncoder` output through speaker tag parser
  - Emit new stream event type: `speaker_change` with `{ speakerKey, handoffReason }`
  - Content chunks carry `speakerKey` in metadata

- [ ] Add `speaker` and `handoff_reason` to `ChatMessage.metadata`
  - No database schema migration needed (JSON column)
  - Update TypeScript interface in `apps/web/lib/ai/types.ts` or relevant type file

- [ ] Write comprehensive tests for speaker tag parser
  - Happy path: single speaker, multiple speakers, speaker changes mid-paragraph
  - Edge cases: partial tags across chunks, missing closing bracket, empty content between tags
  - Malformed: extra spaces, wrong capitalization, unknown keys, hallucinated characters
  - Stress: rapid speaker switching (>5 switches in one response)

**Acceptance Criteria:**
- [ ] Streaming parser correctly splits multi-speaker responses into separate message blocks
- [ ] Partial tags never render as raw text to the user
- [ ] Unknown speaker keys fall back to Mary without errors
- [ ] All edge cases pass in unit tests

#### Phase 3: Chat UI — Speaker Attribution + Handoff Annotations (Frontend)

**Goal:** Messages render with per-speaker visual treatment and smooth handoff transitions.

**Tasks:**

- [ ] Modify message rendering in `apps/web/app/app/session/[id]/page.tsx`
  - Read `metadata.speaker` from each `ChatMessage`
  - Apply per-speaker visual treatment:
    - Colored left border (3px, board member's color)
    - Avatar circle with first initial + role-specific background color
    - Name + role subtitle below avatar: "Victoria (Investor Lens)"
  - If no `metadata.speaker`, render as current Mary style (backward compat)

- [ ] Create `apps/web/app/components/board/SpeakerMessage.tsx`
  - Props: `{ message: ChatMessage, boardMember: BoardMember }`
  - Renders: avatar, name label, colored border, markdown content
  - Uses existing ReactMarkdown pipeline for content

- [ ] Create `apps/web/app/components/board/HandoffAnnotation.tsx`
  - Props: `{ fromSpeaker: string, toSpeaker: string, reason: string }`
  - Renders: subtle divider line with italic facilitator text
  - Example: *"Mary brought in Victoria — your market sizing needs scrutiny"*
  - Style: muted text, thin horizontal rule, board member color accent

- [ ] Add board member color tokens to `apps/web/app/globals.css`
  - `--board-victoria: #D4A84B;` (mustard)
  - `--board-casey: #4A6741;` (forest)
  - `--board-elaine: #6B7B8C;` (slate blue)
  - `--board-omar: #4A3D2E;` (ink)
  - `--board-taylor: #C9A9A6;` (dusty rose)
  - `--board-mary: #C4785C;` (terracotta — already exists as primary accent)

- [ ] Create `apps/web/app/components/board/BoardAssemblyWelcome.tsx`
  - Wes Anderson title card sequence at session start
  - Shows each board member briefly: name, role, one-liner
  - Auto-dismisses after 3 seconds or on user click/type
  - Only renders for `sessionVersion: 2` sessions
  - Renders as inline message block (not modal), above chat input

**Acceptance Criteria:**
- [ ] Each board member's messages have distinct visual treatment matching the color palette
- [ ] Handoff annotations appear between speaker changes
- [ ] Welcome sequence renders at session start and dismisses cleanly
- [ ] Messages without speaker metadata render normally (backward compat)
- [ ] Visuals work at both desktop (60% pane width) and narrow widths

#### Phase 4: Board Overview Sidebar (Frontend)

**Goal:** Right pane shows board member status, replacing the deprioritized canvas.

**Tasks:**

- [ ] Create `apps/web/app/components/board/BoardOverview.tsx`
  - Lists all board members with: avatar, name, role, current stance (text), disposition indicator
  - Disposition indicators: supportive (green dot), cautious (yellow), opposed (red), neutral (gray)
  - Taylor row shows "[Opt-in]" badge when dormant, full status when active
  - Empty state: "Board members will share their perspectives as the conversation develops"
  - Read-only in v1 (no click interactions)

- [ ] Modify dual-pane layout in session page
  - When `sessionVersion: 2`: right pane renders `BoardOverview` instead of `EnhancedCanvasWorkspace`
  - When `sessionVersion: 1`: right pane renders canvas (existing behavior)
  - Feature flag: `NEXT_PUBLIC_ENABLE_BOARD_OVERVIEW` (defaults to true for new sessions)

- [ ] Wire sidebar updates to streaming metadata
  - On `assess_board_sentiment` tool result, update `BoardOverview` state
  - Parse sentiment from `boardState` in stream metadata
  - Use Zustand store or local state for real-time updates during streaming

- [ ] Create `apps/web/app/components/board/BoardMemberCard.tsx`
  - Compact card component for each board member in the sidebar
  - Shows: color-coded avatar, name, role subtitle, stance text, disposition dot
  - Stance text truncated with tooltip for full text

**Acceptance Criteria:**
- [ ] Board Overview renders in right pane for new sessions
- [ ] Each member shows stance and disposition that updates after they speak
- [ ] Taylor shows opt-in state correctly
- [ ] Canvas pane still works for legacy sessions
- [ ] Empty state renders cleanly before any board member has spoken

#### Phase 5: Taylor Opt-In + User Invocation (Interactive Features)

**Goal:** Taylor's opt-in flow works end-to-end. Users can invoke board members directly after progressive disclosure threshold.

**Tasks:**

- [ ] Create `apps/web/app/components/board/TaylorOptInCard.tsx`
  - Inline card rendered in chat when `offer_taylor_optin` tool is called
  - Message: "This is getting personal. Want me to bring in someone who focuses on that side of things?"
  - Accept / Decline buttons (not a toggle — inline in chat flow)
  - On accept: send metadata event to backend, Taylor appears in Board Overview, system prompt updates
  - On decline: Taylor stays dormant, card dismisses, not offered again this session

- [ ] Implement opt-in state management
  - `taylorOptedIn: boolean` in session state (workspace_state or session metadata)
  - On opt-in: add Taylor's definition to system prompt on next Claude call
  - On opt-out (future): remove Taylor from active members, update Board Overview

- [ ] Implement user invocation unlock
  - Track `exchangeCount` in session state (user+assistant pairs = 1 exchange)
  - At exchange 10: Mary offers direct invocation ("You can now ask any board member directly")
  - System message with brief explanation
  - Natural language resolution: "ask the VC" → Victoria, "what does the builder think?" → Omar
  - Mary handles early invocation attempts: "Let me understand your situation first, then I'll bring Victoria in"

- [ ] Add invocation hint to Board Overview sidebar
  - After unlock: clicking a member name shows a tooltip "Say their name to hear from them"
  - Or a subtle "Ask [Name]" label appears under each member

**Acceptance Criteria:**
- [ ] Taylor opt-in card appears contextually (not randomly)
- [ ] Accept/Decline work correctly and persist for the session
- [ ] Users can invoke board members by name after ~10 exchanges
- [ ] Mary gracefully handles premature invocation attempts
- [ ] Natural language member resolution works for common aliases

### Phase 6: Polish + Quality (Testing, Edge Cases, Mobile)

**Goal:** Production-quality implementation with edge case handling and responsive design.

**Tasks:**

- [ ] Speaker tag parser stress testing
  - Test with 100+ message sessions for tag reliability
  - Monitor for voice degradation as context window fills
  - Implement conversation history summarization if system prompt + history > 80% context window

- [ ] Error boundary for board components
  - Wrap `BoardOverview`, `SpeakerMessage`, `HandoffAnnotation` in error boundaries
  - Fallback: degrade to standard Mary chat (no board attribution) if board rendering fails

- [ ] Mobile responsive design
  - Board Overview sidebar: hidden behind hamburger/drawer toggle on mobile
  - Speaker attribution: simplified at < 768px (color border only, no avatar)
  - Handoff annotations: single-line at narrow widths

- [ ] Accessibility
  - ARIA labels on speaker messages: `aria-label="Victoria, Investor Lens, says:"`
  - Screen reader announces speaker changes
  - Color scheme distinguishable for colorblind users (verified via contrast checker)
  - Board member colors meet WCAG AA contrast against white/cream backgrounds

- [ ] E2E test: full board session
  - Start new session → board assembly welcome → Mary facilitates → Victoria introduced → user responds → Casey weighs in → Board Overview updates → user invokes Omar directly → Taylor opt-in offered → session completes

**Acceptance Criteria:**
- [ ] No raw speaker tags visible to users under any condition
- [ ] Board degrades gracefully on errors (falls back to standard chat)
- [ ] Mobile layout is functional (sidebar collapsible, messages readable)
- [ ] Screen reader experience is coherent
- [ ] E2E test passes for full board session flow

## Alternative Approaches Considered

**Multi-agent (rejected):** Running 5 separate Claude API calls per exchange. More authentic but 5x cost, complex orchestration, and latency. The brainstorm explicitly chose single-call prompt engineering.

**Mode extension (rejected):** Adding more sub-persona modes (5 instead of 4) without naming them. Loses the "board of directors" metaphor that gives the feature its identity and emotional resonance.

**Client-side persona switching (rejected):** Frontend decides which persona to render based on content analysis. Breaks the facilitator model — Mary needs to control the narrative.

## Dependencies & Prerequisites

- **Current sub-persona system (67 tests) must stay green** — Phase 1 extends it, doesn't replace
- **Canvas pane must remain functional** for `sessionVersion: 1` sessions
- **`mary-persona.ts` refactoring** recommended before Phase 1 (currently 1,477 lines) — extract board-specific logic into `board-members.ts`
- **Anthropic SDK streaming** must support the tag parsing approach — test with current SDK version before upgrading

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude doesn't reliably produce speaker tags | High | High | Robust parser with fallback to Mary. Few-shot examples in system prompt. Test at scale before shipping. |
| System prompt exceeds 3K tokens with 5 character defs | Medium | Medium | Concise character definitions. Measure during Phase 1. Trim worldview/bias descriptions if needed. |
| Voice degradation in long sessions | Medium | High | Conversation summarization. Periodic system prompt re-injection. Monitor at 50/100/150 exchanges. |
| Multiple speaker switches in one response break streaming | Medium | High | State machine parser handles N switches per response. Test in Phase 2 before Phase 3. |
| Existing sessions break on deploy | Low | Critical | `sessionVersion` flag. Both code paths coexist. Existing sessions unchanged. |
| Users confused by board members (too much at once) | Medium | Medium | Progressive disclosure. Board assembly welcome is brief. Members introduced one at a time by Mary. |

## Success Metrics

- **Speaker tag reliability:** >95% of board member responses correctly tagged (measurable via parser fallback rate)
- **Session engagement:** Average session length increases (more exchanges because users want to hear from different members)
- **Feature discovery:** >50% of sessions have at least 3 different board members speak
- **Taylor opt-in rate:** 20-40% of sessions opt in (validates the "personal depth" hypothesis)

## Future Considerations

- **Roundtable debate:** Board members respond to each other's perspectives (Allie Miller boardroom pattern). Requires multi-turn board member interaction within a single exchange.
- **Custom board composition:** Users choose which 3-5 board members to include from a larger roster.
- **Session artifacts:** Running "decision log" of key insights, exportable.
- **Board member memory:** Members remember insights from previous sessions with the same user.

## References & Research

### Internal References

- Brainstorm: `docs/design/personal-board-of-directors-ux-brainstorm.md`
- Current persona logic: `apps/web/lib/ai/mary-persona.ts`
- Streaming API: `apps/web/app/api/chat/stream/route.ts`
- Session UI: `apps/web/app/app/session/[id]/page.tsx`
- Tool definitions: `apps/web/lib/ai/tools/index.ts`
- Design system: `docs/design/design-system.md`
- PRD sub-persona section: `docs/prd/8-strategic-direction.md:94-140`
- Canvas deprecation: `CLAUDE.md` (Jan 19 update)

### Inspiration

- Allie Miller's AI Boardroom concept (multi-perspective advisory)
- Nate Jones' Career Board governance (structured decision panels)
- BMAD party-mode (multi-agent facilitated discussion)
- Rob Snyder's Pull Methodology (customer pull vs personal pull)

---

## Appendix: Deepened Plan — Review Synthesis

*Generated 2026-02-14 by 5 parallel review agents (TypeScript, Architecture, Security, Simplicity, Frontend Races)*

### ARCHITECTURAL CHANGE: Drop Speaker Tag Parser

**Consensus from Architecture + Simplicity reviews.** The `[SPEAKER:xxx]` in-band tag protocol is the highest-risk decision in the plan. It creates fragile parsing, edge cases, and a new state machine for a problem that doesn't need to exist.

**Recommended approach:** Use `switch_speaker` exclusively as a tool call. When Claude calls `switch_speaker({ speaker_key: "victoria", handoff_reason: "..." })`, the tool executor returns success and the route handler sets `activeSpeaker` in `StreamChunk.metadata`. All subsequent content chunks carry the speaker key in metadata until the next `switch_speaker` call. Frontend reads `metadata.speaker` from each chunk. If Claude fails to call the tool, content defaults to Mary.

**Impact:** Eliminates `speaker-tag-parser.ts`, the entire Phase 2 test matrix for malformed tags, and the in-band parsing edge cases. The tool-call path is already built and tested.

### SIMPLIFICATION: Cut ~40% of Planned Work

| Action | Items |
|--------|-------|
| **Cut** | `assess_board_sentiment` tool, `offer_taylor_optin` tool, `sessionVersion` flag, `BoardAssemblyWelcome` component, disposition indicators, `exchangeCount` tracking, `userInvocationEnabled` flag, progressive disclosure unlock, feature flag |
| **Simplify** | `BoardMemberRegistry` → const array, Taylor opt-in → natural language, 6 phases → 3 phases, member resolution → "let Claude do it" |
| **Defer** | Wes Anderson title card, stance/disposition in sidebar, conversation summarization |

**Revised phase structure:**
- **Phase A (Backend + Streaming):** board-members.ts, system prompt, switch_speaker tool, streaming metadata — current Phases 1+2
- **Phase B (Frontend):** SpeakerMessage, HandoffAnnotation, BoardOverview sidebar — current Phases 3+4
- **Phase C (Polish):** Taylor (natural language), accessibility, mobile, e2e tests — current Phases 5+6

### TYPE SAFETY REQUIREMENTS (TypeScript Review)

**Before Phase A begins:**

1. Create `apps/web/lib/ai/board-types.ts`:
   ```typescript
   type BoardMemberId = 'mary' | 'victoria' | 'casey' | 'elaine' | 'omar' | 'taylor';
   type Disposition = 'supportive' | 'cautious' | 'opposed' | 'neutral';
   interface BoardMember { readonly id: BoardMemberId; ... }
   ```

2. Make `mary-persona.ts` extraction **mandatory** (not recommended). Move board logic to `board-members.ts` before adding new code. File is already 1,477 lines.

3. Extract `ChatMessage` from inline page definition to a shared types file.

4. `resolveSpeakerKey` should always return `BoardMember` (fallback to Mary), never null.

5. Use `BoardMemberId` everywhere instead of `string` for speaker keys.

### SECURITY FINDINGS (3 actions before implementation)

**HIGH severity — fix before starting board work:**

1. **IDOR vulnerability** at `session/[id]/page.tsx:80` — fetches workspace using `params.id` from URL, not `user.id`. Replace `.eq('user_id', params.id)` with `.eq('user_id', user.id)`.

2. **Speaker tag injection** — user could include `[SPEAKER:victoria]` in their message, causing Claude to echo it and the parser to treat it as a real speaker switch. **Mitigation:** Strip/escape `[SPEAKER:` patterns from user input before adding to conversation history. (If using tool-call approach instead of tags, this becomes moot.)

3. **MermaidRenderer XSS** at `MermaidRenderer.tsx:23` — uses `securityLevel: 'loose'` with `dangerouslySetInnerHTML`. Change to `securityLevel: 'strict'`.

**MEDIUM severity:**
- `taylorOptedIn` and `sessionVersion` changes must route through API, not be client-settable
- CORS wildcard `Access-Control-Allow-Origin: '*'` on streaming endpoint is overly permissive
- API key prefix logged in `claude-client.ts:20` — unnecessary exposure

### FRONTEND RACE CONDITIONS (Fix before Phase B)

**Critical — stale closure in `updateStreamingMessage`:**
The streaming handler captures `workspace` from the render closure. With multi-speaker (multiple message blocks per stream), updates from speaker 2 overwrite speaker 1's content because the closure holds a stale reference. **Fix:** Use `useRef` for in-flight chat context, or pass current state as parameter.

**Critical — partial tag rendering:**
If using tag parser (not recommended), partial `[SPEAKER:` text would flash to users during streaming. **Fix:** Use tool-call approach instead.

**High — two concurrent writers to `workspace_state`:**
Client writes `chat_context`, server writes `boardState` — both target same JSON blob. Last write wins. **Fix:** Use Supabase JSON patching or separate columns.

**High — Taylor opt-in during active stream:**
If opt-in card renders mid-stream and user accepts, the next Claude call gets Taylor's definition but the current stream doesn't include Taylor. Creates a gap. **Fix:** Queue opt-in changes for next request, don't modify in-flight state.

**Medium — sidebar + chat competing for re-renders:**
Board Overview updates from streaming metadata while chat messages render simultaneously. Use `useDeferredValue` or `startTransition` for sidebar updates.

### PREREQUISITES CHECKLIST

Before starting Phase A:

- [x] Fix IDOR at `page.tsx:80`
- [x] Fix MermaidRenderer security level
- [x] Extract `board-types.ts` with `BoardMemberId`, `BoardMember`, `Disposition`
- [x] Create `board-members.ts` with board-specific logic (separate from mary-persona.ts)
- [x] Extract `ChatMessage` to shared types file
- [x] Fix stale closure pattern in `updateStreamingMessage` (use `useRef`)
- [x] Decide: tool-call approach vs tag parser (recommendation: tool-call) → tool-call chosen
- [ ] Measure current system prompt token count (baseline for 3K target — needs runtime check)
