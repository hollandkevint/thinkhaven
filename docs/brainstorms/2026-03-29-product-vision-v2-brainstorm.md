# ThinkHaven Product Vision v2 — Brainstorm

*Date: 2026-03-29*
*Status: Draft*

## What We're Building

ThinkHaven is a **decision design system** — structured AI sessions that accelerate whether an idea is worth building or working on. Not a chatbot. Not generic GenAI. A facilitated session with a board of advisors who challenge your thinking and produce decision artifacts.

This vision doc covers 7 features grouped into 3 sprints, from quick wins through experimental capabilities.

---

## Sprint A: Quick Wins (Ship This Week)

### A1. UI Bug Fix — CTA Subtext Clipping

**Problem:** The landing page CTA subtext ("No account needed. No credit card. 5 messages to see if it's for you.") appears truncated on smaller viewports or specific breakpoints.

**File:** `app/page.tsx:78-83`

**Fix:** Check container overflow, verify the `max-w-xl` constraint on the parent, and ensure the subtext has adequate breathing room on mobile. Likely a simple padding/overflow tweak.

### A2. In-App Feedback Modal

**Problem:** Current `FeedbackButton` is a mailto link — zero data capture, no structured feedback, high friction.

**What:** Replace with an in-app modal triggered from the same locations (sidebar, header, nav). Two Likert-scale questions + free-text box.

**Questions:**
1. "How useful was this for your decision?" (1-5 scale)
2. "How likely are you to use ThinkHaven again?" (1-5 scale)
3. Free-text: "What would make ThinkHaven more valuable?"

**Delivery:** Email to kevin@kevintholland.com via API route (or Resend/SendGrid). Also store in Supabase `feedback` table for analytics.

**Existing code to reuse:**
- `FeedbackForm.tsx` (monetization) already has rating UI, would-pay toggle, and text box — adapt this
- `SignupPromptModal.tsx` has modal pattern to follow
- `FeedbackButton.tsx` just needs to open modal instead of mailto

**Trigger points:**
- Manual: sidebar button, header button, nav link (existing locations)
- Auto-prompt: after session ends or at message limit

### A3. Design System Sync (Pencil MCP)

Update the `.pen` design system file to reflect all new components and screens from Sprint A and B. Keep the design system as source of truth for future work.

---

## Sprint B: Onboarding + Board Member Presence (1-2 Weeks)

### B1. In-App Onboarding Flow

**Problem:** New users don't understand what ThinkHaven is or why it's different from ChatGPT/Claude. No onboarding exists.

**What:** A short in-app series (3-4 screens, modal or slide-over) that appears on first visit:

1. **What is ThinkHaven?** — "A decision design system. Not a chatbot. Structured sessions with AI advisors who challenge your thinking."
2. **How it works** — Mary facilitates. Board members (Victoria, Casey, Elaine, Omar, Taylor) each bring a different lens. They produce artifacts like Lean Canvases.
3. **Who it's for** — Product leaders, founders, solopreneurs evaluating ideas, pivots, or strategic decisions.
4. **What you get** — Challenged assumptions, structured artifacts, multiple expert perspectives in one session. Vs. generic AI: no yes-man responses, no context-free advice.

**Design:** Use the existing design system (cream/parchment/terracotta). Step indicators, skip button, "Get Started" CTA.

**Trigger:** First visit (localStorage flag). Also accessible from a "?" help icon in the session header.

### B2. Board Member Sideline Animations

**Problem:** Board members currently appear as static cards in the right panel. No sense of "presence" or anticipation.

**What:** Board member cards in the right panel get motion cues:
- **Idle state:** Subtle breathing animation (slight scale pulse) on the active speaker's card
- **Suggestion queued:** Card slides forward slightly (translateX), notification badge appears with a count
- **Speaker switch:** Outgoing card slides back, incoming card slides forward with a brief highlight glow matching their color
- **Dormant (Taylor):** Slightly desaturated, "Opt-in" badge. On hover, card warms up (saturation increase)

**Implementation:** CSS transitions + Framer Motion (already in the stack? Check). No new dependencies if CSS-only is sufficient.

**Key constraint:** Animations must be subtle. This is a professional tool, not a game. Think "Slack notification dot," not "Clippy."

---

## Sprint C: Experimental — Voice + Visual Canvas (2-4 Weeks)

### C1. Excalidraw Embedded Side Panel

**Problem:** The current artifact panel (Lean Canvas, exports) is text-heavy. No visual thinking tool.

**What:** Fork [excalidraw-mcp](https://github.com/excalidraw/excalidraw-mcp) and embed Excalidraw as a swappable panel in the session workspace. Not as an MCP app in Claude — as a server-side component embedded in ThinkHaven.

**Interaction model (bidirectional):**
- **AI-generated:** Mary and board members can generate visual artifacts (decision trees, flowcharts, business model maps) that render in the Excalidraw panel
- **User-editable:** User can draw, annotate, and modify diagrams. Changes are visible to the AI context
- **Shared artifact:** Like the Lean Canvas, the Excalidraw canvas becomes a persistent session artifact

**Architecture considerations:**
- Excalidraw React component embeds directly (it's a React library)
- Store canvas state as JSON in `bmad_sessions.artifacts` JSONB column
- AI generates Excalidraw-compatible JSON via tool calls (new tool: `update_canvas`)
- Side panel toggle: user can swap between Lean Canvas, Excalidraw, Board Overview, and Exports

**Open questions:**
- How much of excalidraw-mcp is useful vs. just using `@excalidraw/excalidraw` React package directly?
- Canvas state sync: real-time via WebSocket or poll-on-focus?
- Should AI-generated diagrams use a constrained subset of Excalidraw elements?

### C2. Voice Input/Output — Gemini Flash Live + TTS

**Problem:** Text-only interaction limits accessibility and the "thinking out loud" use case. Many founders think better by talking.

**What (hybrid approach — async first, upgradeable to real-time):**

**Phase 1 — Voice Notes + TTS:**
- User clicks a mic icon in the message input area
- Records voice → transcribed to text via Web Speech API or Whisper
- Message sent as text to Claude (existing flow)
- Response rendered as text + optional TTS playback button per message
- Each board member gets a distinct voice character (via ElevenLabs or Google TTS)

**Phase 2 — Gemini Flash Live (future):**
- Real-time bidirectional audio stream using [Gemini 3.1 Flash Live](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview)
- User speaks naturally, Mary responds in real-time voice
- Board member interjections as audio with visual cue (card animation from B2)
- Architecture: Gemini handles the audio I/O, content routes through existing session context

**Voice identity per board member:**
| Member | Voice Character |
|--------|----------------|
| Mary | Warm, measured, facilitative |
| Victoria | Sharp, fast, direct |
| Casey | Casual, energetic, candid |
| Elaine | Calm, authoritative, reflective |
| Omar | Crisp, structured, operational |
| Taylor | Gentle, thoughtful, exploratory |

**Technical notes:**
- Phase 1 uses Web Speech API (free, browser-native) for STT, ElevenLabs/Google TTS for output
- Phase 2 requires Gemini API key + WebSocket connection for live audio streaming
- Audio content feeds into the same chat context — no separate conversation state
- Need to handle: interruptions, silence detection, multi-speaker transitions

**Open questions:**
- ElevenLabs vs. Google Cloud TTS vs. Gemini native TTS? (Cost, quality, latency tradeoffs)
- Does Gemini Flash Live support custom voice profiles, or is voice assignment handled post-generation?
- How to handle board member voice switching mid-response? (Mary says "Let me bring in Victoria" → voice changes)

---

## Key Decisions Made

1. **Positioning:** "Decision design system" — structured sessions that test if ideas are worth building. Not a chatbot.
2. **Feedback modal:** Usefulness + Would Return (Likert 1-5) + free text. Replaces mailto.
3. **Excalidraw:** Bidirectional (AI generates + user edits). Embedded React component, not MCP.
4. **Audio:** Hybrid approach — ship voice notes + TTS first, design for Gemini Live upgrade later.
5. **Board animations:** Panel cards with motion (slide forward, notification badges, color glow). Subtle, professional.
6. **Onboarding:** 3-4 screen modal on first visit. Differentiation-focused.

## Open Questions

1. **Excalidraw MCP fork vs. React embed:** Is the MCP server useful for anything, or is `@excalidraw/excalidraw` the right path?
2. **Voice provider:** ElevenLabs (best quality, expensive) vs. Google TTS (cheap, integrated with Gemini) vs. browser-native (free, limited)?
3. **Gemini Flash Live availability:** Is the preview API stable enough for production use in 2026 Q2?
4. **Feedback email delivery:** Direct SMTP, Resend, or just Supabase storage + admin dashboard?
5. **Onboarding analytics:** Track completion rate and drop-off per step?

## Sprint Sequencing

```
Sprint A (This Week)     Sprint B (Weeks 2-3)           Sprint C (Weeks 4-7)
─────────────────────    ──────────────────────────      ─────────────────────────
A1. CTA bug fix          B1. Onboarding flow             C1. Excalidraw panel
A2. Feedback modal       B2. Board member animations     C2. Voice I/O (Phase 1)
A3. Design system sync   B3. Design system update        C3. Gemini Live (Phase 2)
```

## Verification

- **A1:** Visual check on mobile/tablet/desktop — subtext fully visible
- **A2:** Submit feedback modal → email arrives at kevin@kevintholland.com + row in Supabase
- **B1:** New user sees onboarding → can skip → localStorage flag persists
- **B2:** Board member card animates on speaker switch, notification badge appears
- **C1:** AI generates diagram → renders in Excalidraw panel → user edits → AI sees changes
- **C2:** Voice input transcribes → response plays back with board member voice
