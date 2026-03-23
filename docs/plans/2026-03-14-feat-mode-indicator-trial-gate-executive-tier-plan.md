---
title: ThinkHaven Feature Spec — March 2026
created: 2026-03-14
status: partially-superseded
superseded_by: docs/plans/2026-03-22-feat-multi-sprint-product-roadmap-plan.md
tags: [thinkhaven, product-spec, features]
---

> **PARTIALLY SUPERSEDED 2026-03-22.** Mode Indicator shipped in session UX overhaul (PR #14). Trial Gate and Executive Tier deferred to post-Sprint 3 in the multi-sprint roadmap.

# ThinkHaven Feature Spec — March 2026

Three features for the next development cycle. Each is implementation-ready: a developer (or Kevin with Claude Code) should be able to build from this document without ambiguity.

**Stack reference:** Next.js, Supabase, Vercel, TypeScript, Tailwind CSS
**Design system:** Wes Anderson — warm cream `#f5f3f0`, charcoal-brown `#3d3229`, dusty rust `#c4724e`, muted pastels
**Existing context:** [[thinkhaven]] (GitHub tracking), [[Thinkhaven-Vault-Connections]], [[ThinkHaven-Priestley-Blueprint]]

---

## Feature 1: Mode Indicator

### Purpose

Users currently have no persistent visual signal telling them which decision mode they're operating in. This matters because ThinkHaven's three modes (assessment, stress-test, executive prep) have different interaction patterns, different system prompts, and different output expectations. Without a visible indicator, users lose orientation mid-session. They also can't intentionally switch modes, which limits the product's value as a decision architecture tool.

The mode indicator serves three jobs:
1. **Orientation** — "Where am I right now?"
2. **Expectation setting** — "What kind of output should I expect?"
3. **Navigation** — "How do I change modes if my thinking shifts?"

### Placement

The mode indicator sits in the **left sidebar header**, directly below the ThinkHaven logo and above the session history list. This keeps it visible at all times without competing with the conversation pane. On mobile (sidebar collapsed), the mode appears as a compact pill in the top navigation bar.

```
┌─────────────────────────────────────────────────┐
│  [Logo]                                         │
│  ┌───────────────────────┐                      │
│  │ ● Assessment Mode     │   ← Mode Indicator   │
│  │   Structured eval     │                      │
│  └───────────────────────┘                      │
│                                                 │
│  Session History                                │
│  ├─ Today: Q1 pricing...                        │
│  ├─ Yesterday: Market...                        │
│  └─ ...                                         │
│                                                 │
│  [+ New Session]                                │
└─────────────────────────────────────────────────┘
```

### Visual Design

Three modes, each with a distinct accent color drawn from the Wes Anderson palette:

| Mode | Accent Color | Icon | Label |
|------|-------------|------|-------|
| Assessment | `#c4724e` (dusty rust) | `◉` filled circle | "Assessment" |
| Stress-Test | `#8b7355` (warm brown) | `⚡` lightning | "Stress-Test" |
| Executive Prep | `#3d3229` (charcoal-brown) | `◆` diamond | "Executive Prep" |

The indicator component:
- Background: `#f5f3f0` (warm cream) with 1px border in the mode's accent color
- Left border: 3px solid in the mode's accent color (vertical stripe, like a book spine)
- Typography: mode name in the accent color, 14px, serif font (matches Wes Anderson system). Subtitle in `#8b7355` at 12px.
- Corner radius: `4px` (not rounded pills — the design system is editorial, not bubbly)

Subtitles per mode:
- Assessment: "Structured evaluation"
- Stress-Test: "Pressure-test your logic"
- Executive Prep: "Board-ready thinking"

### State Transitions

**User-initiated switch (primary):**
Clicking the mode indicator opens a dropdown with all three modes. Each option shows the mode name, subtitle, and a one-line description of when to use it. Selecting a new mode mid-conversation inserts a system message into the chat:

> "Switching to Stress-Test mode. I'll now focus on challenging your assumptions and finding weak points in your reasoning."

The system prompt updates behind the scenes. No page reload. Conversation context is preserved.

**System-suggested switch:**
If the AI detects a mode mismatch (e.g., user is asking stress-test questions in assessment mode), it suggests a switch inline:

> "You're asking me to poke holes in your strategy — that's what Stress-Test mode is built for. Want to switch? [Switch to Stress-Test] [Stay in Assessment]"

The suggestion appears as an inline card with two buttons, not a modal. User can ignore it.

**New session default:**
New sessions start in Assessment mode unless the user explicitly selects a different mode from the "New Session" flow. The `/try` guest experience also defaults to Assessment.

### Component Interface

```tsx
// components/ModeIndicator.tsx

type SessionMode = 'assessment' | 'stress-test' | 'executive-prep';

interface ModeConfig {
  id: SessionMode;
  label: string;
  subtitle: string;
  description: string;
  accentColor: string;  // hex
  icon: string;         // emoji or icon component
}

const MODES: ModeConfig[] = [
  {
    id: 'assessment',
    label: 'Assessment',
    subtitle: 'Structured evaluation',
    description: 'Walk through your decision systematically. Best for early-stage thinking.',
    accentColor: '#c4724e',
    icon: '◉',
  },
  {
    id: 'stress-test',
    label: 'Stress-Test',
    subtitle: 'Pressure-test your logic',
    description: 'I push back on weak reasoning and surface blind spots. Best before high-stakes meetings.',
    accentColor: '#8b7355',
    icon: '⚡',
  },
  {
    id: 'executive-prep',
    label: 'Executive Prep',
    subtitle: 'Board-ready thinking',
    description: 'Structured challenge + polished output artifacts. Premium tier.',
    accentColor: '#3d3229',
    icon: '◆',
  },
];

interface ModeIndicatorProps {
  currentMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  isExecutiveTierEnabled: boolean; // gates Executive Prep visibility
}
```

**Tailwind classes (example for assessment mode):**
```html
<div class="bg-[#f5f3f0] border border-[#c4724e] border-l-[3px] rounded-[4px] px-3 py-2 cursor-pointer">
  <span class="text-[#c4724e] font-serif text-sm font-medium">◉ Assessment</span>
  <span class="text-[#8b7355] text-xs block">Structured evaluation</span>
</div>
```

### Edge Cases

**Mid-conversation mode switch:** Preserve all messages. Append the system transition message. Update the system prompt for subsequent AI responses. The AI should acknowledge the shift in its next response naturally, not just continue as if nothing changed.

**Back button after mode switch:** Browser back navigates to the previous page, not the previous mode. Mode changes are not navigation events. If the user wants to revert, they click the indicator again and switch back.

**Guest users on `/try`:** Mode indicator is visible but only Assessment is available. Stress-Test and Executive Prep show a lock icon with tooltip: "Available after signup." This creates upgrade motivation without blocking the trial.

**Session persistence:** Mode is stored per session in Supabase (`sessions.mode` column, type `text`, default `'assessment'`). Loading an old session restores the mode it was last in.

---

## Feature 2: Trial Gate (10 Messages)

### Current State

The guest message limit was increased from 5 to 10 in the Jan 10 deploy. Basic counting exists. What's missing: visible progress indication, conversion-optimized paywall, session preservation after payment, and edge case handling for multi-tab / cookie-clearing scenarios.

### Message Counting Logic

**What counts as a message:** Only user-sent messages increment the counter. System messages (mode switch notifications, welcome messages) and AI responses do not count. This means a 10-message trial gives the user 10 turns of conversation, which is roughly a 15-20 minute session at natural conversation pace.

**Why user-only:** Counting both sides would halve the effective trial length and feel punitive. The user should feel they got a real session, not a truncated demo.

**Counter storage:** Supabase table `guest_sessions` (schema below). Counter increments on successful message send, not on keypress or form submission. If the API call to send a message fails, the counter does not increment.

### Remaining Messages UI

A subtle counter in the input area, right-aligned above the text input:

```
┌─────────────────────────────────────────────┐
│                                             │
│  [conversation messages...]                 │
│                                             │
│                        7 of 10 messages used│
│  ┌─────────────────────────────────────┐    │
│  │ Type your message...          [Send]│    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Visual progression:**
- Messages 1-7: counter text in `#8b7355` (warm brown), 12px, low visual weight
- Messages 8-9: counter text shifts to `#c4724e` (dusty rust), adds a subtle pulse animation on message 9
- Message 10: counter text in `#c4724e`, bold: "Last free message"

The counter does not appear for authenticated paid users. It only renders when `session.is_guest === true` or `user.subscription_status === 'trial'`.

### Paywall Trigger

**Hard stop after message 10.** No "just one more" soft nudge. The user has had enough conversation to experience ThinkHaven's value. A soft gate dilutes the urgency.

After the user sends message 10 and receives the AI's response, the input area is replaced by the paywall card. The conversation remains visible and scrollable above it. The user can re-read everything but cannot send message 11.

### Paywall Card Design

Full-width card replacing the input area. Warm cream background (`#f5f3f0`), charcoal-brown text, dusty rust CTA button.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  You've used your 10 free messages.             │
│                                                 │
│  [Variant copy — see below]                     │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │       Continue This Session — $X/mo     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Your conversation is saved.                    │
│  Pick up exactly where you left off.            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Copy variants (A/B test these):**

**Variant A — Decision Pressure:**
> "You're 10 messages into a decision that matters. The thinking you've started here doesn't finish itself. Keep going."

**Variant B — Sunk Cost + Progress:**
> "You've already mapped the problem. Now stress-test the solution. Your session context carries over, nothing lost."

**Variant C — Anti-Sycophancy Hook:**
> "Most AI tools would let you keep going and tell you what you want to hear. ThinkHaven is built to tell you what you need to hear. That's worth paying for."

Variant C leans into the product's core differentiator. Start with C as default, A/B test against A and B after 200+ trial sessions.

**CTA button:** `#c4724e` background, white text, `font-serif`, 16px. Text: "Continue This Session — $X/mo" (replace $X with actual pricing). Below the button: "Your conversation is saved. Pick up exactly where you left off." in `#8b7355` at 13px.

### Session Preservation After Payment

This is non-negotiable. If a user pays and their conversation is gone, trust is destroyed.

**Flow:**
1. User hits paywall after message 10
2. User clicks CTA, enters payment flow (Stripe Checkout or embedded form)
3. On successful payment, Supabase webhook fires:
   - Creates/updates `users` row with `subscription_status = 'active'`
   - Links `guest_sessions.id` to `users.id` via `guest_sessions.converted_user_id`
   - Sets `guest_sessions.converted_at` timestamp
4. User is redirected back to the same session URL
5. The paywall card disappears, the input area returns, the conversation continues

**If payment fails or is abandoned:** The paywall card stays. The conversation stays. The user can return later and try again. Session data persists for 30 days in `guest_sessions`.

### Supabase Schema

```sql
-- Guest session tracking
CREATE TABLE guest_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,        -- browser fingerprint for anonymous tracking
  session_token TEXT NOT NULL UNIQUE,     -- stored in cookie/localStorage
  message_count INTEGER DEFAULT 0,
  max_messages INTEGER DEFAULT 10,
  mode TEXT DEFAULT 'assessment',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES auth.users(id),
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Index for fast lookup by session token
CREATE INDEX idx_guest_sessions_token ON guest_sessions(session_token);

-- RLS: guests can read/update their own session
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests_own_session" ON guest_sessions
  FOR ALL USING (session_token = current_setting('request.headers')::json->>'x-session-token');
```

**Message count increment** happens via a Supabase RPC function to avoid race conditions:

```sql
CREATE OR REPLACE FUNCTION increment_message_count(p_session_token TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE guest_sessions
  SET message_count = message_count + 1,
      last_message_at = now()
  WHERE session_token = p_session_token
    AND message_count < max_messages
  RETURNING message_count INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Message limit reached or invalid session';
  END IF;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Cases

**Browser refresh:** Session token is stored in `localStorage` (primary) and a `httpOnly` cookie (fallback). Refreshing the page reloads the session from Supabase using the token. Message count and conversation persist.

**Multiple tabs:** All tabs share the same `localStorage` session token. Message count is server-authoritative (Supabase), so sending a message in Tab A immediately reflects in Tab B on next action. No client-side count caching.

**Cleared cookies + localStorage:** The session is lost. A new guest session starts with 10 fresh messages. This is intentional. The effort required to clear both storage mechanisms is high enough that abuse will be minimal. If abuse becomes measurable, add fingerprint-based rate limiting using the `fingerprint_hash` column (FingerprintJS or similar).

**User signs up mid-trial (before 10 messages):** Remaining messages carry over. The `guest_sessions` row is linked to the new `users` row. The user continues seamlessly. No paywall appears because they authenticated.

**Returning guest (same browser, next day):** Session token persists. Counter continues from where they left off. The 30-day expiry gives plenty of runway for natural return visits.

---

## Feature 3: Executive-Tier Session Design

### What This Is

A premium session type for C-suite users and senior leaders making high-stakes strategic decisions. It differs from standard sessions in three ways: the AI actively challenges instead of assists, the output is a structured board-ready artifact, and the session connects to DPOS Layer 3 (Product/Strategic Thinking) concepts.

This is the growth tier identified in [[Nate-Jones-Play-vs-Strategy-ThinkHaven-Analysis]]: executives have higher willingness to pay, less competition from free prompt kits, and natural alignment with ThinkHaven's anti-sycophancy positioning.

### How It Differs from Standard Sessions

| Dimension | Standard Session | Executive Session |
|-----------|-----------------|-------------------|
| AI posture | Collaborative, guiding | Adversarial by default ("No-Man" mode) |
| Output | Conversation transcript | Board-ready artifact (structured document) |
| Context depth | Single-session focus | Multi-session continuity with evolving decision context |
| Session length | ~15-20 min (10 messages for trial) | ~30-45 min (uncapped messages, but structured phases) |
| Framework connection | General decision methodology | DPOS Layer 3 integration (value-first thinking, 5-risk model) |
| Price | Standard tier | Premium tier (see pricing section) |

### No-Man Mode

Drawn directly from Sivulka's institutional AI thesis ([[Sivulka-Institutional-AI-vs-Individual-AI-Literature-Note]]): foundation models are RLHF'd into sycophancy, and "the most consequential future applications will be AI board members, AI auditors, AI compliance — systems built to say no."

ThinkHaven's No-Man mode implements this for strategic decisions. The AI acts as institutional counterweight, not agreeable assistant.

**Behavioral specification:**

1. **Default stance: skeptical.** The AI assumes the user's reasoning has gaps until proven otherwise. It does not open with "that's a great approach" or "interesting idea." It opens with a question that probes the weakest point.

2. **Escalating challenge.** Three levels:
   - **Level 1 — Clarification:** "What evidence supports that assumption?" / "How did you arrive at that number?"
   - **Level 2 — Counterargument:** "Here's why that logic breaks down..." / "The most common failure mode for this type of decision is..."
   - **Level 3 — Kill recommendation:** "Based on what you've told me, I'd recommend against this. Here's why..." (Only reached when the reasoning has fundamental structural problems, not just gaps.)

3. **Explicit assumption tracking.** Every time the user makes a claim, the AI tags it as an assumption and tracks whether it has been validated. At the end of the session, unvalidated assumptions appear in the artifact's risk register.

4. **No false validation.** If the user's strategy is sound, the AI says so plainly: "I tried to break this and couldn't. Your reasoning holds on these dimensions: [list]. The remaining risk is [specific]." This is more valuable than generic praise.

**System prompt structure for No-Man mode:**

```
You are ThinkHaven's Executive Advisor operating in No-Man mode.

Your role: institutional counterweight. You exist to find the weakness
in the user's reasoning before their board, investors, or market does.

Rules:
- Never open with agreement or praise. Open with the hardest question.
- Track every assumption the user makes. Tag each as VALIDATED,
  UNVALIDATED, or CONTRADICTED based on evidence provided.
- When you identify a fundamental flaw, say so directly. Do not soften
  with "however" or "that said." State the problem, state the evidence,
  state the recommendation.
- If the reasoning is sound, say that too. "I tried to break this.
  It holds." is the highest compliment you give.
- At session end, generate the Board-Ready Artifact (see artifact format).

Framework reference: Apply DPOS Layer 3 concepts when relevant:
- Value-first thinking: Is this decision optimizing for outcomes or outputs?
- 5-risk model: Value, Usability, Feasibility, Viability, Ethical Data
- Decision velocity: Is this a reversible or irreversible decision?
- Cross-functional handoffs: Who else needs to validate this?
```

### DPOS Layer 3 Connection

Executive sessions reinforce [[DPOS-Framework-Strategic-Overview]] Layer 3 (Product/Strategic Thinking) concepts without forcing the user to know what DPOS is. The AI applies these naturally:

**Value-First Framing:** When a user describes a strategy, the AI asks: "Is this optimizing for a business outcome or a capability demonstration?" This maps to DPOS's "think in value, not capabilities" principle.

**5-Risk Assessment:** The AI evaluates the decision against all five risks:
1. **Value risk** — Does this solve a real problem?
2. **Usability risk** — Can the target audience actually use/adopt this?
3. **Feasibility risk** — Can this be built/executed with available resources?
4. **Viability risk** — Does the business model work?
5. **Ethical data risk** — Are there data ethics, privacy, or trust concerns?

If the user's strategy only addresses 2-3 of these, the AI flags the gaps explicitly.

**Integration Rituals:** For decisions involving multiple stakeholders, the AI prompts: "Who else needs to sign off on this? What's the handoff mechanism? Where does this decision break down between teams?" This surfaces cross-functional coordination problems before they become execution failures.

### Board-Ready Artifact Output

At session end (user-triggered via a "Generate Artifact" button), the AI produces a structured document. Format:

```markdown
# Decision Brief: [User's Decision Title]
Generated by ThinkHaven | [Date] | Executive Session

## Executive Summary
[3-4 sentences. What decision is being made, what the recommendation is,
and the confidence level.]

## Decision Context
[What prompted this decision. Key constraints. Timeline.]

## Options Evaluated
| Option | Strengths | Weaknesses | Risk Profile |
|--------|-----------|------------|--------------|
| A      | ...       | ...        | ...          |
| B      | ...       | ...        | ...          |
| C      | ...       | ...        | ...          |

## Assumption Register
| # | Assumption | Status | Evidence | Risk if Wrong |
|---|-----------|--------|----------|---------------|
| 1 | ...       | Validated / Unvalidated / Contradicted | ... | ... |
| 2 | ...       | ...    | ...      | ...           |

## Risk Matrix
| Risk Type | Level | Mitigation | Owner |
|-----------|-------|------------|-------|
| Value     | Low / Medium / High | ... | ... |
| Usability | ...   | ...        | ...   |
| Feasibility | ... | ...        | ...   |
| Viability | ...   | ...        | ...   |
| Ethical   | ...   | ...        | ...   |

## Recommendation
[Clear recommendation with stated confidence: HIGH / MEDIUM / LOW]
[Conditions that would change this recommendation]
[Suggested next action with timeline]

## Dissenting View
[The strongest argument AGAINST the recommendation. Included by default
because boards respect leaders who present both sides.]
```

The artifact is rendered in a right-side panel (or modal on mobile), downloadable as Markdown and PDF. The Markdown is copy-pasteable into Notion, Google Docs, or Confluence.

### Session Template / Prompt Architecture

Executive sessions follow a four-phase structure. The AI manages phase transitions based on conversation progress, not rigid turn counts.

**Phase 1 — Context Loading (messages 1-3)**
System behavior: gather decision context, identify the core question, surface initial assumptions.
Transition trigger: AI has enough context to articulate the decision back to the user.

**Phase 2 — Challenge (messages 4-8)**
System behavior: No-Man mode at full strength. Probing, counterarguments, assumption testing.
Transition trigger: AI has tested the major assumptions and identified the key risks.

**Phase 3 — Synthesis (messages 9-12)**
System behavior: shift from adversarial to analytical. Help the user integrate the challenges into a revised position.
Transition trigger: user signals readiness for output, or AI determines the reasoning has been sufficiently stress-tested.

**Phase 4 — Artifact Generation (final)**
System behavior: produce the Board-Ready Artifact. Offer to refine specific sections.
Trigger: user clicks "Generate Artifact" or AI prompts: "We've covered the key dimensions. Ready for me to generate your decision brief?"

**Context loading between sessions:**
For returning executive users, the AI loads previous session artifacts and assumption registers. Opening message references unresolved items: "Last session you had 3 unvalidated assumptions about market timing. Have any of those been resolved?"

### Pricing Positioning

| Tier | Price | Includes |
|------|-------|----------|
| Standard | $X/mo | Assessment + Stress-Test modes, conversation-only output |
| Executive | $3-5x Standard/mo | All standard features + Executive Prep mode, No-Man mode, Board-Ready Artifacts, multi-session continuity |

Exact pricing TBD after standard tier pricing is set. The multiplier should be 3-5x, not 10x. The goal is accessible to individual executives spending their own money (not requiring procurement approval). If standard is $29/mo, executive is $99-149/mo.

Alternative: per-session pricing for executive sessions. $49-99 per executive session, no subscription required. This reduces commitment friction for first-time executive users and aligns with the Priestley "Product for Prospects" tier ($150-300 per session in [[ThinkHaven-Priestley-Blueprint]]).

### Visual Differentiation

When a user enters an executive session, three visual shifts signal they're in a different experience:

1. **Mode indicator:** Charcoal-brown (`#3d3229`) accent with diamond icon. The indicator is visually heavier than assessment/stress-test modes.

2. **Chat background:** Shifts from default warm cream to a slightly cooler cream (`#f0eeeb`) — subtle but perceptible. The contrast communicates "this is a different room."

3. **AI avatar treatment:** In standard sessions, the AI avatar is a simple icon. In executive sessions, the AI label reads "ThinkHaven Advisor" with a small "Executive" badge in `#3d3229`. This mirrors how consulting firms differentiate partner-level engagement from associate-level.

4. **Artifact panel:** A collapsible right panel (or bottom panel on mobile) appears in executive sessions, showing the artifact building in real-time as assumptions are tracked and risks are identified. Standard sessions don't have this panel.

```
┌──────────┬───────────────────────────┬──────────────┐
│ Sidebar  │    Conversation Pane      │  Artifact    │
│          │                           │  Panel       │
│ ◆ Exec   │  [AI challenge message]   │              │
│  Prep    │  [User response]          │ Assumptions: │
│          │  [AI counterargument]     │ 1. ✓ Valid   │
│ Sessions │  [User revision]          │ 2. ? Untested│
│ ├─ ...   │                           │ 3. ✗ Broken  │
│ ├─ ...   │                           │              │
│          │  ┌──────────────────┐     │ Risks:       │
│          │  │ Type message...  │     │ Value: Low   │
│          │  └──────────────────┘     │ Feas.: Med   │
│          │                           │              │
│ [+New]   │           [Gen. Artifact] │              │
└──────────┴───────────────────────────┴──────────────┘
```

### Edge Cases

**User downgrades mid-executive-session:** Session continues with existing context. Artifacts already generated remain accessible. New messages after downgrade revert to standard AI behavior (no No-Man mode, no artifact panel). The paywall card appears if they try to generate a new artifact.

**Executive session with incomplete context:** If the user triggers artifact generation before Phase 3 (synthesis), the AI warns: "I don't have enough context for a strong decision brief yet. The artifact will have gaps. Generate anyway, or continue the conversation?" This prevents low-quality artifacts that erode trust in the format.

**Free trial user discovers executive mode:** The mode indicator shows Executive Prep with a lock icon. Clicking it shows a preview of the artifact format and the No-Man mode description, with a CTA to upgrade. This is the conversion path from trial to executive tier.

---

## Implementation Priority

| Feature | Effort | Impact | Ship Order |
|---------|--------|--------|------------|
| Mode Indicator | Small (1-2 days) | Medium — fixes orientation, unlocks mode switching | First |
| Trial Gate | Medium (3-5 days) | High — directly drives conversion | Second |
| Executive Tier | Large (1-2 weeks) | High — unlocks premium pricing, differentiates from free alternatives | Third |

Mode Indicator is a prerequisite for the Executive Tier (the indicator needs to exist before a third mode can be visually differentiated). Trial Gate is independent and can be built in parallel.

---

## Related Documents

- [[thinkhaven]] — GitHub repo tracking and recent commits
- [[Thinkhaven-Vault-Connections]] — Master index of vault content informing ThinkHaven
- [[ThinkHaven-Priestley-Blueprint]] — Priestley framework application, product ladder, assessment design
- [[Nate-Jones-Play-vs-Strategy-ThinkHaven-Analysis]] — Competitive positioning, executive tier rationale
- [[DPOS-Framework-Strategic-Overview]] — Layer 3 integration source material
- [[Sivulka-Institutional-AI-vs-Individual-AI-Literature-Note]] — No-Man mode intellectual foundation
