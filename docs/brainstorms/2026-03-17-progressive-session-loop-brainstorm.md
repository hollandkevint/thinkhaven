---
topic: Progressive Session Loop with Lean Canvas
date: 2026-03-17
status: decided
participants: Kevin Holland, Claude
---

# Progressive Session Loop with Lean Canvas

## What We're Building

A simplified session experience where users type their idea immediately (no pathway selection), Mary engages in rapid back-and-forth loops, the Board of Directors escalates naturally after loop 3, and a Lean Canvas fills progressively in a sidebar as the conversation develops. The goal: login → idea → validated canvas in under 15 minutes.

## Why This Approach

The current app forces a 3-screen journey (dashboard → pathway selection → session) before the user types anything. Pathway selection creates decision paralysis ("which one do I pick?") when the user just wants to talk about their idea. The Board of Directors is locked behind a specific pathway choice instead of being a natural escalation.

Kevin's core insight: this should feel like a pressure-testing loop, not a form-filling exercise. The progression should be:

1. **Rapid dialogue** (loops 1-3): Mary and user go back and forth fast
2. **Escalation** (loop 3): Mary offers to bring in the board
3. **Multi-perspective** (loops 4-6): Board members challenge the idea
4. **Visual output**: Lean Canvas fills progressively alongside the conversation
5. **Export**: Clean lean canvas markdown when done

## Key Decisions

### 1. Single entry point, no pathway selection

**Decision:** Remove the pathway selection page. "New Session" goes directly to an empty chat with Mary. Pathways become invisible routing logic (Mary determines the right approach from the conversation, not from a menu choice).

**Rationale:** Every extra screen before the user types their idea is friction. The pathway cards are confusing for first-time users who don't know what "Deep Analysis" vs "Quick Decision" means for their situation. Mary should figure that out.

**What changes:**
- `/app/new` no longer shows PathwayCard grid
- Instead, it creates a session with a default pathway and redirects to session page
- Session page shows empty chat with a focused prompt: "What idea are you working on?"
- Mary's system prompt adapts based on conversation content, not pre-selected pathway

### 2. Progressive Board of Directors escalation

**Decision:** After 3 back-and-forth exchanges, Mary offers to bring in the board via an inline suggestion card in the chat. User clicks "Yes, bring them in" or "Not yet." No toggle in the header. No pathway-locked activation.

**Rationale:** The board is ThinkHaven's differentiator. Gating it behind a pathway choice means most users never see it. Making Mary offer it naturally at the right moment converts discovery into engagement.

**What changes:**
- Board activation is conversation-driven, not pathway-driven
- Mary's streaming response includes an inline action card after loop 3
- User clicks to activate, Mary introduces the board members
- Board members engage in subsequent loops (Victoria → Casey → Omar)

### 3. Lean Canvas fills progressively in sidebar

**Decision:** A Lean Canvas component appears in the right panel after loop 2-3 (when enough context exists). Boxes fill as the conversation covers each topic. Empty boxes serve as "what to explore next" prompts.

**Lean Canvas boxes (standard 9-box):**
- Problem
- Customer Segments
- Unique Value Proposition
- Solution
- Channels
- Revenue Streams
- Cost Structure
- Key Metrics
- Unfair Advantage

**How it fills:**
- Mary's tool calls populate specific canvas boxes as she identifies them in the conversation
- A `update_lean_canvas` tool in the agentic loop writes to a `lean_canvas` JSONB field on `bmad_sessions`
- The right panel reads from this field and renders the canvas live
- Empty boxes are clickable: clicking one sends a prompt to Mary asking about that topic

**What changes:**
- New `LeanCanvas` React component for the right panel
- New `update_lean_canvas` tool in the session tools
- New `lean_canvas` JSONB column on `bmad_sessions`
- Right panel shows LeanCanvas by default; BoardOverview appears as a collapsible section above or below the canvas when board is active

### 4. Export as lean canvas markdown

**Decision:** Export the lean canvas as structured markdown. The canvas data is JSONB with 9 named boxes, so rendering to markdown is trivial. Visual PDF/PNG export is a follow-up if users want it.

**What changes:**
- Export button on the canvas sidebar generates markdown lean canvas
- Add "Lean Canvas" as a format option in ExportPanel
- Markdown format renders each box as a `## Section` with bullet-point content

### 5. Mary's challenge loop (inspired by BMAD analyst agent)

**Decision:** Mary drives a structured pressure-testing loop before any output. She uses the BMAD analyst's core techniques: curiosity-driven inquiry, assumption reversal, first-principles thinking, and "Five Whys" drilling. She populates the canvas, challenges what she wrote, and loops back. The board members amplify this with different lenses.

**Mary's loop structure (minimum 3 before output):**

- **Loop 1 - Elicit:** User states idea. Mary uses First Principles Thinking: "What's the fundamental problem this solves? Who feels this pain most acutely?" One sharp question. Forces the user to articulate the core.

- **Loop 2 - Challenge:** User elaborates. Mary uses Assumption Reversal: "You're assuming X. What if the opposite were true?" She identifies the riskiest assumption and presses on it. Canvas begins populating (Problem, Customer Segments).

- **Loop 3 - Synthesize + Offer:** Mary synthesizes what she's heard into canvas boxes (Problem, Solution, UVP). She shows what she captured and asks: "Here's what I'm hearing. Before we go deeper, want me to bring in the board to pressure-test this from investor, co-founder, and operator angles?" Inline action card: [Yes, bring them in] / [Not yet, keep going].

- **Loops 4-6 - Board pressure-test:** Each board member applies a different technique:
  - **Victoria (investor):** "What If" scenario on market sizing and returns
  - **Casey (co-founder):** Role-playing from the customer's perspective
  - **Omar (operator):** Resource constraints: "What if you had to launch in 2 weeks with $5K?"
  - Mary synthesizes each perspective into canvas updates after each board turn.

- **Loop 7+ - Refinement:** Mary identifies the weakest canvas box (lowest confidence or empty). Uses Provocation Technique: makes a deliberately provocative claim about that gap and asks the user to push back. Canvas refines. This loop continues until the user exports or the session limit is reached.

**Key behavioral rule:** Mary never asks more than one question per turn. Each exchange is tight: one challenge, one response, one canvas update.

### 6. Simplified welcome message

**Decision:** Replace the current 4-button welcome prompt with a single focused question: "What idea or decision are you working on?" One text input. No suggestions grid. No multi-paragraph Mary introduction.

**Rationale:** The current welcome message is a wall of text. Users don't read it. A single question gets them typing immediately.

## Open Questions

1. **Mobile canvas layout?** Desktop: right sidebar. Mobile: bottom sheet with peek state showing canvas completion %, swipe up for full canvas. Needs design validation.

2. **What pathway value do auto-created sessions use?** All sessions need a `pathway` column value for the DB. Options: (a) new `general` pathway with 20-message limit, (b) `quick-decision` as default, (c) remove pathway requirement entirely. Affects message limits and dashboard display.

## Architecture Implications

### Removed
- Pathway selection page (PathwayCard grid, `/app/new` redesign)
- Pathway-locked Board of Directors activation

### New Components
- `LeanCanvas` - Right-panel component rendering 9-box canvas from JSONB. Empty boxes are clickable (onClick sends a prompt to Mary about that topic, no separate component needed).
- `BoardInviteCard` - Inline chat card Mary renders to offer the board

### New Data
- `bmad_sessions.lean_canvas` JSONB column (migration 024)
- `update_lean_canvas` tool in session-tools.ts

### Modified
- `/app/new/page.tsx` - Skip pathway selection, auto-create session
- `mary-persona.ts` - System prompt restructured around the challenge loop (elicit → challenge → synthesize → offer board). Incorporates BMAD analyst techniques: First Principles, Assumption Reversal, Five Whys, Provocation. One question per turn.
- `session-tools.ts` - Add `update_lean_canvas` tool + board invite action
- `stream/route.ts` - Support new tools in agentic loop
- Session page right panel - LeanCanvas as default; BoardOverview as collapsible section when board is active

## Success Criteria

- Login to first message: **2 clicks** (dashboard → new session → type)
- First canvas box populated: **by loop 3** (under 5 minutes)
- Board offered: **after loop 3**
- Full canvas draft: **by loop 6-7** (under 15 minutes)
- Exportable lean canvas: **available after any loop with 3+ boxes filled**
