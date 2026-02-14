# Technical Architecture

*Updated February 2026 — Decision Architecture Evolution*

## Technology Stack

**Current Implementation:**
- **Languages**: TypeScript, JavaScript (ES2023), CSS3
- **Frontend Framework**: React 19.1.0 with Next.js 15.5.0
- **Build System**: Turbopack for fast development builds
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with @supabase/ssr (migrated from deprecated auth-helpers)
- **Database**: PostgreSQL with comprehensive schema (migrations 001-013)
- **AI Integration**: Anthropic Claude Sonnet 4 with streaming responses and tool calling
- **Infrastructure**: Vercel deployment with Edge functions
- **Development**: Monorepo structure with npm workspaces
- **Blog**: MDX with Next.js (2 articles published)
- **Design System**: Wes Anderson palette, Jost/Libre Baskerville/JetBrains Mono typography

## Integration Approach

### Claude API Integration with Agent-Native Tool System

**Implementation (Completed):**
- **API Client**: Anthropic SDK (@anthropic-ai/sdk) for Claude Sonnet 4
- **Streaming Responses**: Server-Sent Events for real-time AI conversation
- **Tool Calling**: 9 agent-native tools with agentic loop (max 5 rounds per message)
- **Sub-Persona Weights**: System prompt injection with pathway-specific mode weights
- **Dynamic Mode Shifting**: `switch_persona_mode` tool for AI-controlled mode changes
- **Kill Recommendation**: `recommend_action` tool with proceed/pivot/kill + viability scoring

### Agent-Native Tool Architecture

```
User Message
    ↓
/api/chat/stream/route.ts (agentic loop)
    ↓
Claude Sonnet 4 (with MARY_TOOLS)
    ↓ (tool_use response)
tool-executor.ts → tools/index.ts
    ↓
Tool implementations:
├── discovery-tools.ts     → capability-discovery.ts
├── session-tools.ts       → session-primitives.ts
└── document-tools.ts      → generators/
    ↓
Results formatted via ToolExecutor.formatResultsForClaude()
    ↓
Back to Claude for continued reasoning (up to 5 rounds)
    ↓
Final text response streamed to client
```

### Database Integration Strategy
**Schema Components:**
- Conversation tables for AI message storage
- Session state management with pathway and mode tracking (migration 011)
- Credit system tables for monetization (migration 005)
- Beta access table with RLS and JWT claims (migration 013)
- Output generation state for Lean Canvas and PRD/Spec

### API Architecture
**Endpoint Structure:**
```
/api/chat/stream - Claude streaming with tool calling + agentic loop
/api/chat/guest - Guest streaming (10 message limit target)
/api/bmad - Session management with pathway configuration
/api/credits/balance - Credit system endpoints
```

## Code Organization and Standards

### File Structure Approach
- **AI Integration**: `lib/ai/` for Claude client, Mary persona, tools, context
- **Tool System**: `lib/ai/tools/` for tool registry, discovery, session, and document tools
- **Session Management**: `lib/bmad/` for pathway routing, session orchestration, primitives, capability discovery
- **Output Generation**: `lib/bmad/generators/` for Lean Canvas, PRD/Spec, concept docs, brainstorm summaries
- **UI Components**: `components/` with chat, output preview, and export panels
- **API Routes**: `api/` with streaming chat and session management endpoints

### Key Files
- **mary-persona.ts**: Base persona + sub-persona types, weights, state detection (67 tests)
- **tool-executor.ts**: Tool execution engine with Claude-format result formatting
- **tools/index.ts**: MARY_TOOLS array — 9 tool definitions
- **session-primitives.ts**: Atomic session operations (create, load, persist, delete, completePhase, recordInsight)
- **capability-discovery.ts**: Runtime pathway, action, and document type discovery
- **context-builder.ts**: Dynamic context enrichment from database

### Coding Standards
- **TypeScript First**: Strong typing for all AI integration interfaces
- **Sub-Persona Types**: Explicit typing for mode weights and transitions
- **Error Boundaries**: React error boundaries for AI component failures
- **Testing**: 67 unit tests for sub-persona logic, 7 E2E smoke tests

## Deployment and Operations

### Build Process Integration
- **Environment Variables**: Secure Claude API key management via Vercel
- **Build Optimization**: Bundle splitting for AI features
- **Type Safety**: Compile-time validation for Claude API integration

### Configuration Management
- **Development**: Local environment with Claude API keys
- **Production**: Secure key management via Vercel environment variables
- **Beta**: LAUNCH_MODE=true bypasses payment requirements
