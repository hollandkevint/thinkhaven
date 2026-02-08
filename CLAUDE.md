# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

*Last Updated: 2026-01-19*

## Project Context
**ThinkHaven** - Decision accelerator that moves people from ideas and data to clear decisions through structured AI sessions
- **Positioning**: More structured than Claude, faster/cheaper than consultants, more strategic than Miro. Serves both idea validation (solo entrepreneurs) and decision architecture (executives stress-testing strategy before high-stakes meetings)
- **Core Value**: Enforced methodology + sub-persona balancing + anti-sycophancy + polished outputs + decision documentation
- **Tech Stack**: Next.js 15.5, React 19, TypeScript, Supabase, Stripe, Anthropic Claude
- **Architecture**: Monorepo with Next.js app in `apps/web/`
- **Deployment**: Vercel project `thinkhaven` (https://thinkhaven.co)

## Essential Commands

### Development
```bash
cd apps/web
npm run dev              # Start dev server (localhost:3000, uses Turbopack)
npm run build            # Production build
npm run build:prod       # Production build (alias)
npm run lint             # Run ESLint
```

### Testing
```bash
# Unit tests (Vitest)
npm test                 # Run unit tests in watch mode
npm run test:run         # Run unit tests once

# E2E tests (Playwright)
npm run test:e2e         # Run all E2E tests (7 smoke tests)
npm run test:e2e:ui      # Run E2E tests with UI
```

### Database Migrations
```bash
# Migrations are in apps/web/supabase/migrations/
# Run in order: 001 → 011 (sequential, never skip)
# Use Supabase dashboard or CLI to apply
# Latest: 011_add_sub_persona_state.sql
```

## Architecture Overview

### Core Systems

**BMad Method Engine** (`apps/web/lib/bmad/`)
- **session-orchestrator.ts**: Central session lifecycle manager with credit system integration
- **session-primitives.ts**: Atomic session operations (Phase 4) - create, load, persist, delete
- **capability-discovery.ts**: Runtime capability discovery (Phase 5) - pathways, actions, documents
- **pathway-router.ts**: Routes users to appropriate strategic pathways
- **template-engine.ts**: Loads and executes BMad templates
- **analysis/**: Domain-specific analysis frameworks (market positioning, pricing, revenue optimization)
- **pathways/**: Pathway implementations (new-idea-pathway, business-model-pathway, feature-input)
- **generators/**: Document generators (concept documents, lean canvas, feature briefs)

**AI Integration** (`apps/web/lib/ai/`)
- **claude-client.ts**: Anthropic Claude API integration with tool calling support
- **mary-persona.ts**: Mary AI business analyst persona definition
- **streaming.ts**: Server-sent events for real-time AI responses
- **context-manager.ts**: Manages session context and conversation history
- **context-builder.ts**: Dynamic context enrichment from database (Phase 2)
- **tool-executor.ts**: Executes Mary's tools and formats results for Claude
- **tools/index.ts**: Tool registry with 9 agent tools (discovery + session tools)
- **tools/discovery-tools.ts**: Pathway, phase action, and document type discovery
- **tools/document-tools.ts**: Document generation tool implementations
- **tools/session-tools.ts**: Session state management tool implementations
- **conversation-persistence.ts**: Database persistence for conversations

**Session Credit System** (`apps/web/lib/monetization/`)
- **credit-manager.ts**: Credit operations (balance, deduction, purchase)
- **stripe-service.ts**: Stripe integration for payments
- **Migration 005**: user_credits, credit_transactions, credit_packages, payment_history tables
- **Pricing**: Phase 1 LTD ($199-499), then Subscription + Credits
- **Atomic deductions**: Row-level locking prevents race conditions

**Canvas Workspace** (`apps/web/lib/canvas/`)
- **canvas-manager.ts**: Manages tldraw canvas instances with pooling
- **visual-suggestion-parser.ts**: Parses AI suggestions into Mermaid diagrams
- **canvas-export.ts**: Export to PNG (5 resolutions) and SVG with metadata
- **useCanvasSync.ts**: Bidirectional AI↔Canvas synchronization

**Authentication** (`apps/web/lib/auth/`)
- **AuthContext.tsx**: Simplified auth context (32% code reduction vs previous)
- **apps/web/app/auth/callback/route.ts**: OAuth callback handler
- **Note**: Middleware disabled (middleware.ts.disabled) due to Edge Runtime incompatibility
- **Session management**: API routes handle sessions, not middleware

**Export System** (`apps/web/lib/export/`)
- **pdf-generator.ts**: @react-pdf/renderer integration
- **pdf-templates/FeatureBriefPDF.tsx**: Professional PDF layouts with branding
- **chat-export.ts**: Chat conversation export (Markdown, Text, JSON, clipboard)
- **Markdown**: Enhanced GFM with tables, emojis, copy-to-clipboard

**Guest Session System** (`apps/web/lib/guest/`)
- **session-store.ts**: LocalStorage-based session persistence (no DB writes)
- **session-migration.ts**: Migrates guest session to user account on signup
- **10-message limit**: (Target - currently 5) Triggers signup modal, preserves context
- **Flow**: `/try` → guest chat → message limit → signup → `/app/session/[id]`

**Sub-Persona System** (`apps/web/lib/ai/mary-persona.ts`)
- **Four Modes**: Inquisitive, Devil's Advocate, Encouraging, Realistic
- **Pathway Weights**: Different mode distributions per pathway (New Idea: 40% Inquisitive, etc.)
- **Dynamic Shifting**: AI detects user state (defensive, overconfident, spinning) and adjusts mode
- **Kill Framework**: Escalation sequence for anti-sycophancy recommendations
- **67 tests**: Full coverage in `tests/lib/ai/mary-persona.test.ts`
- **Status**: Types/logic implemented, needs wiring to Claude API (Epic 6)

**Agent-Native Tool System** (`apps/web/lib/ai/tools/`)
Mary has 9 tools that enable agent-controlled session progression:

| Tool | Purpose |
|------|---------|
| `discover_pathways` | List all available strategic pathways |
| `discover_phase_actions` | List actions available in a phase |
| `discover_document_types` | List available document generators |
| `read_session_state` | Read current session phase/progress/mode |
| `complete_phase` | Signal phase completion and advance |
| `switch_persona_mode` | Change coaching mode dynamically |
| `recommend_action` | Provide viability recommendation (proceed/pivot/kill) |
| `generate_document` | Generate Lean Canvas, PRD, or other documents |
| `update_session_context` | Record insights for later document generation |

**Usage Pattern:**
```typescript
// Enable tools in chat request
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({
    message,
    workspaceId,
    conversationHistory,
    useTools: true  // Enable agentic tool loop
  })
});
```

**Agentic Loop** (`apps/web/app/api/chat/stream/route.ts:23-126`):
- Max 5 tool rounds per message to prevent infinite loops
- Tools execute sequentially within a round
- Results passed back to Claude for continued reasoning
- Final text includes all accumulated responses

**Structured Output Generators** (`apps/web/lib/bmad/generators/`)
- **ConceptDocumentGenerator**: Business concept documents from New Idea pathway
- **LeanCanvasGenerator**: Lean Canvas and Business Model Canvas formats
- **BrainstormSummaryGenerator**: Extract insights, action items, decisions from chat
- **ProductBriefGenerator**: Comprehensive product documentation with features, users, timeline
- **ProjectBriefGenerator**: Formal project documentation with scope, milestones, stakeholders
- **FeatureBriefGenerator**: Feature specification documents
- **index.ts**: Unified exports for all generators

### Database Schema (Supabase)

**Core Tables**:
- `bmad_sessions`: Session state and progress tracking
- `conversations`: AI conversation history
- `messages`: Individual message storage
- `user_workspace`: Workspace auto-save data
- `user_credits`: Credit balance tracking
- `credit_transactions`: Complete audit trail
- `credit_packages`: Pricing tiers (starter/professional/business)
- `payment_history`: Stripe payment records

**Key Functions**:
- `grant_free_credit()`: Auto-grants 2 credits on signup
- `deduct_credit_transaction()`: Atomic credit deduction with row locking
- `add_credits_transaction()`: Purchase/grant handling with idempotency

### Route Architecture

**Protected App Routes** (`/app/*` - requires authentication):
- `/app` - Dashboard (main hub after login)
- `/app/new` - New session creation with loading animation
- `/app/session/[id]` - Workspace for active sessions
- `/app/account` - Account settings and preferences

**Public Routes**:
- `/` - Landing page (open to all, shows "Open App" for authenticated users)
- `/try` - Guest session (10 free messages target, localStorage-based, migrates on signup)
- `/demo` - Demo hub with pre-configured scenarios
- `/assessment` - Free strategic assessment quiz

**Legacy Redirects** (backwards compatibility):
- `/dashboard` → `/app`
- `/bmad` → `/app/new`
- `/workspace/[id]` → `/app/session/[id]`
- `/account` → `/app/account`

### API Routes

**AI Endpoints**:
- `/api/chat/stream` - Streaming Claude responses (authenticated)
- `/api/chat/guest` - Guest streaming (no auth, 5 message limit)
- `/api/chat/export` - Chat export service (Markdown, Text, JSON)
- `/api/bmad` - BMad Method session operations

**Monetization**:
- `/api/credits/balance` - Get user credit balance
- `/api/feedback/trial` - Trial feedback collection

**Monitoring**:
- `/api/monitoring/alerts` - System alerts
- `/api/monitoring/auth-metrics` - Authentication metrics

### Key Components

**BMad Interface** (`apps/web/app/components/bmad/`)
- `BmadInterface.tsx`: Main BMad Method UI
- `SessionManager.tsx`: Session creation and navigation
- `PathwaySelector.tsx`: Pathway selection interface
- `pathways/NewIdeaPathway.tsx`: New idea strategic pathway
- `pathways/FeatureBriefGenerator.tsx`: Feature brief generation
- `pathways/ExportOptions.tsx`: PDF/Markdown export UI

**Canvas** (`apps/web/app/components/canvas/`)
- `DualPaneLayout.tsx`: Two-pane workspace layout
- `TldrawCanvas.tsx`: tldraw integration
- `MermaidRenderer.tsx`: Mermaid diagram rendering
- `EnhancedCanvasWorkspace.tsx`: Full canvas with AI sync

**Monetization** (`apps/web/app/components/monetization/`)
- `CreditGuard.tsx`: Credit requirement enforcement
- `FeedbackForm.tsx`: Trial feedback collection

**Guest Session** (`apps/web/app/components/guest/`)
- `GuestChatInterface.tsx`: Guest chat UI with message counter
- `SignupPromptModal.tsx`: Message limit modal with signup CTA (bump to 10 messages)

**Workspace** (`apps/web/app/components/workspace/`)
- `ExportPanel.tsx`: Chat export dropdown (Markdown, Text, JSON, clipboard)

**UI Components** (`apps/web/app/components/ui/`)
- `AnimatedLoader.tsx`: Loading animation with rotating messages and progress bar
- `navigation.tsx`: Responsive navigation with auth state

**Output Selection** (`apps/web/app/components/bmad/`)
- `OutputTypeSelector.tsx`: Structured output format selector with message counter hook

## Development Patterns

### Session Creation Flow
1. User selects pathway → `SessionManager.tsx`
2. `session-orchestrator.ts` checks credits via `credit-manager.ts`
3. If sufficient credits, create session in database
4. Atomically deduct credit via `deduct_credit_transaction()`
5. If deduction fails, rollback session creation
6. Return session object to UI

### Credit Management
```typescript
// Check credits before action
const hasCredits = await hasCredits(userId, 1);
if (!hasCredits) {
  throw new Error('Insufficient credits');
}

// Deduct credit atomically
const result = await deductCredit(userId, sessionId);
if (!result.success) {
  // Handle failure (e.g., rollback)
}
```

### AI Streaming Response
```typescript
// Server-side (route.ts)
import { streamClaudeResponse } from '@/lib/ai/streaming';
return streamClaudeResponse(messages, systemPrompt);

// Client-side (component)
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ messages })
});
const reader = response.body.getReader();
// Process stream...
```

### Canvas Synchronization
- AI sends `<diagram type="...">...</diagram>` in responses
- `visual-suggestion-parser.ts` extracts and validates Mermaid syntax
- `useCanvasSync` hook updates canvas in real-time
- Canvas changes can trigger AI re-analysis

## Testing Strategy

### Unit Tests (Vitest)
- Located in `**/*.test.{ts,tsx}` files
- Setup: `apps/web/tests/setup.ts`
- Coverage: Canvas parsers, utility functions, business logic
- Run: `npm test` (watch) or `npm run test:run` (once)

### E2E Tests (Playwright)
- Located in `apps/web/tests/e2e/`
- Config: `apps/web/playwright.config.ts`
- Run: `npm run test:e2e` or `npm run test:e2e:ui`

**Current Test Suite (Dec 28, 2025):**
```
tests/e2e/
├── smoke/
│   └── health.spec.ts    # 7 public route tests (ALL PASSING)
└── helpers/
    ├── selectors.ts      # Centralized UI selectors
    └── routes.ts         # Route constants
```

**Tests verify these public routes load:**
- `/` (Landing)
- `/login`
- `/signup`
- `/try` (Guest)
- `/assessment`
- `/demo`
- `/resend-confirmation`

**CI Status:** ✅ All 7 tests passing in GitHub Actions

## Configuration Files

- `next.config.ts`: Next.js configuration (root directory: apps/web)
- `tailwind.config.cjs`: Tailwind CSS setup (CommonJS format)
- `playwright.config.ts`: E2E test configuration
- `vitest.config.ts`: Unit test configuration
- `eslint.config.mjs`: Linting rules

## Environment Variables

Required for development (see `.env.example` for template):
```bash
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Never commit actual keys to version control. Use Vercel dashboard or CLI for production secrets.

## Common Pitfalls

1. **Middleware Edge Runtime**: Do NOT use Node.js APIs in middleware - it runs on Edge Runtime
2. **Credit Deduction**: ALWAYS use `deduct_credit_transaction()` for atomicity, never manual UPDATE
3. **File-System Routing**: Every route reference needs a corresponding `page.tsx` file
4. **Migration Order**: Run migrations sequentially (001 → 011), never skip
5. **Stripe Webhooks**: Verify signatures with `stripe-service.ts.constructWebhookEvent()`
6. **Tldraw v4 API**: Use `getSnapshot(store)` and `loadSnapshot(store, data)` - NOT `store.getSnapshot()` or `store.loadSnapshot()`
7. **E2E Tests**: Currently only smoke tests exist (7 route checks). Add more tests as features stabilize.
8. **Agentic Tool Loop**: Max 5 rounds per message. If Mary hits the limit, she appends a "processing limit" message. Check `MAX_TOOL_ROUNDS` in `/api/chat/stream/route.ts`
9. **Tool Results Format**: Use `ToolExecutor.formatResultsForClaude()` to convert tool results - Claude expects specific `tool_result` content block format
10. **Session Primitives**: Use atomic functions from `session-primitives.ts` instead of direct Supabase calls for session operations

## Production Deployment

- **Platform**: Vercel
- **Project Name**: `thinkhaven`
- **Root Directory**: Leave blank (deploy from `apps/web/` locally)
- **Production URL**: https://thinkhaven.co
- **Environment**: Set via Vercel dashboard (Settings → Environment Variables)
- **Builds**: Automatic on push to main branch
- **Deploy manually**: `cd apps/web && vercel --prod`

## Current Status: Agent-Native Architecture Complete

**Completed Phases:**
- Phase 1: Workspace context builder ✅
- Phase 2: Dynamic context enrichment ✅
- Phase 3: Tool calling infrastructure ✅
- Phase 4: Atomic session primitives ✅
- Phase 5: Capability discovery system ✅

**Epic 6 - Sub-Persona (Partially Complete):**
| Story | Title | Status |
|-------|-------|--------|
| 6.1 | Wire Sub-Persona to Claude API | ✅ Done (via tool system) |
| 6.2 | Dynamic Mode Shifting | ✅ Done (`switch_persona_mode` tool) |
| 6.3 | Kill Recommendation System | ✅ Done (`recommend_action` tool) |
| 6.4 | Output Polish (Lean Canvas + PRD) | ✅ Done (`generate_document` tool) |
| 6.5 | 10-Message Trial Gate | Pending |
| 6.6 | Mode Indicator UI | Pending |

### Next Steps

1. **Enable Tool Mode in UI**: Add `useTools: true` toggle for sessions
2. **Mode Indicator UI**: Display current sub-persona mode to users
3. **Trial Gate**: Bump message limit from 5 to 10
4. **Testing**: E2E tests for agentic tool flow

### Key Files for Tool Integration

- `app/api/chat/stream/route.ts` - Agentic loop (lines 23-126)
- `lib/ai/tool-executor.ts` - Tool execution engine
- `lib/ai/tools/index.ts` - Tool definitions (MARY_TOOLS array)
- `lib/bmad/session-primitives.ts` - Session operations
- `lib/bmad/capability-discovery.ts` - Discovery APIs

### Quick Start
```bash
cd apps/web
npm run dev
# Test tool system: Enable useTools in chat request
# Check: apps/web/app/api/chat/stream/route.ts
```

## Recent Major Changes

- **Jan 19, 2026**:
  - **Agent-Native Evolution (Phases 3-5)**:
    - Phase 3: Tool calling infrastructure with 9 tools for session control
    - Phase 4: Atomic session primitives replacing bundled operations
    - Phase 5: Dynamic capability discovery for emergent behavior
    - Agentic loop in `/api/chat/stream` with max 5 tool rounds
    - Tools: `discover_pathways`, `discover_phase_actions`, `discover_document_types`, `read_session_state`, `complete_phase`, `switch_persona_mode`, `recommend_action`, `generate_document`, `update_session_context`
  - **Session Primitives** (`lib/bmad/session-primitives.ts`):
    - `createSessionRecord()`, `loadSessionState()`, `persistSessionState()`, `deleteSession()`
    - `completePhase()` - agent-controlled phase advancement
    - `recordInsight()`, `getSessionInsights()` - context capture
    - `PHASE_ORDER` - source of truth for pathway phase sequences
  - **Capability Discovery** (`lib/bmad/capability-discovery.ts`):
    - `listAvailablePathways()` - discover all pathways
    - `listPhaseActions()` - discover actions per phase
    - `listDocumentTypes()` - discover generatable documents
    - `discoverCapabilities()` - contextual suggestions based on session state
  - **Context System** (`lib/ai/context-builder.ts`):
    - Phase 2 dynamic context enrichment
    - Retrieves insights and phase outputs for AI context
  - **UI Updates**:
    - Dashboard simplified with cleaner session card design
    - ThinkHaven branded favicon
- **Jan 4, 2026**:
  - **Sub-Persona Implementation**:
    - Implemented sub-persona types, weights, and state detection in `mary-persona.ts`
    - Added 67 tests for persona logic
    - Created Epic 6 stories for remaining MVP work
  - **Design System**:
    - Wes Anderson-inspired palette (cream, parchment, terracotta, forest, ink)
    - Typography: Jost (display), Libre Baskerville (body), JetBrains Mono (mono)
    - Fonts loaded via `next/font` in layout.tsx
    - Renamed `tailwind.config.js` to `.cjs` for module format fix
  - **Strategic Direction Refinement**:
    - Repositioned as "Decision Accelerator" (not coaching platform)
    - Sub-persona system defined: Inquisitive, Devil's Advocate, Encouraging, Realistic
    - Anti-sycophancy features: Kill recommendations with escalation sequence
    - Output focus: Lean Canvas + PRD/Spec as primary deliverables
    - Canvas/visual workspace de-prioritized to post-MVP (nice-to-have)
    - Trial bumped from 5 to 10 messages
    - Pricing: Phase 1 LTD ($199-499), then Subscription + Credits
  - **PRD Cleanup**: All shards aligned with 8-strategic-direction.md as source of truth
- **Dec 28, 2025**:
  - **E2E Testing Simplification**:
    - Deleted 19 broken test files that tested non-existent UI
    - Reduced from 437-line workflow to 92-line workflow
    - Final state: 7 smoke tests, all passing in CI
  - **GitHub Actions Cleanup**:
    - Removed OAuth E2E workflow (no OAuth tests exist)
    - Removed claude-daily-digest.yml (Claude Code Action failing)
    - Removed claude-security-scan.yml (Claude Code Action failing)
    - Final workflows: `e2e-tests.yml` (push), `claude-code-review.yml` (PRs)
- **Dec 27, 2025**:
  - **GitHub Actions Workflow Fixes**:
    - Added OIDC permissions (`id-token: write`) for Claude Code Action
    - Fixed claude-security-scan trigger (removed unsupported `push:` event)
    - Added Vercel monorepo config (`vercel.json`)
- **Dec 23, 2025**:
  - Route restructuring to `/app/*` path-based architecture with auth protection
  - Guest session flow (`/try`) - 5 free messages, localStorage-based, migrates on signup
  - Chat export enhancements - Markdown, Text, JSON formats with clipboard support
  - Loading animations - AnimatedLoader with rotating messages and progress bar
  - Structured output generators - BrainstormSummary, ProductBrief, ProjectBrief
  - OutputTypeSelector component with message counter hook (triggers at ~20 messages)
- **Dec 22, 2025**:
  - Vercel project cleanup - Consolidated to 3 active projects (thinkhaven, neurobot, pmarchetype)
  - E2E test fixes - Updated all test selectors to match dashboard UI redesign
  - OAuth E2E infrastructure fix (TD-001) - All 66 tests can run
  - Demo page UX improvements - Fixed contrast issues in CTA section
  - Created `/bmad` route to fix production 404 error
- **Oct 28**: Canvas tldraw v4 API fix - Updated snapshot methods to use standalone functions
- **Oct 14**: Epic 4 Monetization (30% complete) - Credit system, Stripe integration
- **Oct 13**: Middleware disabled, route fixes, production stabilization
- **Oct 9**: Epic 2 & 3 complete - Canvas workspace, PDF/Markdown export
- **Sept 29**: OAuth simplification - 60% code reduction

## Documentation

- `/docs/stories/`: Feature stories and requirements
- `/docs/milestones/`: Implementation summaries
- `/docs/architecture/`: Architecture documentation
- `IMPLEMENTATION-ROADMAP.md`: Epic 4 implementation guide (1,050 lines)

---
*This file is automatically used by Claude Code. Keep it updated with critical project patterns.*
