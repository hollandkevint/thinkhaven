# Executive Summary

**ThinkHaven** is a **decision architecture platform** that owns the gap between "I have information" and "I know what to do." When build cost approaches zero, the bottleneck shifts from execution to specification and decision-making. Positioned as "More structured than Claude, faster than consultants, more strategic than Miro," the platform packages expert methodology into an AI system with genuine pushback and polished, portable outputs.

## Core Value Proposition

- **Primary Value**: Pressure-test ideas and strategy in 10-30 minutes with opinionated pushback that most AI tools don't provide
- **Differentiation**: Enforced methodology + sub-persona balancing + anti-sycophancy + kill recommendations when warranted
- **Key Outcomes**: Lean Canvas, PRD/Spec documents that travel to prototyping tools (Lovable, Replit, Claude, Figma)

## Two-Tier Audience Model

| Tier | Audience | Job-to-be-Done | Pricing |
|------|----------|----------------|---------|
| **Entry** | Solo entrepreneurs, indie hackers | "Should I build this?" — idea validation | $25/session |
| **Growth** | Executives, product leaders, consultants | "Will this hold up in the room?" — strategy stress-test | $150-300/session |

Both tiers share the same methodology. The framing and pricing change.

## What ThinkHaven Is NOT

- A Claude wrapper with a persona
- A learning platform that teaches frameworks
- A project management tool
- A high-fidelity design tool
- Brainstorming without filtering

## The User Experience

Users should feel:
- **Challenged but confident** - Pressure-testing was useful and invigorating
- **Ready to build** - Clear direction on whether to invest time
- **Want to do it again** - Methodology creates momentum, not paralysis

**The magic is the feeling, not just the artifact.** Output is portable - it travels to the next tool in the workflow.

## Current Implementation Status (February 2026)

**Completed:**
- Sub-persona system — 4/6 stories done, 67 tests (types, weights, state detection)
- Agent-native tool system — 9 tools with agentic loop (max 5 rounds)
- Dynamic mode shifting — `switch_persona_mode` tool
- Anti-sycophancy / kill recommendations — `recommend_action` tool
- Output generation — `generate_document` tool (Lean Canvas, PRD)
- Beta access control — waitlist, JWT gating, manual approval
- Error/loading states — skeletons, retry, error display
- Design system — Wes Anderson palette, Jost/Libre Baskerville typography
- MDX blog — 2 articles published
- Auth migration — `@supabase/ssr` (replaced deprecated auth-helpers)

**Remaining for MVP:**
- 10-message trial gate (currently 5)
- Mode indicator UI (sub-persona mode visible to users)
- Enable tool mode toggle in UI
- E2E tests for agentic flow

## Market Validation

Alex Gutwillig's LinkedIn thread (Feb 2026) on "building on bad ideas faster with GenAI" validates the core thesis. Builders recognize the problem — GenAI lets you ship things nobody wants at record speed — but no tool addresses it. ThinkHaven fills that gap.

## Business Model

**Phase 1: Beta (Current)** — Free access via waitlist + approval
**Phase 2: Entry Tier** — $25/session + LTD option ($199-499)
**Phase 3: Executive Tier** — $150-300/session with premium positioning

## 90-Day Success Metrics

| Metric | Target |
|--------|--------|
| Acquisition | 100 signups |
| Activation | 50% complete session + output |
| Revenue | $2,000 |
| Retention | 75% return for 2nd session |

## Competitive Position

| Competitor | ThinkHaven's Edge |
|------------|-------------------|
| Claude (skills/projects) | Structured methodology + opinionated pushback + polished output |
| Strategy consultants | 10-30 min vs. weeks, $25 vs. $5K+, on-demand |
| Miro/Figjam/Balsamiq | Strategy-first with visuals as output, not canvas-first |
| Free prompt kits / GPTs | Persistent sessions, structured artifacts, session continuity |

**Moat:** Enforced methodology + sub-persona balancing + anti-sycophancy + polished portable outputs. Hard to DIY.

---

*See [Strategic Direction](./8-strategic-direction.md) for full specifications including market validation signals and two-tier pricing details.*
