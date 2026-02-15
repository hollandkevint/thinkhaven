---
title: "Personal Board of Directors — Multi-Perspective AI via Tool-Call Speaker Switching"
date: 2026-02-15
category: architecture-patterns
tags:
  - board-of-directors
  - multi-perspective
  - speaker-attribution
  - ai-streaming
  - tool-calling
  - prompt-engineering
  - ui-components
severity: n/a
component: "AI Integration + UI Components"
status: merged-to-main
pr: https://github.com/hollandkevint/thinkhaven/pull/5
related:
  - docs/design/personal-board-of-directors-ux-brainstorm.md
  - docs/plans/2026-02-14-feat-personal-board-of-directors-plan.md
  - docs/prd/8-strategic-direction.md
  - docs/stories/epic-6-sub-persona-mvp/epic-6-overview.md
---

# Personal Board of Directors — Multi-Perspective AI via Tool-Call Speaker Switching

## Problem

ThinkHaven's sub-persona system (Inquisitive, Devil's Advocate, Encouraging, Realistic) shifted Mary's coaching **tone** but couldn't provide structurally different **perspectives**. All advice came from one analyst with four delivery styles. Users needed an investor who asks about TAM, a co-founder who asks "do YOU want this?", an operator who asks "what ships this quarter?" — fundamentally different worldviews, not tonal adjustments.

The old modes had no identity, no persistent stance, and no interaction with each other.

## Solution

Six named board members prompt-engineered within a single Claude API call. Mary remains the facilitator and controls who speaks via a `switch_speaker` tool call. Speaker attribution flows through streaming metadata to the UI, which renders color-coded messages with avatars and handoff annotations.

### Board Members

| Character | Role | Color | Opt-in |
|-----------|------|-------|--------|
| Mary | Facilitator | Terracotta `#C4785C` | Default |
| Victoria | Investor Lens | Mustard `#D4A84B` | Default |
| Casey | Co-founder Lens | Forest `#4A6741` | Default |
| Elaine | Coach Lens | Slate Blue `#6B7B8C` | Default |
| Omar | Operator Lens | Ink `#4A3D2E` | Default |
| Taylor | Life Coach | Dusty Rose `#C9A9A6` | Opt-in |

### Architecture

```
System Prompt (board member definitions + facilitation rules)
    │
    ▼ Claude API (single call)
    │
    ├── switch_speaker tool call → updates currentSpeaker state
    │
    ▼ Agentic Loop (route.ts)
    │
    ├── SpeakerSegment[] tracked per tool round
    │
    ▼ SSE Stream
    │
    ├── content chunks carry metadata.speaker
    ├── speaker_change events carry handoffReason
    │
    ▼ Frontend
    │
    ├── SpeakerMessage: colored border, avatar, name+role
    ├── HandoffAnnotation: "Mary brought in Victoria — ..."
    └── BoardOverview sidebar: active speaker indicator
```

### End-to-End Flow

1. Mary decides who should speak based on conversation context
2. Mary calls `switch_speaker({ speaker_key: "victoria", handoff_reason: "your unit economics need scrutiny" })`
3. Tool executor updates `board_state.activeSpeaker` in the database
4. Agentic loop sets `currentSpeaker = "victoria"` for subsequent text
5. Next text chunk from Claude gets `metadata.speaker = "victoria"`
6. Stream encoder emits `speaker_change` event, then content with speaker attribution
7. Frontend renders Victoria's message with mustard border and avatar
8. Handoff annotation shows Mary's reason for bringing Victoria in

### Key Code Patterns

**Board member registry** (`lib/ai/board-members.ts`):
```typescript
export const BOARD_MEMBERS: readonly BoardMember[] = [
  { id: 'mary', name: 'Mary', role: 'Facilitator', color: '#C4785C', isOptIn: false, ... },
  { id: 'victoria', name: 'Victoria', role: 'Investor Lens', color: '#D4A84B', isOptIn: false, ... },
  // ... casey, elaine, omar, taylor
];

export function resolveSpeakerKey(key: string): BoardMember {
  return BOARD_MEMBERS.find(m => m.id === key) ?? BOARD_MEMBERS[0]; // fallback to Mary
}
```

**Tool definition** (`lib/ai/tools/index.ts`):
```typescript
{
  name: 'switch_speaker',
  input_schema: {
    properties: {
      speaker_key: { type: 'string', enum: ['mary','victoria','casey','elaine','omar','taylor'] },
      handoff_reason: { type: 'string' },
    },
    required: ['speaker_key', 'handoff_reason'],
  },
}
```

**Speaker tracking in agentic loop** (`app/api/chat/stream/route.ts`):
```typescript
let currentSpeaker: BoardMemberId = 'mary';
const segments: SpeakerSegment[] = [];

// After each tool round:
if (result.toolName === 'switch_speaker' && result.result.success) {
  currentSpeaker = result.result.data.newSpeaker as BoardMemberId;
}
segments.push({ speaker: currentSpeaker, content: response.textContent, handoffReason });
```

**Streaming with speaker metadata** (`lib/ai/streaming.ts`):
```typescript
encodeContent(content: string, speaker?: BoardMemberId): Uint8Array { ... }
encodeSpeakerChange(speaker: BoardMemberId, handoffReason: string): Uint8Array { ... }
```

## What Was Eliminated

The original plan included a `[SPEAKER:xxx]` in-band tag protocol requiring a state machine parser. Five parallel review agents (TypeScript, Architecture, Security, Simplicity, Frontend Races) recommended dropping it in favor of the tool-call approach. This eliminated:

- `speaker-tag-parser.ts` — entire state machine for buffering partial tags across SSE chunks
- Phase 2 test matrix — malformed tags, partial tags, unknown keys, rapid switching edge cases
- Speaker tag injection risk — users couldn't embed `[SPEAKER:victoria]` in messages to hijack attribution
- ~40% of planned scope — `assess_board_sentiment` tool, `offer_taylor_optin` tool, `sessionVersion` flag, disposition indicators, `BoardAssemblyWelcome` component

## Key Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Speaker control | `switch_speaker` tool call | In-band `[SPEAKER:xxx]` tags | Structured, validated, no parsing fragility |
| API architecture | Single Claude call, prompt-engineered | Multi-agent (separate calls per persona) | No orchestration complexity, no latency multiplication |
| Board activation | `boardState` presence | `sessionVersion` flag | Simpler — no versioning overhead |
| Taylor | Opt-in per session | Always present | Personal/emotional content is opt-in |
| Sidebar | BoardOverview replaces canvas | Canvas + overlay | Canvas deprioritized post-MVP |

## Prevention & Best Practices

### Patterns Worth Repeating

1. **Plan-then-review with specialists** — 5 parallel review agents caught scope bloat and the tag parsing fragility *before* any code was written. Saved weeks of rework.

2. **Tool calls over text parsing for state changes** — Any time the AI needs to change system state (switch speaker, complete phase, generate document), use a tool call. Tool calls are deterministic, validated at call time, and auditable. Reserve text parsing for non-state-changing suggestions.

3. **Security prerequisites before new surface area** — Fixed IDOR, XSS, and stale closure bugs *before* adding board member routing. New features shouldn't ship on top of known vulnerabilities.

4. **Type your enums exhaustively** — `BoardMemberId = 'mary' | 'victoria' | 'casey' | 'elaine' | 'omar' | 'taylor'` catches typos at compile time. Never use `string` for a fixed set.

5. **Aggressive scope cutting** — Ask "does this make the primary use case work?" For the board, the primary use case is "user talks to multiple advisors in one session." Disposition indicators, sentiment assessment, and welcome cards don't serve that. Cut them.

### Anti-Patterns to Avoid

1. **Parsing AI output for structured data** — Regex extraction from Claude's text output is fragile. Tags get malformed, hallucinated, or split across stream chunks. Use tool calls instead.

2. **Global system prompt for all modes** — One prompt trying to handle Mary + Victoria + Casey = prompt bloat and voice interference. Use per-speaker prompt sections injected dynamically.

3. **Storing system state in conversation history** — `boardState` is system state, not user-facing. Keep it separate from `conversationHistory` to prevent leakage and sync issues.

## Testing Recommendations

**High priority (not yet implemented):**
- `switch_speaker` rejects invalid board member IDs and falls back to Mary
- Speaker attribution persists correctly across multiple tool rounds in agentic loop
- `speaker_change` SSE events emit before content from the new speaker
- Board state doesn't leak into conversation export
- System prompt stays under 3K tokens with all 5 active members

**Medium priority (Phase 6):**
- E2E: full board session flow (Mary facilitates -> Victoria introduced -> user responds -> Casey weighs in)
- Mobile responsive: sidebar collapses, speaker attribution simplifies at narrow widths
- Accessibility: ARIA labels on speaker messages, screen reader announces speaker changes

## Files Changed

| File | Change |
|------|--------|
| `lib/ai/board-types.ts` | New — shared types (BoardMemberId, BoardMember, ChatMessage) |
| `lib/ai/board-members.ts` | New — registry, system prompt generator |
| `lib/ai/tools/index.ts` | Added switch_speaker to MARY_TOOLS |
| `lib/ai/tool-executor.ts` | Added routing for switch_speaker |
| `lib/ai/tools/session-tools.ts` | Added switchSpeaker handler |
| `lib/ai/streaming.ts` | Added speaker metadata to StreamChunk |
| `lib/ai/mary-persona.ts` | Added board prompt integration |
| `app/api/chat/stream/route.ts` | SpeakerSegment tracking in agentic loop |
| `app/app/session/[id]/page.tsx` | Speaker-attributed rendering, dual-pane board sidebar |
| `app/components/board/SpeakerMessage.tsx` | New — per-speaker message rendering |
| `app/components/board/HandoffAnnotation.tsx` | New — facilitator handoff text |
| `app/components/board/BoardOverview.tsx` | New — right-pane sidebar |
| `app/components/board/BoardMemberCard.tsx` | New — compact member card |
| `app/globals.css` | Board member color tokens |
| `app/components/canvas/MermaidRenderer.tsx` | Security fix (securityLevel: strict) |

**Total: 16 files, +986/-153 lines**
