# Current Implementation Status

*Updated February 2026 — Decision Architecture Evolution*

## Build Status Summary

### Completed
| Component | Status | Details |
|-----------|--------|---------|
| **Next.js 15 Foundation** | ✅ Done | App Router, Turbopack, TypeScript integration |
| **Authentication System** | ✅ Done | Supabase Auth with @supabase/ssr (migrated from deprecated auth-helpers) |
| **Claude Integration** | ✅ Done | Streaming responses with Mary persona, Claude Sonnet 4 |
| **Session Persistence** | ✅ Done | Conversation and session state management |
| **Guest Flow** | ✅ Done | 5 messages (needs bump to 10) |
| **Credit System Infrastructure** | ✅ Done | Database schema, Stripe integration ready |
| **Sub-Persona System** | ✅ Partially Complete | 4/6 stories done, 67 tests. Types, weights, state detection implemented. |
| **Dynamic Mode Shifting** | ✅ Done | `switch_persona_mode` tool enables AI-controlled mode changes |
| **Anti-Sycophancy Logic** | ✅ Done | `recommend_action` tool with proceed/pivot/kill recommendations |
| **Kill Recommendation** | ✅ Done | `recommend_action` tool with viability scoring |
| **Output Polish (Lean Canvas + PRD)** | ✅ Done | `generate_document` tool for structured output generation |
| **Agent-Native Tool System** | ✅ Done | 9 tools, agentic loop (max 5 rounds per message) |
| **Beta Access Control** | ✅ Done | Waitlist signup, JWT gating via Custom Access Token Hook, manual approval |
| **Error/Loading States** | ✅ Done | Skeleton loaders, retry buttons, error display, no blank screens |
| **MDX Blog** | ✅ Done | 2 articles published on thinkhaven.co |
| **Design System** | ✅ Done | Wes Anderson palette (cream, parchment, terracotta, forest, ink). Jost + Libre Baskerville + JetBrains Mono typography. |

### Remaining for MVP
| Component | Status | Priority |
|-----------|--------|----------|
| **10-Message Trial Gate** | ❌ Pending | High (Epic 6.5) |
| **Mode Indicator UI** | ❌ Pending | Medium (Epic 6.6) |
| **Enable Tool Mode in UI** | ❌ Pending | High |
| **E2E Tests for Agentic Flow** | ❌ Pending | Medium |

### Post-MVP (Nice-to-Have)
| Component | Status | Notes |
|-----------|--------|-------|
| **User Mode Control** | ❌ Not Started | Explicit sub-persona selection |
| **HTML Presentation** | ❌ Not Started | Single-file shareable output |
| **Low-Fi Visuals** | ❌ Not Started | Excalidraw-style sketches |
| **Canvas Workspace** | ⚠️ Partial | Not critical path — de-prioritized |
| **Executive Tier Pricing** | ❌ Not Started | $150-300/session for growth tier |

## Technical Foundation

### Current Codebase Structure
```
apps/web/
├── app/
│   ├── app/session/[id]/page.tsx   ✅ Workspace with Claude integration
│   ├── components/
│   │   ├── ui/                     ✅ Foundation components + design system
│   │   ├── chat/                   ✅ Complete chat interface with streaming
│   │   ├── bmad/                   ✅ BMad interface and generators
│   │   └── guest/                  ✅ Guest session components
│   └── api/
│       ├── chat/stream/route.ts    ✅ Claude streaming + agentic tool loop
│       └── chat/guest/route.ts     ✅ Guest streaming (no auth)
├── lib/
│   ├── ai/                         ✅ Claude client, Mary persona, sub-persona system
│   │   ├── mary-persona.ts         ✅ Sub-persona types, weights, state detection (67 tests)
│   │   ├── tool-executor.ts        ✅ Tool execution engine
│   │   ├── tools/                  ✅ 9 agent-native tools
│   │   │   ├── index.ts            ✅ Tool registry (MARY_TOOLS array)
│   │   │   ├── discovery-tools.ts  ✅ Pathway, phase action, document discovery
│   │   │   ├── document-tools.ts   ✅ Document generation tools
│   │   │   └── session-tools.ts    ✅ Session state management tools
│   │   ├── context-builder.ts      ✅ Dynamic context enrichment (Phase 2)
│   │   └── context-manager.ts      ✅ Conversation history management
│   ├── bmad/
│   │   ├── session-orchestrator.ts ✅ Session lifecycle with credit integration
│   │   ├── session-primitives.ts   ✅ Atomic session operations (Phase 4)
│   │   ├── capability-discovery.ts ✅ Runtime capability discovery (Phase 5)
│   │   ├── pathway-router.ts       ✅ Pathway routing
│   │   └── generators/             ✅ All output generators
│   ├── auth/                       ✅ @supabase/ssr auth context
│   └── monetization/               ✅ Credit system infrastructure
├── tests/                          ✅ Unit (67 persona tests) + E2E (7 smoke tests)
└── types/                          ✅ Complete TypeScript coverage
```

### Agent-Native Tool System

Mary has 9 tools that enable agent-controlled session progression:

| Tool | Purpose | Status |
|------|---------|--------|
| `discover_pathways` | List all available strategic pathways | ✅ Done |
| `discover_phase_actions` | List actions available in a phase | ✅ Done |
| `discover_document_types` | List available document generators | ✅ Done |
| `read_session_state` | Read current session phase/progress/mode | ✅ Done |
| `complete_phase` | Signal phase completion and advance | ✅ Done |
| `switch_persona_mode` | Change coaching mode dynamically | ✅ Done |
| `recommend_action` | Provide viability recommendation (proceed/pivot/kill) | ✅ Done |
| `generate_document` | Generate Lean Canvas, PRD, or other documents | ✅ Done |
| `update_session_context` | Record insights for later document generation | ✅ Done |

**Agentic Loop:** `/api/chat/stream/route.ts` — max 5 tool rounds per message, sequential tool execution within rounds, results passed back to Claude for continued reasoning.

### Database Schema Status
- **Users & Authentication:** ✅ Complete with Supabase Auth + @supabase/ssr
- **Sessions:** ✅ Working with session state management + sub-persona state (migration 011)
- **Conversations:** ✅ Fully integrated with persistence
- **Credits:** ✅ Credit system tables ready
- **Beta Access:** ✅ `beta_access` table with RLS, JWT claims via Custom Access Token Hook (migration 013)

### Beta Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| Waitlist Signup | ✅ Done | Landing page form creates `beta_access` row |
| JWT Gating | ✅ Done | Custom Access Token Hook injects `beta_approved` claim |
| Route Protection | ✅ Done | Middleware + API routes block unapproved users |
| Pending Page | ✅ Done | "You're on the list" message for unapproved users |
| Manual Approval | ✅ Done | Admin sets `approved_at` in Supabase Table Editor |
| Auth Migration | ✅ Done | @supabase/ssr replaces deprecated @supabase/auth-helpers-nextjs |

## Technical Debt Assessment

### High Priority (Block MVP)
- **Trial Gate:** Still at 5 messages, needs bump to 10
- **Tool Mode UI:** Need toggle to enable `useTools: true` in sessions
- **Mode Indicators:** No UI for showing current sub-persona mode

### Medium Priority (Pre-Launch)
- **Session Duration:** No enforcement of 10-30 minute sessions
- **E2E Tests:** Only smoke tests exist; need agentic flow coverage

### Low Priority (Post-MVP)
- **Canvas Functionality:** De-prioritized, not critical path
- **User Mode Control:** Let users select mode explicitly
- **HTML Presentation:** Export format for consultants
- **Executive Tier Pricing:** Stripe products for $150-300 sessions

## Current Platform Status

### Overall Assessment: **Beta Live, MVP Work Remaining (February 2026)**

**What's Working:**
- Agent-native architecture complete (9 tools, agentic loop, session primitives, capability discovery)
- Sub-persona system implemented with 67 tests (4/6 stories)
- Beta access control live (waitlist → approval → access)
- Error/loading states implemented (no blank screens)
- Design system applied (Wes Anderson palette)
- MDX blog live with 2 articles
- Auth stabilized on @supabase/ssr

**What's Needed for MVP:**
1. **10-Message Trial Gate** — Bump guest limit, partial output at gate
2. **Tool Mode UI** — Enable agentic tools in sessions
3. **Mode Indicator** — Show current sub-persona mode to users
4. **E2E Tests** — Coverage for agentic tool flow

**What's Post-MVP:**
- Executive tier pricing ($150-300/session)
- Canvas/visual workspace (nice-to-have, not critical)
- User-triggered mode control
- HTML presentation export
- Low-fi visual generation
