# Epic Structure

## Epic Approach

**Epic Structure Decision:** **Foundation + Enhancement Epics** with strategic priority alignment

The epic structure has been updated to align with the February 2026 strategic direction. The platform has evolved from "decision accelerator" to **"decision architecture platform"** with a two-tier audience model.

**Strategic Priority:**
1. Sub-persona balancing (all four modes, weighted by pathway) — ✅ 4/6 stories complete
2. Anti-sycophancy / kill recommendation logic — ✅ complete
3. Full output polish (Lean Canvas, PRD/Spec) — ✅ complete
4. 10-message trial gate — pending
5. Executive tier expansion — future

**Rationale:**
- Core value is methodology enforcement + genuine pushback + polished outputs
- Canvas/visual workspace is post-MVP (nice-to-have, not critical)
- Text outputs carry the core value proposition

## Epic 0: Google Authentication Foundation ✅ COMPLETE

### Epic Goal
Replace the broken Vercel-Supabase OAuth integration with Google's pre-built signin system, providing seamless Google-first authentication, cost controls, and scalable user management foundation.

### Status: All Stories Complete
- Story 0.1: Remove Complex OAuth Middleware ✅
- Story 0.2: Implement Google Pre-built Signin ✅
- Story 0.3: Update Supabase Configuration for ID Token Flow ✅
- Story 0.4: Authentication Testing & Validation ✅

---

## Epic 1: Claude AI Integration & Decision Architecture Platform ✅ PARTIALLY COMPLETE

### Epic Goal
Transform the existing foundation into a fully functional **decision architecture platform** powered by Claude, enabling real-time AI conversations with sub-persona balancing, anti-sycophancy features, and 10-30 minute structured strategic sessions.

### Status: Core Stories Complete

| Story | Title | Status |
|-------|-------|--------|
| 1.1 | Fix Session Creation Database Failures | ✅ Done |
| 1.2 | Improve User Interface State Management | ✅ Done |
| 1.3 | Enhance User Experience Error Handling | ✅ Done |
| 1.4 | Sub-Persona System Implementation | ✅ Done (67 tests) |
| 1.5 | Anti-Sycophancy & Kill Recommendation | ✅ Done (`recommend_action` tool) |
| 1.6 | Devil's Advocate Lateral Provocation Techniques | Pending |

---

## Epic 2: Strategic Pathways with Sub-Persona Weighting

### Epic Goal
Implement three distinct pathways that guide users through 10-30 minute strategic sessions, each with pathway-specific sub-persona weighting.

### Status: Partial (via agent-native tools)

Pathway weights and routing are implemented in the sub-persona system. Dynamic mode shifting works via `switch_persona_mode` tool. Session progression controlled via `complete_phase` tool.

| Story | Title | Status |
|-------|-------|--------|
| 2.1 | Pathway Selection & Sub-Persona Weight Config | ✅ Done (weights in mary-persona.ts) |
| 2.2 | "New Idea" Pathway (Higher Encouragement) | ✅ Done |
| 2.3 | "Business Model" Pathway (Higher Challenge) | ✅ Done |
| 2.4 | "Feature Refinement" Pathway (Balanced Realism) | ✅ Done |
| 2.5 | Dynamic Mode Shifting Within Session | ✅ Done (`switch_persona_mode`) |
| 2.6 | Cognitive Framework Alignment | Pending |
| 2.7 | Value Articulation Prompts | Pending |

---

## Epic 3: Polished Output Generation & Export

### Status: Core Complete

| Story | Title | Status |
|-------|-------|--------|
| 3.1 | Lean Canvas Generator | ✅ Done (`generate_document` tool) |
| 3.2 | PRD/Spec Generator | ✅ Done (`generate_document` tool) |
| 3.3 | PDF Export with Professional Formatting | ✅ Done (@react-pdf/renderer) |
| 3.4 | Viability Score Integration | ✅ Done (`recommend_action` tool) |
| 3.5 | Assumption Tracking in Export | Pending |
| 3.6 | HTML Presentation Export | Post-MVP |
| 3.7 | Low-Fi Visual Generation | Post-MVP |

---

## Epic 4: Monetization & Payment Infrastructure

### Status: Infrastructure Ready, Activation Pending

| Story | Title | Status |
|-------|-------|--------|
| 4.1 | 10-Message Trial Gate | ❌ Pending (currently 5 messages) |
| 4.2 | Lifetime Deal Implementation | Pending |
| 4.3 | Credit System Foundation | ✅ Done (DB schema + Stripe) |
| 4.4 | Subscription Tiers | Post-LTD |
| 4.5 | BYOK Tier | Future |

---

## Epic 5: Market Validation & Analytics Platform

### Status: Not Started (Phase 3 after revenue)

Stories 5.1-5.5 remain as planned. Will execute after initial traction validates core methodology.

---

## Epic 6: Agent-Native Architecture ✅ COMPLETE

### Epic Goal
Transform Mary from a prompt-response chatbot into an autonomous agent with tools for session control, capability discovery, and document generation.

### Status: All Phases Complete

| Phase | Title | Status |
|-------|-------|--------|
| Phase 1 | Workspace Context Builder | ✅ Done |
| Phase 2 | Dynamic Context Enrichment | ✅ Done (context-builder.ts) |
| Phase 3 | Tool Calling Infrastructure | ✅ Done (9 tools, agentic loop) |
| Phase 4 | Atomic Session Primitives | ✅ Done (session-primitives.ts) |
| Phase 5 | Capability Discovery System | ✅ Done (capability-discovery.ts) |

**Sub-Persona Wiring (via Epic 6):**

| Story | Title | Status |
|-------|-------|--------|
| 6.1 | Wire Sub-Persona to Claude API | ✅ Done (via tool system) |
| 6.2 | Dynamic Mode Shifting | ✅ Done (`switch_persona_mode` tool) |
| 6.3 | Kill Recommendation System | ✅ Done (`recommend_action` tool) |
| 6.4 | Output Polish (Lean Canvas + PRD) | ✅ Done (`generate_document` tool) |
| 6.5 | 10-Message Trial Gate | ❌ Pending |
| 6.6 | Mode Indicator UI | ❌ Pending |

---

## Beta Launch Work ✅ COMPLETE

Separate from epic structure, this work was executed via the Beta Launch milestone:

| Component | Status |
|-----------|--------|
| Auth fix (deprecated auth-helpers → @supabase/ssr) | ✅ Done |
| Beta access control (waitlist, JWT, approval) | ✅ Done |
| Error/loading states (skeletons, retry, error display) | ✅ Done |
| Design system (Wes Anderson palette) | ✅ Done |
| MDX blog (2 articles) | ✅ Done |

---

## Future: Executive Tier Expansion

### Epic Goal
Expand from entry-tier validation sessions to executive-tier strategy stress-testing with premium pricing.

### Planned Work
- Executive session framing and prompt engineering
- $150-300/session Stripe products
- Consultant channel (they use it with clients)
- Premium output templates for board presentations
- Case studies and social proof for executive audience

---

## Epic Development Priority & Dependencies

### Implementation Sequence (Updated Feb 2026)

**Completed:** Epic 0 → Epic 6 → Beta Launch → Epic 1 (partial) → Epic 2 (partial) → Epic 3 (partial)

**Current:** Remaining MVP items (10-message gate, tool mode UI, mode indicator)

**Next:** Epic 4 (monetization activation) → Executive Tier Expansion

**Future:** Epic 5 (analytics after traction)

### 90-Day Success Metrics

| Metric | Target | What it means |
|--------|--------|---------------|
| **Acquisition** | 100 signups | Enough volume to validate funnel |
| **Activation** | 50% complete session + output | 50 people get real value |
| **Revenue** | $2,000 | ~10-15 LTDs (proves willingness to pay) |
| **Retention** | 75% return for 2nd session | Methodology is working |

### Post-MVP Backlog

- User-triggered mode control (explicit sub-persona selection)
- HTML presentation export
- Low-fi visual generation (Excalidraw-style)
- Canvas workspace integration (nice-to-have, not critical)
- Executive tier pricing and positioning
