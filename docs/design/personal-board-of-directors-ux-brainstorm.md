# Thinkhaven: Personal Board of Directors UX Brainstorm

## Context

Thinkhaven is a decision architecture platform (thinkhaven.co) currently built around a single AI persona "Mary" with 4 tonal sub-modes (Inquisitive, Devil's Advocate, Encouraging, Realistic). The interaction model is a single chat thread with a canvas pane.

**The problem:** Mary's sub-persona modes are tonal variations of one analyst. What users actually need is a **Personal Board of Directors** — multiple distinct counterparts with different worldviews, incentive structures, and biases, all engaging with the user's idea from fundamentally different angles.

**Why now:** The building blocks already exist in Kevin's vault (Allie Miller's AI Boardroom, Nate Jones' Career Board governance, BMAD party-mode) and in Thinkhaven's codebase (sub-persona system, tool-based mode switching, agentic loop). This is an evolution, not a rewrite.

**For whom:** Solo entrepreneurs and executives bringing product/business/project ideas for stress-testing. The experience should feel cathartic, enjoyable, and honest — not just analytical.

---

## What We're Building

### The Board of Directors

Named characters with human names + role subtitles. Each has a distinct worldview and inherent bias (the bias is the feature — 360-degree stress testing):

| Character | Role | Worldview | Bias |
|-----------|------|-----------|------|
| **Victoria** (Investor) | VC/Market lens | Market size, returns, defensibility, timing | Scalability over sustainability |
| **Casey** (Co-founder) | Personal alignment lens | Daily reality, life impact, what this means for YOU | Excitement and personal stakes |
| **Elaine** (Executive Coach) | Pattern-matching lens | Seen 50 of these before, frameworks | What usually happens |
| **Omar** (Operator/Builder) | Feasibility lens | What actually ships, resource constraints, timelines | Pragmatism over vision |
| **Taylor** (Life Coach) | **OPT-IN** Personal depth lens | Emotions, relationships, personal drivers | Inner alignment over market opportunity |

### Interaction Model: Facilitated Panel (Approach A + B Sidebar)

**Single thread, multiple named voices, facilitator through-line:**

1. **Mary remains the facilitator** — she runs the session, decides when to bring in each board member, and narrates transitions
2. **Board members speak inline** in the chat thread with visual attribution (colored avatar, name + role subtitle, left border in their color)
3. **Handoff annotations** appear between speakers as subtle divider lines with facilitator context: "Let me bring in Victoria — your market sizing needs scrutiny"
4. **Board Overview sidebar** (right pane, replacing canvas) shows all board members with their current stance, key concern, and disposition at a glance

### Pull Methodology (Rob Snyder-inspired)

Interleaved personal pull + customer pull, with adaptive emphasis:
- **User overconfident** ("this will change the world") → lean into customer pull via Victoria (Investor) and Omar (Operator): "Who's paying? Show me receipts."
- **User uncertain** → lean into personal pull via Casey (Co-founder) and optionally Taylor (Life Coach): "Do YOU want to build this? What's driving you?"
- **Facilitator reads the room** and names tensions: "Casey's excited but Victoria's skeptical. Let's reconcile that."

### Therapist/Life Coach Opt-In

Taylor (Life Coach) starts dormant. The facilitator introduces the option naturally when personal-stakes language is detected:
> "This is getting personal. Want me to bring in someone who focuses on that side of things?"

Inline Accept/Decline in the chat — not a UI toggle. If declined, Taylor never appears.

---

## Key Design Decisions

1. **Single Claude API call, not multiple agents.** The board members are prompt-engineered personas within the same system prompt. Mary decides which voice to surface. This extends the existing `switch_persona_mode` tool to `switch_speaker`.

2. **Approach A (attributed messages) + Approach B sidebar.** Board members speak inline in the conversation thread (strongest "panel" feeling, lowest implementation cost). The right pane shows a Board Overview with each member's stance (replaces canvas, which is already deprioritized).

3. **Named characters with role subtitles.** "Victoria (Investor Lens)" — human names for Wes Anderson warmth, role labels for clarity.

4. **Therapist is opt-in, not default.** Broadens the audience without forcing personal depth on users who don't want it.

5. **Pull methodology is embedded in character behavior**, not a separate feature. Each board member naturally asks their type of pull question as part of their worldview.

---

## UX Wireframe

```
+--------------------------------------------------+-------------------+
| [<- Back]  Session: "HealthTrack Analytics"      |  Board Overview   |
|--------------------------------------------------|                   |
| +-- Mary (Facilitator) -------------------------+|  M  Mary        . |
| | "Tell me about this idea. What problem        ||     Facilitating  |
| | are you actually solving?"                    ||                   |
| +-----------------------------------------------+|  V  Victoria   .. |
|                                                   |     Investor Lens |
|       +-- You --------------------------+         |     "TAM unclear" |
|       | "Hospital data teams waste 40%  |         |                   |
|       | of their time on manual QA..."  |         |  C  Casey      .. |
|       +---------------------------------+         |     Co-founder    |
|                                                   |     "Love the why"|
| -- Mary brought in Victoria (Investor Lens) --   |                   |
|                                                   |  E  Elaine     .. |
| +-- Victoria (Investor Lens) | mustard ---------+|     Coach Lens    |
| | "40% time savings is compelling. But who      ||     "Pattern: skip|
| | signs the check? Is this the data team        ||      problem      |
| | lead or the CIO? Walk me through the          ||      design"      |
| | buying motion."                               ||                   |
| +-----------------------------------------------+|  O  Omar       .. |
|                                                   |     Operator Lens |
| -- Casey (Co-founder Lens) weighs in --          |     "Need specs"  |
|                                                   |                   |
| +-- Casey (Co-founder Lens) | forest -----------+|  T  Taylor     .. |
| | "Before we get into market mechanics --       ||     Life Coach    |
| | would you still want to build this if it      ||     [Opt-in]      |
| | took 3 years? What about this problem         ||                   |
| | keeps you up at night?"                       ||                   |
| +-----------------------------------------------+|                   |
|                                                   |                   |
| [Type your response...                    ] [Send]|                   |
+--------------------------------------------------+-------------------+
```

---

## Visual Identity (Wes Anderson Palette)

| Board Member | Color | Hex | Use |
|---|---|---|---|
| Mary (Facilitator) | Terracotta | `#C4785C` | Avatar, default message styling |
| Victoria (Investor) | Mustard | `#D4A84B` | Left border, avatar |
| Casey (Co-founder) | Forest | `#4A6741` | Left border, avatar |
| Elaine (Coach) | Slate Blue | `#6B7B8C` | Left border, avatar |
| Omar (Operator) | Ink | `#4A3D2E` | Left border, avatar |
| Taylor (Life Coach) | Dusty Rose | `#C9A9A6` | Left border, avatar (when active) |

---

## Resolved Decisions

1. **Board Assembly screen:** Both — brief character lineup at session start (Wes Anderson title cards: name, role, one-liner), then Mary reintroduces each board member naturally when they first speak. The opening is quick (3 seconds of visual context), not a setup wall.

2. **User-directed invocation:** Earn the right. Mary controls the flow for the first ~10 exchanges, building trust in the process. Then she offers users the ability to invoke board members directly ("You can now ask any board member directly — just say their name"). Progressive disclosure of control.

## Open Questions (Remaining)

1. **Roundtable debate (post-MVP):** Should board members respond to each other's perspectives? e.g., Victoria challenges Casey's optimism? This is the Allie Miller boardroom pattern — aspirational but adds complexity.

2. **Session artifacts:** Does the Board Overview sidebar also show a running "decision log" of key insights? Or is that a separate output?

3. **Existing Mary sessions:** Do current sessions keep working as-is, or do all sessions get the board treatment?

---

## Implementation Approach (High-Level)

This is a brainstorm document, not an implementation plan. But the key architectural insight: **this evolves the existing sub-persona system, not replaces it.**

### Backend changes
- Extend `MaryPersona.generateSystemPrompt()` to support board member voices
- Add `BoardMemberRegistry` with name, role, voice description, bias, color per member
- Evolve `switch_persona_mode` tool → `switch_speaker` with board member options
- Add `assess_board_sentiment` tool for facilitator to read the room
- Parse `[SPEAKER:investor]` tags from Claude responses into `ChatMessage.metadata.speaker`

### Frontend changes
- Modify message rendering in session page to read `metadata.speaker` and apply per-speaker visual treatment (colored avatar, name/role label, left border)
- Add handoff annotation component (styled system message with facilitator context)
- Replace canvas pane with `BoardOverview` component showing member stances
- Add therapist opt-in inline card component
- Add board assembly welcome screen (optional, pending open question #1)

### Data layer
- Add `speaker` and `handoff_reason` to `ChatMessage.metadata` — no schema migration needed (JSON column)
- Track board member stances in `workspace_state.chat_context`

### Critical files
- `apps/web/lib/ai/mary-persona.ts` — persona logic + board member definitions
- `apps/web/app/app/session/[id]/page.tsx` — chat rendering + board overview
- `apps/web/app/api/chat/stream/route.ts` — streaming API + speaker tag parsing
- `apps/web/lib/ai/tools/index.ts` — tool definitions (switch_speaker, assess_board_sentiment)
- `apps/web/app/globals.css` — per-board-member color tokens + handoff styles

---

## Why Me, Why Now, For Whom, Is There Pull?

These are the questions Kevin asked Thinkhaven to answer about itself:

**Why Kevin:** You've already built the sub-persona system, the anti-sycophancy framework, and the kill decision logic. You have the Allie Miller boardroom and Nate Jones career board concepts in your vault. You're a product leader who's been on the receiving end of VC pitches, co-founder conversations, and executive coaching. You know what these perspectives feel like from the inside.

**Why now:** The current Mary sub-persona system works but feels monolithic. The market is saturated with "chat with AI" products. Multi-voice facilitated panels don't exist as a product category. The differentiation is structural, not cosmetic.

**For whom:** People who have an idea and instinctively know they need multiple perspectives but can't afford (in time or money) to assemble a real advisory board. Solo entrepreneurs before their first investor meeting. Product leaders before their board presentation. Founders evaluating whether to pivot.

**Is there pull?** This needs validation. The hypothesis: people who've experienced real advisory boards or investor conversations will recognize the value immediately. The "hell yeah" response comes from people who've had the experience of a single advisor being wrong because of their bias — and wishing they could hear 4 perspectives simultaneously. Rob Snyder's method says find those people and let them pull you toward the product.

---

*Brainstorm captured: 2026-02-14*
*Next: Address open questions, then move to implementation planning*
