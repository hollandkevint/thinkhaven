# Strategic Direction

*Refined through structured interview - January 2026*

## Core Positioning

ThinkHaven is a **decision accelerator** that applies structured methodology to validate or kill business ideas before users waste time building.

**What ThinkHaven IS:**
- A strategic thinking partner with opinionated pushback
- A problem design partner that helps articulate *what problem you're solving* before evaluating solutions
- An enforced methodology that can't be skipped
- A system that delivers polished, portable outputs

**What ThinkHaven is NOT:**
- A Claude wrapper with a persona
- A learning platform that teaches frameworks
- A project management tool
- A high-fidelity design tool
- Brainstorming without filtering

## Value Proposition

> "More structured than Claude, faster/cheaper than consultants, more strategic than Miro"

### The Problem We Solve

Most people don't know what they don't know about prompting. They accept sycophantic AI responses because they don't realize they should demand better. They build first, validate later, and waste months on the wrong thing.

Most people skip problem design entirely. They have a solution idea and work backwards to justify it. ThinkHaven forces the problem design work that LLMs cannot do alone—the collaborative framing that creates genuine understanding. As the research notes: "The ur-problem is to define the problem."

### Our Solution

ThinkHaven packages expert methodology into an AI-powered system that:
1. **Enforces structured thinking** - Users can't skip steps
2. **Provides genuine pushback** - Anti-sycophancy by design
3. **Delivers portable outputs** - Lean Canvas, PRD/Spec that travel to next tools
4. **Renders honest judgment** - Will recommend killing ideas when warranted

### Competitive Differentiation

| Competitor | What they offer | ThinkHaven's edge |
|------------|-----------------|-------------------|
| **Claude (skills/projects/Code)** | General AI with context management | Structured methodology + opinionated pushback + polished output |
| **Strategy consultants** | Human expertise, high-touch | 10-30 min vs. weeks, $20 vs. $5K+, available on-demand |
| **Miro/Figjam/Balsamiq** | Visual collaboration + AI features | Strategy-first with visuals as output, not canvas-first |

**Moat:** Enforced methodology + sub-persona balancing + anti-sycophancy + polished portable outputs. Hard to DIY.

## Target Users

### Primary: Builders & Strategists

**Who:** Solo founders, product managers, strategy team members
**Job-to-be-done:** Vet problems, get feedback, red-team ideas before committing time
**Pain when skipped:** Months wasted building the wrong thing
**Success feeling:** "I pressure-tested this, I'm confident, I'm ready to build"

### Secondary: Consultants

**Who:** Independent consultants who need to look structured for clients
**Job-to-be-done:** Produce strategic deliverables fast, apply frameworks without setup overhead
**Pain when skipped:** Manual framework application, inconsistent outputs, time pressure
**Success feeling:** "I have a partner that makes me sharper"

## Sub-Persona System

### The Four Modes

Every session includes all four modes, weighted by pathway:

| Mode | Role | Behavior |
|------|------|----------|
| **Inquisitive** | Dig deeper, understand context | Open-ended questions, explore assumptions |
| **Devil's Advocate** | Challenge assumptions, red-team | Push back on weak logic, probe blind spots |
| **Encouraging** | Validate good instincts | Acknowledge strong thinking, build confidence |
| **Realistic** | Ground in constraints | Time/resource reality, implementation feasibility |

### Pathway Weights

| Mode | New Idea | Business Model | Feature Refinement |
|------|----------|----------------|-------------------|
| Inquisitive | 40% | 20% | 25% |
| Devil's Advocate | 20% | 35% | 30% |
| Encouraging | 25% | 15% | 15% |
| Realistic | 15% | 30% | 30% |

### Mode Transitions

**Layer 1:** Pathway-weighted defaults (set at session start)
**Layer 2:** Dynamic shifting (AI reads the moment and adjusts)
**Layer 3:** User control (after ~10 exchanges, surface explicit options)

Dynamic shift triggers:
- User defensive → shift to Encouraging before returning to challenge
- User overconfident → lean into Devil's Advocate
- User spinning → bring in Realistic to ground

## Kill Decision Framework

ThinkHaven will recommend killing ideas when warranted. This is a key differentiator.

### Escalation Sequence

1. **Diplomatic flags** - "I see some significant risks here..."
2. **Deeper probe** - "Let me challenge this assumption..." (gives user chance to defend/pivot)
3. **Explicit recommendation** - "Based on what we've discussed, I don't think you should pursue this because..."
4. **Kill score** - Viability rating that makes the recommendation concrete

### Principle

Mary earns the right to kill an idea by doing the work first. She doesn't dismiss early - she explores, challenges, and THEN renders judgment.

## Session Experience

### Duration
10-30 minutes (not 3 minutes, not hour-long)

### Trial Flow
- 10 messages (up from current 5)
- Partial output provided at gate (value first)
- Full output + save + export requires signup

### The Feeling

Users should feel:
- **Invigorated** (not exhausted)
- **Confident** (not doubtful)
- **Momentum** (not analysis paralysis)

After session, they think:
- "I can imagine this" (friend/stakeholder viewing output)
- "I'm ready to build" (taking output to prototyping tool)
- "I want to do this again" (returning for next idea)

## Output Strategy

### MVP Outputs (Must Ship)

| Output | Purpose | Format |
|--------|---------|--------|
| **Lean Canvas** | Quick visual framework, pitch-ready | Structured markdown/PDF |
| **PRD/Spec** | Detailed working document, dev handoff | Structured markdown/PDF |

### Post-MVP Outputs

| Output | Purpose | Format |
|--------|---------|--------|
| **HTML Presentation** | Client-ready, shareable | Single-file HTML |
| **Low-fi Visuals** | Workflow diagrams, concept maps | Excalidraw-style sketches |

### Output Principle

**High polish:** Documents, specs (what you present to others)
**Low polish:** Wireframes, diagrams (thinking tools, not deliverables)

The canvas/visual workspace is **nice-to-have**, not critical. Text outputs carry the core value.

## Pricing Strategy

### Phase 1: Lifetime Deal
- Price: $199-499 one-time
- Goal: Early adopters, cash + feedback + testimonials
- Typical MicroSaaS launch pattern

### Phase 2: Subscription + Credits
- Subscription: Monthly access with session limits
- Credits: Pay-as-you-go for overflow or light users
- Goal: Sustainable recurring revenue

### Future Consideration
- BYOK (Bring Your Own Key) tier for cost-conscious power users

## Success Metrics (90-Day)

| Metric | Target | What it means |
|--------|--------|---------------|
| **Acquisition** | 100 signups | Enough volume to validate funnel |
| **Activation** | 50% complete session + output | 50 people get real value |
| **Revenue** | $2,000 | ~10-15 LTDs (proves willingness to pay) |
| **Retention** | 75% return for 2nd session | Methodology is working |

### Qualitative Signals
- Users report feeling "challenged but confident"
- Output is portable (users take it to prototyping tools)
- Consultants use it for multiple client engagements

## Implementation Priority

### Highest Leverage (Do First)

**Sub-persona system + polished output**

This is THE thing. If users feel encouraged AND challenged, if they feel pressure-testing was useful and invigorating, if they want to do it again and feel more confident in building - everything else follows.

### Build Status

**Already Built:**
- Claude integration with streaming
- Mary persona (basic questioning styles)
- Session persistence
- Guest flow (needs bump from 5 to 10 messages)
- Credit system infrastructure
- Lean Canvas output (partial)
- Spec/PRD generation (partial)

**Must Build for MVP:**
- Sub-persona balancing (all four modes, weighted by pathway)
- Dynamic mode shifting within session
- Anti-sycophancy / kill recommendation logic
- Kill score / viability rating
- Full output polish
- 10-message trial gate

**Post-MVP:**
- User-triggered mode control
- HTML presentation export
- Low-fi visual generation
- Canvas workspace integration

## Anti-Goals

Explicit decisions about what NOT to build:

| Anti-Goal | Reason |
|-----------|--------|
| Claude wrapper with persona | If it feels like "ChatGPT with a hat," it failed |
| Learning platform | We apply frameworks, not teach them |
| Project management | We end at the decision, don't track execution |
| High-fidelity design | Sketches support strategy, polish goes to documents |
| Brainstorming without filtering | Ideation must include pushback and red-teaming |
| Real-time canvas sync | Text output is the core value; canvas is downstream |

---

*This document reflects strategic direction refined through structured interview on January 4, 2026.*
