# Architecture

**Analysis Date:** 2026-01-29

## Pattern Overview

**Overall:** Agent-native, layered architecture with agentic tool execution at the core

**Key Characteristics:**
- Multi-layered separation: API routes → Session orchestration → BMad Method engine → AI agent
- Agent-controlled session progression via 9 composable tools
- Atomic session primitives enable deterministic, testable state management
- Real-time capability discovery allows Mary (AI) to discover available actions at runtime
- Credit-based monetization integrated at session creation layer
- Streaming AI responses with embedded tool execution loops

## Layers

**API Layer:**
- Purpose: Next.js route handlers receiving HTTP requests
- Location: `apps/web/app/api/`
- Contains: Streaming chat endpoints, session operations, checkout, monitoring
- Depends on: Session orchestrator, credit manager, Supabase client
- Used by: Browser clients, frontend components
- Key files: `/chat/stream/route.ts`, `/bmad/route.ts`, `/checkout/idea-validation/route.ts`

**Session Orchestration Layer:**
- Purpose: Central session lifecycle manager with credit system integration
- Location: `apps/web/lib/bmad/session-orchestrator.ts`
- Contains: Session initialization, phase advancement, template execution
- Depends on: Database, credit manager, pathway router, template engine
- Used by: API routes, session primitives
- Pattern: Bundles multiple operations (create + deduct credit + load template)

**Session Primitives Layer (Phase 4):**
- Purpose: Atomic, agent-controlled operations for session state
- Location: `apps/web/lib/bmad/session-primitives.ts`
- Contains: `createSessionRecord()`, `loadSessionState()`, `completePhase()`, `recordInsight()`
- Depends on: Supabase client, credit manager
- Used by: Tool executor, session orchestrator
- Pattern: Explicit, composable functions vs bundled operations

**BMad Method Engine:**
- Purpose: Strategic pathway execution framework
- Location: `apps/web/lib/bmad/`
- Contains: Pathway definitions, phase logic, document generators, analysis frameworks
- Key subsystems:
  - `pathway-router.ts`: Maps pathway types to their configurations
  - `template-engine.ts`: Loads and executes phase templates
  - `capability-discovery.ts`: Runtime discovery of pathways, actions, documents
  - `generators/`: Document generators (Lean Canvas, Product Brief, Feature Brief, etc.)
  - `analysis/`: Domain-specific analysis (Market Positioning, etc.)
- Depends on: Database, AI client
- Used by: Session orchestrator, API routes

**AI Integration Layer:**
- Purpose: Claude API integration with tool calling and persona management
- Location: `apps/web/lib/ai/`
- Contains: Claude client, streaming, persona system, tool execution
- Key subsystems:
  - `claude-client.ts`: Anthropic SDK wrapper with tool support
  - `mary-persona.ts`: Coaching persona with 4 sub-modes (Inquisitive, Devil's Advocate, Encouraging, Realistic)
  - `tool-executor.ts`: Routes and executes Mary's 9 tools
  - `tools/`: Tool implementations (discovery, session, document generation)
  - `context-builder.ts`: Dynamic system prompt enrichment
  - `conversation-persistence.ts`: Database persistence for chat history
- Depends on: Anthropic SDK, Supabase, BMad engine
- Used by: API routes, components

**Tool System (Agent-Native):**
- Purpose: Enable Mary to control session progression and discovery
- Location: `apps/web/lib/ai/tools/`
- Tools (9 total):
  1. `discover_pathways` - List available strategic pathways
  2. `discover_phase_actions` - Actions available in current phase
  3. `discover_document_types` - Available document generators
  4. `read_session_state` - Get current session phase/progress
  5. `complete_phase` - Signal phase completion and advance
  6. `switch_persona_mode` - Change coaching mode dynamically
  7. `recommend_action` - Provide viability recommendation (proceed/pivot/kill)
  8. `generate_document` - Generate Lean Canvas, PRD, briefs
  9. `update_session_context` - Record insights for later use
- Pattern: Agentic loop in `/api/chat/stream` with max 5 tool rounds per message

**Monetization Layer:**
- Purpose: Credit-based session access control
- Location: `apps/web/lib/monetization/`
- Contains: Credit operations, Stripe integration, purchase history
- Key files: `credit-manager.ts`, `stripe-service.ts`
- Pattern: Row-level locking prevents race conditions on credit deduction
- Depends on: Supabase, Stripe SDK

**Database Layer:**
- Purpose: Persistent storage for sessions, conversations, credits, users
- Location: Supabase (Postgres via migrations in `apps/web/supabase/migrations/`)
- Key tables: `bmad_sessions`, `conversations`, `messages`, `user_credits`, `credit_transactions`, `user_workspace`
- Pattern: Sequential migrations (001 → 011), atomic transaction support

**Auth Layer:**
- Purpose: User authentication and session management
- Location: `apps/web/lib/auth/`
- Pattern: Context-based auth (AuthProvider wraps entire app)
- Contains: OAuth callback, Supabase client initialization
- Middleware: Disabled (Edge Runtime incompatibility) - auth handled via API routes

**Canvas/Export System:**
- Purpose: Visual workspace and output generation
- Location: `apps/web/lib/canvas/` and `apps/web/lib/export/`
- Contains: tldraw integration, PDF generation, Markdown/JSON export
- Depends on: @react-pdf/renderer, tldraw SDK
- Used by: Workspace components

## Data Flow

**New Session Creation:**
1. User submits pathway selection → `/app/app/new` (component)
2. Component calls `/api/bmad` with pathway selection
3. API checks user credits via `hasCredits()`
4. `SessionOrchestrator.initializeSession()` creates session record
5. `deductCredit()` atomically deducts 1 credit (with row locking)
6. If deduction fails, session creation is rolled back
7. Session object returned to UI, user navigated to `/app/session/[id]`

**Chat Message Processing (Agentic Loop):**
1. User types message in chat component
2. Component calls `/api/chat/stream` with message + conversation history
3. API increments message counter, checks guest message limit
4. `executeAgenticLoop()` starts:
   - Builds conversation with history
   - Calls `claudeClient.sendMessageWithTools()` with Mary's 9 tools
   - If response has tool calls (stopReason = 'tool_use'):
     - Loop (max 5 rounds):
       - Extract tool calls from response
       - Route to `ToolExecutor.executeAll()` for parallel execution
       - Convert results to Claude `tool_result` content blocks
       - Send results back to Claude with accumulated context
       - Get new response (may have more tool calls or final text)
   - Accumulate all text responses
5. Final accumulated text streamed back to client
6. UI updates canvas/chat with response

**Session State Persistence:**
1. During chat, Mary may use `update_session_context` tool
2. Tool calls `recordInsight()` → database INSERT
3. Later, when generating documents, `getSessionInsights()` retrieves stored insights
4. Document generators use insights + conversation history to build outputs

## State Management

**Session State:**
- Stored in: `bmad_sessions` table
- Structure: `{ id, userId, workspaceId, pathway, currentPhase, currentTemplate, status, overallCompletion, ... }`
- Updated via: `persistSessionState()` primitive
- Phase order: Defined in `PHASE_ORDER` constant (source of truth)

**Persona State (Sub-Persona Mode):**
- Stored in: `SubPersonaSessionState` object, persisted to conversation context
- Modes: Inquisitive, Devil's Advocate, Encouraging, Realistic
- Mode distribution: Different per pathway (New Idea: 40% Inquisitive, etc.)
- Dynamic shifting: AI detects user state (defensive, overconfident, spinning) and auto-adjusts

**Credit State:**
- Stored in: `user_credits` table (balance) + `credit_transactions` table (audit trail)
- Operations: Atomic via `deduct_credit_transaction()` with row-level SELECT...FOR UPDATE
- Idempotency: Stripe webhook idempotency keys prevent duplicate credits

**Conversation State:**
- Stored in: `conversations` + `messages` tables
- Structure: Message array with role/content, user ID, workspace ID, timestamp
- Indexed by: userId, workspaceId for fast retrieval

## Key Abstractions

**BmadSession:**
- Represents entire strategic journey through BMad Method
- Encapsulates pathway, phase progression, outputs
- Location: `apps/web/lib/bmad/types.ts`

**BmadPathway:**
- Represents a strategic journey type (New Idea, Business Model, Feature Refinement, etc.)
- Includes phase sequence, templates, expected outcomes
- Location: `apps/web/lib/bmad/pathways/`

**BmadTemplate:**
- Represents a phase's structure and elicitation questions
- Contains question sequences, branching logic
- Location: `apps/web/lib/bmad/templates/`

**CoachingContext:**
- Encapsulates Mary's current state: persona mode, user detections, session progress
- Used to customize Claude system prompt at request time
- Location: `apps/web/lib/ai/mary-persona.ts`

**Tool (Agentic):**
- Represents action Mary can take (discovery, session control, generation)
- Schema: name, description, input parameters, output format
- Location: `apps/web/lib/ai/tools/index.ts` (MARY_TOOLS array)

**GeneratedDocument:**
- Output artifact from generators (Lean Canvas, Product Brief, etc.)
- Format: Structured JSON with sections, can be exported to PDF/Markdown
- Location: `apps/web/lib/bmad/generators/`

## Entry Points

**Web Application Root:**
- Location: `apps/web/app/layout.tsx`
- Triggers: Browser navigation to https://thinkhaven.co
- Responsibilities: Bootstrap providers (Auth, Workspace), load fonts, set metadata

**Landing Page:**
- Location: `apps/web/app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Display hero, pricing, CTAs; redirect authenticated users to `/app`

**Protected Dashboard:**
- Location: `apps/web/app/app/page.tsx` (redirects to `/app`)
- Triggers: Navigation to `/app`
- Responsibilities: List user's sessions, "New Session" CTA
- Auth: Requires login (checked by useAuth hook)

**Session Workspace:**
- Location: `apps/web/app/app/session/[id]/page.tsx`
- Triggers: User clicks into session or navigates to `/app/session/[id]`
- Responsibilities: Load session, display chat + canvas, handle exports
- Auth: Requires login + session ownership validation

**Guest Chat (Trial):**
- Location: `apps/web/app/try/page.tsx`
- Triggers: Navigation to `/try`
- Responsibilities: Allow 5 messages without login, collect feedback, show signup modal
- Storage: localStorage (guest-session-store)

**New Session Creation:**
- Location: `apps/web/app/app/new/page.tsx`
- Triggers: User clicks "New Session"
- Responsibilities: Pathway selection, credit check, session initialization
- Auth: Requires login + sufficient credits

**Chat API - Streaming:**
- Location: `apps/web/app/api/chat/stream/route.ts`
- Triggers: POST from chat component with message
- Responsibilities: Stream Claude response with embedded tool execution
- Auth: Bearer token validation via Supabase

**Chat API - Guest:**
- Location: `apps/web/app/api/chat/guest/route.ts`
- Triggers: POST from guest chat component
- Responsibilities: Stream response, enforce 5-message limit
- Auth: None required

## Error Handling

**Strategy:** User-friendly error transformation with actionable guidance

**Patterns:**
- `BmadErrorHandler.handleError()` categorizes errors (database, network, session, validation, API)
- Each category returns `UserFriendlyError` with title, message, actionable steps, severity
- Retryable errors suggest automatic retry; non-retryable show support contact
- Database errors trigger logging to monitoring system via `error-monitor.ts`
- Network errors checked via `service-status.ts` (checks Anthropic, Supabase availability)

**Example flow:**
```
Raw error → BmadErrorHandler.handleError(error, context)
→ Categorize (isNetworkError, isDatabaseError, etc.)
→ Create UserFriendlyError with guidance
→ Log to monitoring (if high severity)
→ Return to user
```

## Cross-Cutting Concerns

**Logging:**
- Framework: Console logs with structured metadata
- Pattern: `console.log('[Module] Message', { context })`
- Monitoring: `error-monitor.ts` centralizes error tracking
- Location: `apps/web/lib/bmad/error-monitor.ts`

**Validation:**
- Pattern: Input validation at API routes before reaching business logic
- Type safety: TypeScript interfaces enforce contract validation
- Example: `DiscoverPhaseActionsInput` in tool definitions

**Authentication:**
- Pattern: Bearer token from Supabase auth header
- Enforcement: `AuthContext` provides user in components; API routes call `createClient()`
- Session: Managed by Supabase auth state subscription

**Rate Limiting:**
- Message limits: `message-limit-manager.ts` tracks guest messages (5-message trial)
- Tool execution: Max 5 agentic loops per message to prevent infinite loops
- Database: Row-level locking on credit operations (SELECT...FOR UPDATE)

**Telemetry:**
- Auth events: Tracked in `auth-logger.ts` (success/failure, provider, timestamp)
- API monitoring: Response times, error rates
- Location: `apps/web/lib/monitoring/`

---

*Architecture analysis: 2026-01-29*
