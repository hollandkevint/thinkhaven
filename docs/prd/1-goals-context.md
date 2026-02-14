# Goals and Background Context

## Goals

### Product Goals
- Launch **ThinkHaven as a Decision Architecture Platform** positioned as "More structured than Claude, faster than consultants, more strategic than Miro"
- Own the gap between "I have information" and "I know what to do" — when build cost approaches zero, the bottleneck is specification and decision-making
- Deliver polished, portable outputs (Lean Canvas, PRD/Spec) that travel to prototyping tools
- Achieve product-market fit with defensible moat: enforced methodology + sub-persona balancing + anti-sycophancy

### Business Goals
- **90-Day MVP Targets:** 100 signups, 50% activation, $2,000 revenue, 75% retention
- **Two-Tier Audience:** Entry ($25/session for solo entrepreneurs) + Growth ($150-300/session for executives)
- **Phase 1 Revenue:** Free beta → LTDs ($199-499) for early adopters + feedback
- **Phase 2 Revenue:** Two-tier session pricing for sustainable revenue

### Technical Goals
- Agent-native tool system with 9 tools and agentic loop (✅ complete)
- Sub-persona system: Inquisitive → Devil's Advocate → Encouraging → Realistic (✅ 4/6 stories complete, 67 tests)
- Kill recommendation logic with viability scoring (✅ complete via `recommend_action` tool)
- 10-message trial gate with partial output at conversion point (pending)
- Beta access control with waitlist + JWT gating (✅ complete)

### Design Principles
Derived from research synthesis (see Vault literature notes):

1. **Problem First** - Help users design the problem before designing solutions. "The ur-problem is to define the problem" - most people skip problem design entirely
2. **Respect Exhaustion** - Users are tired; 30 minutes forces clarity, not sprawl. Build for the most exhausted version of your user
3. **Truth Over Comfort** - Anti-sycophancy is the feature, not a bug. LLMs default to sycophancy; we override that
4. **Process IS Learning** - The collaborative framing creates shared understanding. The methodology itself is the value
5. **Cognitive Mode Matching** - Match session pathway to the thinking required (Value, Constraints, People, Time)
6. **Constraint as Catalyst** - Time limits and enforced steps force clarity and prevent analysis paralysis

## Background Context

### Product Vision
ThinkHaven is a decision architecture platform that applies structured methodology to the gap between information and action. When GenAI agents make building cheap and fast, the bottleneck shifts upstream — from "can I build this?" to "should I build this?" and "will this hold up under scrutiny?" ThinkHaven owns that decision layer for two audiences: solo entrepreneurs validating ideas and executives stress-testing strategy before high-stakes meetings.

### Current State (February 2026)
The platform is a **live beta** with agent-native architecture complete:
- Working Supabase authentication with @supabase/ssr
- Claude Sonnet 4 integration with 9 agent-native tools and agentic loop
- Sub-persona system (4/6 stories, 67 tests) with dynamic mode shifting
- Beta access control (waitlist → approval → access)
- Design system (Wes Anderson palette) and MDX blog (2 articles)
- Error/loading states implemented across all async operations

### Key Platform Features
- **Agent-Native Architecture:** 9 tools give Mary autonomous control over session progression, mode shifting, recommendations, and document generation
- **Sub-Persona System:** Four modes (Inquisitive, Devil's Advocate, Encouraging, Realistic) weighted by pathway
- **Anti-Sycophancy:** Kill recommendations with escalation sequence and viability scoring
- **Polished Outputs:** Lean Canvas, PRD/Spec generated from session insights
- **Beta Access:** Waitlist signup → JWT-gated approval → full access

### Target Users — Two-Tier Model

**Entry Tier: Solo Entrepreneurs**
- **Who:** Solo founders, indie hackers, vibe coders shipping fast
- **Job-to-be-done:** "Should I build this?" — validate before committing time
- **Pain when skipped:** Months wasted building something nobody wants
- **Success feeling:** "I pressure-tested this, I'm confident, I'm ready to build"
- **Pricing:** $25/session

**Growth Tier: Executives & Product Leaders**
- **Who:** CPOs, VPs of Product, strategy team leads, consultants
- **Job-to-be-done:** "Will this hold up in the room?" — stress-test strategy before high-stakes meetings
- **Pain when skipped:** Walking into a board meeting with untested assumptions
- **Success feeling:** "I have a partner that makes me sharper"
- **Pricing:** $150-300/session

### Market Position
ThinkHaven represents a new category: **"Decision Architecture Platform"** — structured methodology applied to the gap between information and action. It combines probabilistic exploration (AI with anti-sycophancy) with deterministic structure (enforced methodology) and polished outputs, enabling users to move from raw ideas to validated decisions in structured 10-30 minute sessions.

### Success Metrics
**Technical Success Criteria:**
- <2s AI response time with Claude Sonnet 4
- >95% API reliability and uptime
- Seamless streaming interface without interruption

**Business Success Criteria:**
- >80% session completion rate for 10-30 minute strategic sessions
- >10min average session duration with meaningful engagement
- User retention of >60% for monthly active strategic thinking sessions

**User Experience Success Criteria:**
- Conversation-first interaction with genuine pushback
- Transparent persona adaptation that feels natural to users
- Exportable outcomes that provide real business value
