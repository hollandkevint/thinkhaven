# Epic Structure

## Epic Approach

**Epic Structure Decision:** **Foundation + Enhancement Epics** with strategic priority alignment

The epic structure has been updated to align with the January 2026 strategic direction. The highest leverage work is **sub-persona system + polished output**. If users feel encouraged AND challenged, if they feel pressure-testing was useful and invigorating, if they want to do it again and feel more confident in building - everything else follows.

**Strategic Priority:**
1. Sub-persona balancing (all four modes, weighted by pathway)
2. Anti-sycophancy / kill recommendation logic
3. Full output polish (Lean Canvas, PRD/Spec)
4. 10-message trial gate

**Rationale:**
- Core value is methodology enforcement + genuine pushback + polished outputs
- Canvas/visual workspace is post-MVP (nice-to-have, not critical)
- Text outputs carry the core value proposition

## Epic 0: Google Authentication Foundation

### Epic Goal
Replace the broken Vercel-Supabase OAuth integration with Google's pre-built signin system, providing seamless Google-first authentication, cost controls, and scalable user management foundation.

### Epic Value Proposition
**For Users:** Familiar, reliable Google signin without redirect loops or authentication failures
**For Business:** Unblocks all feature development and establishes user acquisition foundation  
**For Development:** Simplified authentication architecture with fewer failure points

### Epic Acceptance Criteria
1. **Google One-Tap Signin:** Users can authenticate using Google's pre-built signin interface
2. **Session Persistence:** User sessions reliably maintained across browser sessions
3. **Cost Controls Ready:** User account foundation supports downstream monetization features
4. **Zero Redirect Loops:** Complete elimination of ERR_TOO_MANY_REDIRECTS errors
5. **Production Stable:** 95%+ authentication success rate in production environment

### Story Breakdown

#### **Story 0.1: Remove Complex OAuth Middleware** ✅ *Ready for Development*
*As a* platform developer,
*I want* to remove the complex Vercel middleware and OAuth callback routes causing redirect loops,
*so that* we have a clean foundation for implementing Google's simplified authentication approach.

#### **Story 0.2: Implement Google Pre-built Signin** ✅ *Ready for Development*
*As a* user wanting to access Thinkhaven,
*I want* to authenticate using Google's familiar One-Tap signin interface,
*so that* I can quickly and reliably access my strategic thinking workspace without authentication errors.

#### **Story 0.3: Update Supabase Configuration for ID Token Flow** ✅ *Ready for Development*
*As a* platform developer,
*I want* Supabase configured to accept Google ID tokens through signInWithIdToken flow,
*so that* user authentication integrates seamlessly with our existing database and user management system.

#### **Story 0.4: Authentication Testing & Validation** ✅ *Ready for Development*
*As a* platform stakeholder,
*I want* comprehensive testing of the new authentication flow across all environments,
*so that* we can confidently deploy without regression and ensure 95%+ authentication success rate.

---

## Epic 1: Claude AI Integration & Decision Accelerator Platform

### Epic Goal
Transform the existing foundation into a fully functional **decision accelerator** powered by Claude, enabling real-time AI conversations with sub-persona balancing, anti-sycophancy features, and 10-30 minute structured strategic sessions.

### Epic Value Proposition
**For Users:** A strategic thinking partner that provides genuine pushback, not just validation
**For Business:** Enable user acquisition with differentiated methodology (not a Claude wrapper)
**For Development:** Establish AI integration patterns with sub-persona architecture

### Epic Acceptance Criteria
1. **Claude Integration Complete:** Real AI responses with streaming
2. **Sub-Persona System:** All four modes (Inquisitive, Devil's Advocate, Encouraging, Realistic) active
3. **Session Duration:** 10-30 minute sessions with structured progression
4. **Performance Standards Met:** <2s response times and >95% reliability achieved
5. **Production Ready:** System deployed with anti-sycophancy behavior

### Story Breakdown

#### **Story 1.1: Fix Session Creation Database Failures** ✅ *Ready for Development*
*As a* user attempting to use the BMad Method,
*I want* session creation to work reliably without database errors,
*so that* I can successfully complete strategic thinking workflows without encountering "Unknown error" failures.

#### **Story 1.2: Improve User Interface State Management** ✅ *Ready for Development*  
*As a* user switching between Mary Chat and BMad Method interfaces,
*I want* my initial input and session state to be preserved seamlessly,
*so that* I don't lose my strategic thinking context when navigating between different interaction modes.

#### **Story 1.3: Enhance User Experience Error Handling** ✅ *Ready for Development*
*As a* user engaging with the BMad Method strategic framework,
*I want* clear guidance, actionable feedback, and graceful error recovery,
*so that* I can maintain productive strategic thinking sessions even when issues occur.

#### **Story 1.4: Sub-Persona System Implementation** ✅ *Ready for Development*
*As a* user seeking strategic guidance,
*I want* an AI partner that balances encouragement with genuine challenge,
*so that* I feel pressure-tested and confident, not just validated.

#### **Story 1.5: Anti-Sycophancy & Kill Recommendation** ✅ *Ready for Development*
*As a* user with a potentially weak idea,
*I want* honest feedback including kill recommendations when warranted,
*so that* I don't waste time building the wrong thing.

#### **Story 1.6: Devil's Advocate Lateral Provocation Techniques** ✅ *Ready for Development*
*As a* user receiving Devil's Advocate mode feedback,
*I want* Mary to use specific lateral thinking techniques (Provocation, Reversal, Challenge, Dominant Idea Escape) to challenge my assumptions,
*so that* I break out of confirmation bias and discover blind spots in my thinking.

**Techniques:** Provocation (PO), Reversal, Challenge, Dominant Idea Escape
**Ref:** `docs/stories/story-devils-advocate-techniques.md`

### Integration Requirements

**Sub-Persona Architecture:**
- Four modes: Inquisitive, Devil's Advocate, Encouraging, Realistic
- Pathway-weighted defaults (set at session start based on pathway selection)
- Dynamic shifting (AI reads the moment and adjusts)
- User control (after ~10 exchanges, surface explicit options) - post-MVP

**Kill Decision Framework:**
- Escalation sequence: diplomatic flags → deeper probe → explicit recommendation → kill score
- Mary earns the right to kill an idea by doing the work first

**API Integration Strategy:**
- Claude API with streaming responses
- System prompts include sub-persona weights and current mode
- Context injection for pathway-specific behavior

**Testing Integration Strategy:**
- Unit tests for sub-persona mode selection
- Integration tests for kill recommendation triggers
- End-to-end tests for complete session workflows

---

## Epic 2: Strategic Pathways with Sub-Persona Weighting

### Epic Goal
Implement three distinct pathways that guide users through 10-30 minute strategic sessions, each with pathway-specific sub-persona weighting that adjusts the balance of challenge vs. encouragement.

### Epic Value Proposition
**For Users:** Clear path selection with appropriate challenge level based on their specific need
**For Business:** Improved engagement through personalized experiences with enforced methodology
**For Platform:** Differentiated methodology that can't be DIYed with plain ChatGPT

### Epic Acceptance Criteria
1. **Pathway Selection Interface:** Users can choose from 3 pathways with clear descriptions
2. **Pathway-Specific Weights:** Each pathway has different sub-persona mode distributions
3. **Session Duration:** 10-30 minute sessions (enforced, not suggested)
4. **Progress Tracking:** Users see clear progress indicators throughout their chosen pathway
5. **Pathway Completion:** Each pathway produces Lean Canvas and/or PRD/Spec outputs

### Story Breakdown

#### **Story 2.1: Pathway Selection & Sub-Persona Weight Configuration**
*As a* user with a business idea challenge,
*I want* to select a pathway that automatically configures sub-persona weights,
*so that* I receive appropriately balanced challenge and encouragement.

**Sub-Persona Weights by Pathway:**
| Mode | New Idea | Business Model | Feature Refinement |
|------|----------|----------------|-------------------|
| Inquisitive | 40% | 20% | 25% |
| Devil's Advocate | 20% | 35% | 30% |
| Encouraging | 25% | 15% | 15% |
| Realistic | 15% | 30% | 30% |

#### **Story 2.2: "New Idea" Pathway (Higher Encouragement)**
*As a* entrepreneur with a brand new business idea,
*I want* more encouragement early while still getting pushback on weak assumptions,
*so that* I can develop my raw concept with confidence.

#### **Story 2.3: "Business Model" Pathway (Higher Challenge)**
*As a* user stuck on monetization challenges,
*I want* systematic challenge of revenue assumptions and business model weaknesses,
*so that* I can identify and fix fundamental model problems.

#### **Story 2.4: "Feature Refinement" Pathway (Balanced Realism)**
*As a* product manager needing to validate a feature,
*I want* realistic assessment of feasibility alongside user need validation,
*so that* I can make confident decisions about feature development.

#### **Story 2.5: Dynamic Mode Shifting Within Session**
*As a* user progressing through any pathway,
*I want* the AI to dynamically shift modes based on my state,
*so that* I get encouragement when defensive and challenge when overconfident.

#### **Story 2.6: Cognitive Framework Alignment** ✅ *Ready for Development*
*As a* user selecting a strategic pathway,
*I want* the AI coaching approach to align with the cognitive mode required for my challenge,
*so that* I receive thinking techniques appropriate to my problem type.

**Cognitive Modes:**
- New Idea → "Thinking about Value" (JTBD, Value Prop Canvas)
- Business Model → "Thinking through Constraints" (Assumption Testing, Feasibility Matrix)
- Feature Refinement → "Thinking with People" (Co-Design, Research Synthesis)

**Ref:** `docs/stories/story-cognitive-framework-alignment.md`

#### **Story 2.7: Value Articulation Prompts** ✅ *Ready for Development*
*As a* user progressing through a strategic session,
*I want* Mary to naturally ask me to articulate my solution's value without technology references,
*so that* I clarify the core value proposition and expected behavior change.

**Approach:** Behavioral pattern in Mary's questioning, not formal UI checkpoint
**Ref:** `docs/stories/story-value-articulation-behavioral.md`

---

## Epic 3: Polished Output Generation & Export

### Epic Goal
Build the **output generation system** that transforms session insights into polished, portable documents (Lean Canvas, PRD/Spec) that users can take to their next tools.

### Epic Value Proposition
**For Users:** Tangible, professionally-formatted deliverables that travel to prototyping tools
**For Business:** Clear value justification - output is what users pay for
**For Market Position:** "High polish documents, low polish sketches" - differentiation from canvas-first tools

### Epic Acceptance Criteria
1. **Lean Canvas Generation:** Complete Lean Canvas populated from session insights
2. **PRD/Spec Generation:** Detailed working document suitable for dev handoff
3. **Professional Quality:** Export formatting meets business presentation standards
4. **PDF & Markdown:** Primary export formats with professional formatting
5. **Viability Score:** Include kill score / viability rating when applicable

### Story Breakdown

#### **Story 3.1: Lean Canvas Generator**
*As a* user completing a strategic session,
*I want* the AI to synthesize my insights into a complete Lean Canvas,
*so that* I have a pitch-ready framework I can share with stakeholders.

#### **Story 3.2: PRD/Spec Generator**
*As a* user ready to build,
*I want* a detailed PRD/Spec document generated from my session,
*so that* I can hand off to developers or use as a working reference.

#### **Story 3.3: PDF Export with Professional Formatting**
*As a* user needing polished deliverables,
*I want* to export documents as professionally formatted PDFs,
*so that* I can use them in investor presentations or team sharing.

#### **Story 3.4: Viability Score Integration**
*As a* user who received a kill recommendation,
*I want* my export to include the viability score and reasoning,
*so that* I have documentation of why the idea should be reconsidered.

#### **Story 3.5: Assumption Tracking in Export** ✅ *Ready for Development*
*As a* user exporting my session outputs,
*I want* key assumptions from my session to be captured and included in my PRD/Spec export,
*so that* I have a clear list of what needs validation before building.

**Scope:** Extract assumptions from conversation at export time (no UI during session)
**Ref:** `docs/stories/story-assumption-tracking-simplified.md`

### Post-MVP Outputs

#### **Story 3.6: HTML Presentation Export** (Post-MVP)
*As a* consultant presenting to clients,
*I want* a single-file HTML presentation generated from my session,
*so that* I have a shareable, professional presentation format.

#### **Story 3.7: Low-Fi Visual Generation** (Post-MVP)
*As a* user who needs visual diagrams,
*I want* Excalidraw-style sketches for workflows and concept maps,
*so that* I have thinking tools (not polished deliverables).

---

## Epic 4: Monetization & Payment Infrastructure

### Epic Goal
Implement a **phased monetization system** starting with Lifetime Deals for early adopters, then transitioning to subscription + credits for sustainable recurring revenue.

### Epic Value Proposition
**For Business:** Direct revenue generation with validated willingness-to-pay
**For Users:** Flexible payment options that match their usage patterns
**For Market:** Proves commercial viability of decision accelerator model

### Epic Acceptance Criteria
1. **Trial Flow:** 10 messages (up from current 5), partial output at gate
2. **LTD Phase:** $199-499 one-time payment for early adopters
3. **Subscription Phase:** Monthly access with session limits (post-LTD)
4. **Credit System:** Pay-as-you-go for overflow or light users (post-LTD)
5. **Payment Security:** Stripe integration with PCI compliance

### Story Breakdown

#### **Story 4.1: 10-Message Trial Gate**
*As a* first-time visitor,
*I want* 10 free messages with partial output at the gate,
*so that* I can experience real value before signing up.

#### **Story 4.2: Lifetime Deal Implementation**
*As an* early adopter interested in the platform,
*I want* to purchase lifetime access at $199-499,
*so that* I can lock in access and support the platform's development.

#### **Story 4.3: Credit System Foundation** (Post-LTD)
*As a* light user who needs occasional sessions,
*I want* to purchase session credits as needed,
*so that* I only pay for what I use.

#### **Story 4.4: Subscription Tiers** (Post-LTD)
*As a* frequent user needing regular strategic sessions,
*I want* monthly subscription options with predictable pricing,
*so that* I can access ongoing support with predictable costs.

#### **Story 4.5: BYOK Tier** (Future Consideration)
*As a* cost-conscious power user,
*I want* to bring my own Claude API key,
*so that* I can use the methodology with my own API costs.

---

## Epic 5: Market Validation & Analytics Platform

### Epic Goal
Build a **comprehensive validation and analytics system** that proves product-market fit for the AI Product Coaching Platform through systematic measurement of key assumptions, user behavior analysis, and iterative optimization based on real market feedback.

### Epic Value Proposition
**For Business:** Data-driven validation of $50K+ ARR potential with clear path to product-market fit
**For Product:** Evidence-based optimization of coaching effectiveness and user experience
**For Investment:** Concrete metrics proving market demand and sustainable unit economics

### Epic Acceptance Criteria
1. **Core Assumption Tracking:** Automated measurement of critical business model hypotheses
2. **User Behavior Analytics:** Deep insights into session completion, satisfaction, and retention patterns
3. **A/B Testing Infrastructure:** Systematic experimentation capability for pricing, features, and flows
4. **Competitive Intelligence:** Automated monitoring of AI coaching market and competitor moves  
5. **Market Validation Dashboard:** Real-time visibility into product-market fit indicators

### Story Breakdown

#### **Story 5.1: Business Model Assumption Testing Framework**
*As a* platform owner validating market assumptions,
*I want* automated tracking of key hypotheses (pricing acceptance, session completion rates, repeat usage),
*so that* I can make data-driven decisions about product-market fit with statistical confidence.

#### **Story 5.2: User Journey & Conversion Analytics**
*As a* product manager optimizing user experience,
*I want* detailed analytics on user journeys from first visit through paid conversion and retention,
*so that* I can identify and eliminate friction points that prevent users from realizing coaching value.

#### **Story 5.3: Session Quality & Effectiveness Measurement**
*As a* platform owner ensuring coaching quality,
*I want* systematic measurement of session outcomes, user satisfaction, and post-session behavior,  
*so that* I can continuously improve coaching effectiveness and prove value delivery to users.

#### **Story 5.4: Competitive Market Intelligence System**
*As a* strategic decision maker in competitive AI coaching market,
*I want* automated monitoring of competitor features, pricing changes, and market positioning,
*so that* I can maintain competitive advantages and respond quickly to market shifts.

#### **Story 5.5: A/B Testing & Optimization Infrastructure**
*As a* growth-focused platform owner,
*I want* systematic A/B testing capabilities for pricing models, coaching flows, and UI elements,
*so that* I can optimize conversion rates and user experience through evidence-based iteration.

---

## Epic Development Priority & Dependencies

### Implementation Sequence (Updated Jan 2026)

**Highest Leverage (Do First):** Sub-persona system + polished output
- If users feel encouraged AND challenged, everything else follows
- Enforced methodology + genuine pushback + polished outputs = core differentiator

**Phase 1 (MVP Foundation):** Epic 1 → Epic 2 → Epic 3
- Sub-persona system with pathway weights
- Anti-sycophancy and kill recommendation logic
- Lean Canvas + PRD/Spec output polish
- 10-message trial gate

**Phase 2 (Revenue):** Epic 4
- LTD launch for early adopters ($199-499)
- Transition to subscription + credits post-LTD

**Phase 3 (Optimization):** Epic 5
- Analytics and validation after initial traction
- A/B testing for pricing and conversion optimization

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