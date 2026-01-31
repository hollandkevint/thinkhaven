# Requirements

## AI Product Coaching Platform Requirements

### Core Coaching Session Management
- **FR-AC1:** System shall provide choose-your-adventure session initiation with three primary pathways:
  - "I have a brand new idea" (creative expansion and market positioning)
  - "I'm stuck on a business model problem" (revenue streams, customer segments, value propositions)  
  - "I need to refine a feature" (user needs and business goals analysis)
- **FR-AC2:** System shall implement 30-minute structured coaching sessions with transparent time management
- **FR-AC3:** System shall provide transparently adaptive AI persona that explains its coaching style evolution
- **FR-AC4:** System shall generate exportable business frameworks (Lean Canvas, Business Model Canvas, etc.)
- **FR-AC5:** System shall support session pause/resume with full context preservation

### AI Coaching Intelligence

#### Sub-Persona System (Core Differentiator)
- **FR-AC6:** System shall implement four coaching modes in every session: Inquisitive, Devil's Advocate, Encouraging, Realistic
- **FR-AC7:** System shall weight modes by pathway type:
  - New Idea: Inquisitive 40%, Devil's Advocate 20%, Encouraging 25%, Realistic 15%
  - Business Model: Inquisitive 20%, Devil's Advocate 35%, Encouraging 15%, Realistic 30%
  - Feature Refinement: Inquisitive 25%, Devil's Advocate 30%, Encouraging 15%, Realistic 30%
- **FR-AC7a:** Pathway modes shall align with cognitive frameworks:
  - New Idea pathway: "Thinking about Value" (JTBD, Value Prop Canvas techniques)
  - Business Model pathway: "Thinking through Constraints" (Assumption Testing, Feasibility Matrix)
  - Feature Refinement pathway: "Thinking with People" (Co-Design, Research Synthesis)
- **FR-AC8:** System shall dynamically shift between modes based on user responses:
  - User defensive → shift to Encouraging before returning to challenge
  - User overconfident → lean into Devil's Advocate
  - User spinning → bring in Realistic to ground
- **FR-AC8a:** Devil's Advocate mode shall use lateral provocation techniques:
  - Provocation (PO): Deliberately provocative statements to break patterns
  - Reversal: Invert assumptions ("What if the opposite were true?")
  - Challenge: "Why is this done this way?"
  - Dominant Idea Escape: "What assumption does everyone share?"
- **FR-AC9:** System shall surface explicit mode control options after ~10 exchanges ("Challenge me" / "Be realistic" / "Help me explore")

#### Kill Decision Framework
- **FR-AC10:** System shall implement escalating honesty about weak ideas:
  1. Diplomatic flags: "I see some significant risks here..."
  2. Deeper probe: "Let me challenge this assumption..." (chance to defend/pivot)
  3. Explicit recommendation: "I don't think you should pursue this because..."
  4. Kill score: Viability rating with clear reasoning
- **FR-AC11:** System shall earn the right to kill by exploring and challenging first, never dismissing early

#### Output Generation
- **FR-AC12:** System shall synthesize session insights into Lean Canvas format
- **FR-AC13:** System shall generate PRD/Spec documents suitable for dev handoff
- **FR-AC14:** System shall maintain coaching quality across diverse industries and user sophistication levels

### Export & Integration Capabilities
- **FR-AC15:** System shall export final reports as PDF with professional formatting
- **FR-AC16:** System shall integrate with Notion API for direct workspace export (post-MVP)
- **FR-AC17:** System shall provide Airtable integration for structured data export (post-MVP)
- **FR-AC18:** System shall support email delivery of session summaries and frameworks (post-MVP)
- **FR-AC19:** System shall enable sharing of completed frameworks via unique URLs

### Trial Experience
- **FR-AC20:** Guest trial shall allow 10 messages before conversion gate (up from 5)
- **FR-AC21:** Trial shall provide partial output at gate (value first, then ask for signup)
- **FR-AC22:** Trial session shall be preserved and migrate to user account on signup

### Assumption & Value Tracking
- **FR-AC23:** System shall track and surface assumptions made during session:
  - Assumptions logged with source statement
  - Testability rating (1-5) for each assumption
  - Export assumptions list with PRD/Spec output
  - Devil's Advocate mode specifically targets low-testability assumptions
- **FR-AC24:** System shall include mid-session value articulation checkpoint:
  - Prompt user to describe solution value without technology references
  - Prompt user to describe expected behavior change from their intervention
  - Use responses to calibrate remaining session direction

## Strategic Workspace Foundation Requirements (Existing)

### Dual-Pane Strategic Thinking Interface
- **FR1:** System shall provide split-screen interface: conversational coaching (left pane) + visual canvas (right pane)
- **FR2:** System shall enable seamless context sharing between chat and canvas - ideas from conversation auto-populate visual elements
- **FR3:** System shall support real-time wireframing with basic shapes, annotations, and user flow diagrams
- **FR4:** System shall integrate Mermaid.js for workflow diagrams, decision trees, and process visualization
- **FR5:** System shall allow canvas exports (PNG, SVG) and Mermaid code sharing for external use
- **FR6:** System shall maintain visual workspace state synchronized with conversational context

### Claude Sonnet 4 AI Integration (Critical Gap)
- **FR7:** System shall integrate Claude Sonnet 4 API with streaming responses replacing hardcoded simulation
- **FR8:** System shall implement real-time conversation management with context preservation across session
- **FR9:** System shall provide <2s response time for AI interactions with proper error handling
- **FR10:** System shall maintain conversation history with intelligent context window management
- **FR11:** System shall support concurrent user sessions without context bleeding between users

### Adaptive AI Coaching Implementation  
- **FR12:** System shall implement "Choose-Your-Adventure" session initiation with 3+ pathways (new idea, business model, feature refinement)
- **FR13:** System shall transparently adapt persona based on user responses and session evolution (Mary → Strategic Advisor → Innovation Coach)
- **FR14:** System shall provide structured 30-minute session framework with phase progression tracking
- **FR15:** System shall maintain coaching context and adapt questioning strategies based on user engagement patterns
- **FR16:** System shall enable session pause/resume functionality with state preservation

### BMad Method Framework Integration
- **FR17:** System shall implement core BMad Method templates: brainstorming, project brief, market research, competitive analysis
- **FR18:** System shall provide interactive elicitation system with numbered response options (1-9 format)
- **FR19:** System shall track session progress through BMad Method phases (Context → Exploration → Analysis → Action Planning)
- **FR20:** System shall generate exportable strategic outcomes and action plans from sessions
- **FR21:** System shall allow users to save and resume strategic thinking workflows across multiple sessions

### User Management & Authentication
- **FR22:** System shall maintain existing Supabase authentication without breaking current user flows
- **FR23:** System shall provide user workspace management with session organization
- **FR24:** System shall support user preferences and coaching style customization
- **FR25:** System shall enable sharing of strategic outputs and collaborative workspace access

## Non-Functional Requirements

### Performance & Scalability
- **NFR1:** Claude API integration must achieve <2s response time for 95% of requests
- **NFR2:** System must handle 10+ concurrent users per instance without performance degradation
- **NFR3:** Database queries must complete within 500ms for session data retrieval
- **NFR4:** Canvas rendering must maintain 60fps during user interactions
- **NFR5:** System must support WebSocket connections for real-time collaboration features

### Reliability & Availability
- **NFR6:** System shall maintain >95% uptime with proper error handling and recovery
- **NFR7:** Claude API failures must gracefully fallback with user notification and retry mechanisms
- **NFR8:** Session data must be persisted with automatic save every 30 seconds
- **NFR9:** System must handle network interruptions with automatic reconnection
- **NFR10:** All user data must be backed up with <1 hour recovery point objective

### Security & Privacy
- **NFR11:** All Claude API communications must use secure HTTPS/WSS protocols
- **NFR12:** User session data must be encrypted at rest and in transit
- **NFR13:** System must implement proper authentication token management with expiration
- **NFR14:** User workspace data must be isolated with row-level security
- **NFR15:** System must comply with data privacy requirements for strategic business content

### Usability & User Experience  
- **NFR16:** Interface must be responsive and work on desktop, tablet, and mobile devices
- **NFR17:** System must support keyboard shortcuts for power users and accessibility
- **NFR18:** Loading states must provide clear feedback for AI processing and canvas operations
- **NFR19:** Error messages must be user-friendly and actionable
- **NFR20:** System must support browser back/forward navigation without data loss

## Compatibility Requirements

### Existing System Integration
- **CR1:** Enhancement must maintain existing Supabase authentication and user management without breaking current functionality
- **CR2:** New Claude integration must work with existing database schema without requiring destructive migrations
- **CR3:** UI changes must maintain consistency with existing design patterns and component libraries
- **CR4:** API changes must be backward compatible with existing frontend components and state management

### Technology Stack Compatibility
- **CR5:** Claude Sonnet 4 integration must work within existing Next.js 15 and React 19 architecture
- **CR6:** New features must be compatible with existing Turbopack build system and development workflow
- **CR7:** Database changes must be compatible with existing Supabase configuration and RLS policies
- **CR8:** Canvas functionality must integrate with existing CSS framework and responsive design

### Browser & Device Compatibility
- **CR9:** System must work on Chrome, Firefox, Safari, and Edge browsers (latest 2 versions)
- **CR10:** Mobile experience must work on iOS Safari and Android Chrome
- **CR11:** System must degrade gracefully on older browsers with reduced functionality
- **CR12:** Accessibility features must work with screen readers and assistive technologies