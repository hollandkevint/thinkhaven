# Architecture

**Analysis Date:** 2026-02-20

## Pattern Overview

**Overall:** Next.js App Router monorepo with server-client separation and an agentic AI loop

**Key Characteristics:**
- Server Components for auth-gated layout, Client Components for all interactive UI
- API routes handle all AI calls; client never calls Anthropic directly
- Single-user workspace model: one `user_workspace` row per user, not per session
- SSE streaming for AI responses with typed event protocol (`metadata`, `content`, `speaker_change`, `complete`, `error`)
- Dual-pane UI (chat left, canvas/board right) driven by client-side state, persisted to Supabase on finalize

## Layers

**Route Layer (Next.js App Router):**
- Purpose: Page rendering, layout, redirects
- Location: `apps/web/app/`
- Contains: `page.tsx`, `layout.tsx`, `route.ts` files
- Depends on: Auth layer, lib layer, component layer
- Used by: Browser, Vercel edge

**Auth Layer:**
- Purpose: Session management, beta-gate enforcement
- Location: `apps/web/lib/auth/`, `apps/web/app/app/layout.tsx`
- Contains: `AuthContext.tsx` (client React context), `beta-access.ts` (server JWT check), `admin.ts`, `jwt-verify.ts`
- Depends on: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Used by: Root layout (AuthProvider), all protected routes, API routes

**API Layer:**
- Purpose: Server-side AI calls, auth verification, credit/limit enforcement
- Location: `apps/web/app/api/`
- Contains: Route handlers (`route.ts`) for chat, bmad, checkout, credits, feedback, monitoring
- Depends on: `lib/ai/`, `lib/supabase/server.ts`, `lib/monetization/`
- Used by: Client components via `fetch()`

**AI Layer:**
- Purpose: Claude client, streaming, persona management, tool execution
- Location: `apps/web/lib/ai/`
- Contains: `claude-client.ts`, `streaming.ts`, `mary-persona.ts`, `board-types.ts`, `board-members.ts`, `tool-executor.ts`, `tools/`
- Depends on: `@anthropic-ai/sdk`
- Used by: `app/api/chat/stream/route.ts`, `app/api/chat/guest/route.ts`

**BMad Layer:**
- Purpose: Structured strategic session logic, pathways, templates, message limits
- Location: `apps/web/lib/bmad/`
- Contains: `session-primitives.ts`, `session-orchestrator.ts`, `pathway-router.ts`, `template-engine.ts`, `message-limit-manager.ts`, pathway/engine/generator subdirs
- Depends on: `lib/supabase/server.ts`, `lib/monetization/`
- Used by: API routes, `app/components/bmad/`

**Component Layer:**
- Purpose: All React UI
- Location: `apps/web/app/components/` (feature components), `apps/web/components/` (shared primitives)
- Contains: Feature directories (`bmad/`, `board/`, `canvas/`, `artifact/`, `chat/`, `workspace/`, `ui/`, `feedback/`, `monetization/`, `monitoring/`)
- Depends on: `lib/auth/`, `lib/supabase/client.ts`, `lib/stores/`, `lib/artifact/`
- Used by: Pages in `app/`

**Data Layer:**
- Purpose: Supabase client wrappers, type definitions
- Location: `apps/web/lib/supabase/`
- Contains: `server.ts` (SSR client, returns null when env missing), `client.ts` (browser Proxy, no-ops during SSG)
- Depends on: `@supabase/ssr`
- Used by: All layers

## Data Flow

**User Message → AI Response:**

1. User types in `apps/web/app/app/session/[id]/page.tsx` and submits
2. Page calls `fetch('/api/chat/stream', { method: 'POST', body: { message, workspaceId, conversationHistory } })`
3. `apps/web/app/api/chat/stream/route.ts` verifies auth via `lib/supabase/server.ts`
4. Route atomically increments message count via `lib/bmad/message-limit-manager.ts`
5. Route builds coaching context via `lib/ai/workspace-context.ts` and `lib/ai/context-builder.ts`
6. Route calls either `claudeClient.sendMessage()` (standard streaming) or `executeAgenticLoop()` (tool-enabled)
7. Agentic loop: Claude calls → `lib/ai/tool-executor.ts` executes tools (switch_speaker, discovery, document) → continues until `end_turn` or 5 rounds max
8. Route encodes response via `lib/ai/streaming.ts` `StreamEncoder` as SSE events
9. Page reads SSE stream, handles `speaker_change`/`content`/`complete` events, updates local state
10. On `complete`, page calls Supabase to persist `workspace_state.chat_context`

**Auth Flow:**

1. User hits `/app/*` route
2. `apps/web/app/app/layout.tsx` (Server Component) calls `checkBetaAccess()` from `lib/auth/beta-access.ts`
3. `checkBetaAccess` verifies JWT, checks `beta_approved` claim, falls back to `beta_access` DB table
4. Non-approved → redirect to `/waitlist`; unauthenticated → redirect to `/login`
5. Client wraps in `AuthProvider` (`lib/auth/AuthContext.tsx`) for reactive auth state

**State Management:**

- Chat history: React `useState` in page component, synced to Supabase `user_workspace.workspace_state` on each message finalize
- Board state: React `useState` in page, derived from stream `complete` event `additionalData.boardState`
- Dual-pane canvas/workspace: Zustand store in `lib/stores/dualPaneStore.ts`
- Artifact system: React context in `lib/artifact/artifact-store.tsx`, persisted via `lib/artifact/artifact-persistence.ts`
- Auth: React context in `lib/auth/AuthContext.tsx`
- Workspace metadata: React context in `lib/workspace/WorkspaceContext.tsx`

## Key Abstractions

**ClaudeClient (`lib/ai/claude-client.ts`):**
- Purpose: Single-responsibility wrapper around `@anthropic-ai/sdk`
- Methods: `sendMessage()` (streaming), `sendMessageWithTools()` (non-streaming with tools), `continueWithToolResults()` (tool loop continuation)
- Pattern: Lazy-initialized singleton exported as `claudeClient`

**MaryPersona (`lib/ai/mary-persona.ts`):**
- Purpose: System prompt generator for the AI facilitator (Mary) with sub-persona mode shifting
- Pattern: Delegates to `generateBoardSystemPrompt()` when board state present; otherwise generates single-persona prompt with weighted coaching modes
- Examples: `maryPersona.generateSystemPrompt(coachingContext)`

**StreamEncoder/Decoder (`lib/ai/streaming.ts`):**
- Purpose: Typed SSE protocol for AI responses
- Event types: `metadata`, `content`, `speaker_change`, `complete`, `error`, `typing`
- Pattern: `StreamEncoder` on server in API route; client manually parses `data:` lines

**ToolExecutor (`lib/ai/tool-executor.ts`):**
- Purpose: Executes Claude tool calls (discovery, document, session, switch_speaker)
- Pattern: `executeAll(toolCalls)` → returns results; `formatResultsForClaude()` formats for continuation
- Tools defined in `lib/ai/tools/` (discovery-tools, document-tools, session-tools, index)

**SessionPrimitives (`lib/bmad/session-primitives.ts`):**
- Purpose: Atomic functions for session lifecycle (create, advance phase, complete, add insight)
- Pattern: Use these instead of direct Supabase calls for all session operations

**ArtifactProvider (`lib/artifact/`):**
- Purpose: Structured outputs (documents, frameworks) generated during sessions
- Pattern: React context wrapping session page; `ArtifactPanel` rendered as overlay

**Board of Directors (`lib/ai/board-types.ts`, `lib/ai/board-members.ts`):**
- Purpose: Multi-speaker AI session with 6 personas (Mary, Victoria, Casey, Elaine, Omar, Taylor)
- Pattern: `switch_speaker` tool triggers handoff; `speaker_change` SSE event updates UI; handoffs encoded as `__handoff__FromName__ToName__reason` system messages

## Entry Points

**Landing Page:**
- Location: `apps/web/app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Marketing page with waitlist form

**App Dashboard:**
- Location: `apps/web/app/app/page.tsx`
- Triggers: Authenticated navigation to `/app`
- Responsibilities: Session list, new session CTA

**Session Workspace:**
- Location: `apps/web/app/app/session/[id]/page.tsx`
- Triggers: Navigation to `/app/session/:id`
- Responsibilities: Full dual-pane workspace, chat/BMad tabs, streaming AI responses

**Chat Stream API:**
- Location: `apps/web/app/api/chat/stream/route.ts`
- Triggers: `POST /api/chat/stream`
- Responsibilities: Auth, rate limiting, context building, agentic loop, SSE response

**Auth Callback:**
- Location: `apps/web/app/auth/callback/route.ts`
- Triggers: OAuth redirect from Supabase/Google
- Responsibilities: Exchange auth code for session, redirect to `/app`

**Root Layout:**
- Location: `apps/web/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Wraps all pages in `AuthProvider` and `WorkspaceProvider`

**App Layout (beta gate):**
- Location: `apps/web/app/app/layout.tsx`
- Triggers: Every `/app/*` request
- Responsibilities: Server-side beta access check; redirects non-approved users

## Error Handling

**Strategy:** Fail-open for non-critical (session creation), fail-closed for billing/limits

**Patterns:**
- API routes return structured JSON errors: `{ error, details, hint }` with appropriate HTTP status
- Streaming errors encoded as `{ type: 'error', error, errorDetails: { retryable, suggestion } }` SSE events
- Client pages catch stream errors, display inline error messages with retry, never crash silently
- `PaneErrorBoundary` (`app/components/dual-pane/PaneErrorBoundary.tsx`) catches rendering errors per pane
- `ErrorState` component (`app/components/ui/ErrorState.tsx`) provides retry/sign-out UI for data fetch failures
- Supabase `createClient()` returns `null` when env vars missing; callers must null-check before use

## Cross-Cutting Concerns

**Logging:** `console.log/error` with structured objects and `[Component]` prefixes throughout; `lib/monitoring/auth-logger.ts` for auth events persisted to DB

**Validation:** Request validation inline in API route handlers; env validation via `lib/security/env-validator.ts`

**Authentication:** Server: `lib/supabase/server.ts` + `lib/auth/beta-access.ts` in Server Components/layouts; Client: `lib/auth/AuthContext.tsx` React context; API: `supabase.auth.getUser()` in each route handler

**Rate Limiting:** `lib/security/rate-limiter.ts` for API abuse; `lib/bmad/message-limit-manager.ts` for per-session AI message quotas (default 10, admin bypass)

**Credits:** `lib/monetization/credit-manager.ts` with `deductCredit()` atomic function; always use `deduct_credit_transaction()` DB function, never manual UPDATE

---

*Architecture analysis: 2026-02-20*
