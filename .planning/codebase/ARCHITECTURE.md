# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Layered architecture with Next.js App Router, modular domain services, and React Context state management

**Key Characteristics:**
- Server-side rendering with client-side interactivity (Next.js 15.5 App Router)
- Domain-driven design with specialized subsystems (BMad engine, AI integration, workspace management)
- Database-first architecture with Supabase PostgreSQL + Row Level Security
- API routes for streaming AI responses and session management
- Monorepo structure with workspace packages (planned for shared UI/canvas components)

## Layers

**Presentation Layer (App Router):**
- Purpose: UI routing, page components, client-side interactivity
- Location: `app/`
- Contains: Pages (`page.tsx`), layouts, route handlers, React components
- Depends on: `lib/` domain services, `lib/auth/AuthContext.tsx`, `lib/workspace/WorkspaceContext.tsx`
- Used by: End users via browser

**API Layer:**
- Purpose: Server-side request handling, streaming responses, authentication
- Location: `app/api/`
- Contains: Route handlers (`route.ts`)
- Depends on: `lib/` services, Supabase server client, Anthropic SDK
- Used by: Frontend components via `fetch()`

**Domain Services Layer:**
- Purpose: Business logic, AI orchestration, session management, data access
- Location: `lib/`
- Contains: BMad engine (`lib/bmad/`), AI integration (`lib/ai/`), auth (`lib/auth/`), database clients (`lib/supabase/`)
- Depends on: External services (Supabase, Anthropic), shared types
- Used by: API routes, client components (via context providers)

**Data Layer:**
- Purpose: Persistent storage, user authentication, session state
- Location: Supabase PostgreSQL (remote), schema defined in `supabase/`
- Contains: Tables, migrations, Row Level Security policies
- Depends on: Supabase infrastructure
- Used by: Domain services via `lib/supabase/client.ts` and `lib/supabase/server.ts`

**Shared Packages (Future):**
- Purpose: Reusable UI components and canvas engine
- Location: `packages/ui/`, `packages/canvas-engine/`, `packages/shared/`, `packages/bmad-engine/`
- Contains: Package exports (currently minimal)
- Depends on: React, TypeScript
- Used by: Main app (planned expansion)

## Data Flow

**User Authentication Flow:**

1. User submits credentials at `app/login/page.tsx` or `app/signup/page.tsx`
2. Client calls `supabase.auth.signInWithPassword()` or `signInWithOAuth()` via `lib/supabase/client.ts`
3. Supabase returns session token
4. `AuthProvider` in `app/layout.tsx` detects session change via `onAuthStateChange()`
5. User object stored in React Context, accessible via `useAuth()` hook
6. Protected routes check `user` state and redirect if null

**AI Chat Flow:**

1. User sends message from `app/workspace/[id]/page.tsx`
2. Frontend POSTs to `app/api/chat/stream/route.ts` with `{ message, workspaceId, conversationHistory, useTools }`
3. API route authenticates via `lib/supabase/server.ts`
4. Verifies workspace access from `workspaces` table
5. Calls `lib/ai/claude-client.ts` with message and history
6. Claude API returns streaming response
7. `lib/ai/streaming.ts` encodes chunks as Server-Sent Events
8. Frontend receives stream, updates UI in real-time
9. API route persists conversation to database via `lib/ai/conversation-persistence.ts`

**BMad Session Flow:**

1. User selects pathway at `app/components/bmad/PathwaySelector.tsx`
2. Component POSTs to `app/api/bmad/route.ts` with pathway type
3. API route calls `lib/bmad/session-orchestrator.ts` to create session
4. Orchestrator loads template via `lib/bmad/template-engine.ts`
5. Initializes phase state via `lib/bmad/pathway-router.ts`
6. Stores session in `bmad_sessions` table via `lib/bmad/database.ts`
7. Returns session state to frontend
8. `BmadInterface.tsx` renders current phase with elicitation options
9. User responses trigger phase advancement via orchestrator
10. Document generation triggered by `lib/bmad/generators/` on session completion

**State Management:**
- Client state: React Context (`AuthContext`, `WorkspaceContext`)
- Server state: PostgreSQL via Supabase
- Session state: Zustand stores (mentioned in dependencies, not yet implemented)
- Optimistic updates: Not implemented (database is source of truth)

## Key Abstractions

**BmadSession:**
- Purpose: Represents a structured strategic session with phases and outputs
- Examples: `lib/bmad/types.ts` (interface), `lib/bmad/session-orchestrator.ts` (lifecycle management)
- Pattern: State machine with phase transitions, template-driven execution

**SessionOrchestrator:**
- Purpose: Manages BMad session lifecycle from creation to document generation
- Examples: `lib/bmad/session-orchestrator.ts`
- Pattern: Service object with CRUD operations, delegates to template engine and database

**PathwayRouter:**
- Purpose: Routes users to appropriate strategic pathway based on intent
- Examples: `lib/bmad/pathway-router.ts`
- Pattern: Strategy pattern with pathway configurations (NEW_IDEA, BUSINESS_MODEL, STRATEGIC_OPTIMIZATION)

**ClaudeClient:**
- Purpose: Abstracts Anthropic API for streaming chat and tool calling
- Examples: `lib/ai/claude-client.ts`
- Pattern: Adapter pattern wrapping `@anthropic-ai/sdk`

**Supabase Client Factory:**
- Purpose: Creates appropriate Supabase client for server/client contexts
- Examples: `lib/supabase/server.ts` (server components), `lib/supabase/client.ts` (browser)
- Pattern: Factory pattern with environment-specific configurations

## Entry Points

**Root Landing Page:**
- Location: `app/page.tsx`
- Triggers: User navigates to root URL
- Responsibilities: Redirect authenticated users to `/dashboard`, show landing page for guests

**App Layout:**
- Location: `app/layout.tsx`
- Triggers: Wraps all pages
- Responsibilities: Initialize `AuthProvider`, apply global styles, set metadata

**Dashboard:**
- Location: `app/dashboard/page.tsx`
- Triggers: User navigates after login
- Responsibilities: List workspaces, create new workspaces, navigate to workspace detail

**Workspace Detail:**
- Location: `app/workspace/[id]/page.tsx`
- Triggers: User clicks workspace from dashboard
- Responsibilities: Load workspace, render chat interface and BMad interface, manage tab switching

**Chat Stream API:**
- Location: `app/api/chat/stream/route.ts`
- Triggers: Frontend POSTs chat message
- Responsibilities: Authenticate, call Claude API, stream response, persist conversation

**BMad API:**
- Location: `app/api/bmad/route.ts`
- Triggers: Frontend requests session creation or phase actions
- Responsibilities: Orchestrate BMad sessions, return phase state and elicitation prompts

## Error Handling

**Strategy:** Layered error handling with domain-specific error types, graceful degradation, and user-facing messages

**Patterns:**
- Custom error classes: `BmadMethodError` (code, context), `SessionStateError` in `lib/bmad/types.ts`
- API error responses: JSON with `{ error: string, details?: string }` and HTTP status codes (400, 401, 404, 500)
- Try-catch blocks: Wrap async operations in API routes and domain services
- Client error boundaries: Not implemented (Next.js default error handling)
- Streaming error encoding: `StreamEncoder.encodeError()` in `lib/ai/streaming.ts` sends error events to client
- Database errors: Caught in `lib/bmad/database.ts`, wrapped in `BmadMethodError`
- Auth errors: `AuthProvider` silently fails to `null` user state, protected routes redirect to login

## Cross-Cutting Concerns

**Logging:** Console.log statements in API routes and error handlers (no structured logging framework)

**Validation:** Zod schemas in dependencies, validation rules in `lib/bmad/types.ts` (ValidationRule interface), API routes validate required fields

**Authentication:**
- Supabase Auth with email/password and OAuth (Google)
- Session management via cookies (handled by `@supabase/ssr`)
- `AuthProvider` context exposes `user`, `loading`, `signOut()`
- API routes authenticate via `createClient()` from `lib/supabase/server.ts`
- Row Level Security policies enforce data access in database

**Authorization:**
- Workspace access verified by `user_id` column in `workspaces` table
- RLS policies in `supabase/schema.sql` (users can only access own workspaces)
- No role-based access control (single user per workspace)

**Caching:** Not implemented (database queries run on every request)

**Rate Limiting:** Not implemented

**Monitoring:** Not implemented (Vercel analytics available via deployment)

---

*Architecture analysis: 2026-02-14*
