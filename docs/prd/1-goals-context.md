# Goals and Background Context

## Goals

### Product Goals
- Launch **ThinkHaven as a Decision Accelerator** positioned as "More structured than Claude, faster than consultants, more strategic than Miro"
- Validate or kill business ideas before users waste time building through enforced methodology with genuine pushback
- Deliver polished, portable outputs (Lean Canvas, PRD/Spec) that travel to prototyping tools
- Achieve product-market fit with defensible moat: enforced methodology + sub-persona balancing + anti-sycophancy

### Business Goals
- **90-Day MVP Targets:** 100 signups, 50% activation, $2,000 revenue, 75% retention
- **Phase 1 Revenue:** Lifetime deals ($199-499) for early adopters + feedback
- **Phase 2 Revenue:** Subscription + credits for sustainable MRR
- Primary users: Builders/strategists validating before committing, consultants needing structured deliverables fast

### Technical Goals
- Implement sub-persona system: Inquisitive → Devil's Advocate → Encouraging → Realistic (all modes in every session, weighted by pathway)
- Build kill recommendation logic with viability scoring
- Achieve 10-message trial gate with partial output at conversion point
- Polish Lean Canvas + PRD/Spec output generation

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
The ThinkHaven platform combines the proven bMAD Method foundation with an innovative dual-pane interface that revolutionizes how strategic thinking happens. Drawing from the success of strategy consultants who transformed $15K engagements into $50K validated outcomes, this platform addresses the core problem: current AI tools provide unstructured conversations while traditional tools lack intelligence.

### Current State Reality
The platform currently exists as a sophisticated **Next.js 15 application with foundational architecture**, including:
- Working Supabase authentication system
- Comprehensive database schema designed for AI integration
- Dual-pane workspace foundation with CSS framework
- Professional monorepo structure with proper module organization

**Critical Gap**: The platform lacks actual Claude Sonnet 4 integration - current "Mary" AI responses are hardcoded simulations in `workspace/[id]/page.tsx:104-110` requiring immediate replacement with real AI capabilities.

### Key Platform Features
- **Adaptive AI Persona:** Transparently evolves during sessions from initial brainstorming through strategic validation
- **Dual-Pane Experience:** Conversational coaching (left) + visual canvas (right) for wireframing, Mermaid diagrams, and concept iteration
- **Choose-Your-Adventure Flow:** Users select their ideation path (new idea, business model problem, feature refinement) with tailored coaching approaches
- **Open-Source Extensibility:** Community-driven coaching patterns and techniques beyond bMAD foundation

### Target Users

**Primary: Builders & Strategists**
- **Who:** Solo founders, product managers, strategy team members
- **Job-to-be-done:** Vet problems, get feedback, red-team ideas before committing time
- **Pain when skipped:** Months wasted building the wrong thing
- **Success feeling:** "I pressure-tested this, I'm confident, I'm ready to build"

**Secondary: Consultants**
- **Who:** Independent consultants who need to look structured for clients
- **Job-to-be-done:** Produce strategic deliverables fast, apply frameworks without setup overhead
- **Pain when skipped:** Manual framework application, inconsistent outputs, time pressure
- **Success feeling:** "I have a partner that makes me sharper"

### Market Position
This represents a new category: **"Strategic Thinking Workspace"** - combining probabilistic exploration (AI) with deterministic structure (workflows) and visual iteration capabilities, enabling users to move from raw ideas to validated business concepts in structured 30-minute sessions.

### Success Metrics
**Technical Success Criteria:**
- <2s AI response time with Claude Sonnet 4 integration
- >95% API reliability and uptime
- Seamless streaming interface without interruption

**Business Success Criteria:**
- >80% session completion rate for 30-minute strategic sessions
- >10min average session duration with meaningful engagement
- User retention of >60% for monthly active strategic thinking sessions

**User Experience Success Criteria:**
- Intuitive dual-pane interaction with seamless context bridging
- Transparent persona adaptation that feels natural to users
- Exportable outcomes that provide real business value