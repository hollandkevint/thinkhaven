# Codebase Structure

**Analysis Date:** 2026-01-29

## Directory Layout

```
/Users/kthkellogg/Documents/GitHub/thinkhaven/
├── apps/
│   └── web/                           # Next.js app (primary codebase)
│       ├── app/                       # Next.js App Router (file-based routes)
│       │   ├── layout.tsx             # Root layout with providers
│       │   ├── page.tsx               # Landing page (/)
│       │   ├── api/                   # API routes (server-side)
│       │   ├── app/                   # Protected dashboard routes (/app/*)
│       │   ├── auth/                  # OAuth callback handler
│       │   ├── components/            # Page-specific React components
│       │   ├── try/                   # Guest trial chat (/try)
│       │   ├── assessment/            # Strategic assessment quiz
│       │   ├── demo/                  # Pre-configured demo scenarios
│       │   ├── login/                 # Login form
│       │   ├── signup/                # Signup form
│       │   └── ...                    # Other routes
│       ├── lib/                       # Core business logic
│       │   ├── ai/                    # Claude API + persona + tools
│       │   ├── bmad/                  # BMad Method engine (session, pathways, generators)
│       │   ├── canvas/                # tldraw integration
│       │   ├── export/                # PDF + Markdown generation
│       │   ├── auth/                  # Auth context + utilities
│       │   ├── supabase/              # Database client + queries
│       │   ├── monetization/          # Credit system + Stripe
│       │   ├── monitoring/            # Error + auth logging
│       │   ├── workspace/             # Session context
│       │   ├── hooks/                 # React hooks
│       │   ├── demo/                  # Demo data
│       │   ├── guest/                 # Guest session management
│       │   ├── security/              # CORS, security utilities
│       │   └── utils.ts               # Shared utilities
│       ├── public/                    # Static assets (icons, fonts, images)
│       ├── supabase/
│       │   └── migrations/            # Database migrations (001-011)
│       ├── types/                     # Global TypeScript types
│       ├── tests/                     # Test files (Vitest, Playwright)
│       ├── playwright/                # Playwright config and test reports
│       ├── package.json               # Dependencies
│       ├── tsconfig.json              # TypeScript config
│       ├── next.config.ts             # Next.js config
│       ├── tailwind.config.cjs        # Tailwind CSS config
│       ├── vitest.config.ts           # Unit test config
│       └── playwright.config.ts       # E2E test config
├── docs/                              # Project documentation
│   ├── prd/                           # Product requirements
│   ├── design/                        # Design system, wireframes
│   ├── stories/                       # Feature stories
│   └── ...
├── .planning/                         # GSD planning artifacts
│   └── codebase/                      # Architecture/codebase docs (THIS LOCATION)
└── .claude/                           # Claude Code custom commands

```

## Directory Purposes

**`apps/web/app/`** - Next.js App Router (file-based routing)
- Purpose: Define all HTTP routes and pages
- Pattern: Directories = route segments, `page.tsx`/`layout.tsx`/`route.ts` = handlers
- Public routes: `/`, `/login`, `/signup`, `/try`, `/assessment`, `/demo`
- Protected routes: `/app/*` (auth required)
- API routes: `/api/*` (server-side handlers)

**`apps/web/lib/ai/`** - AI Integration & Persona
- Purpose: Claude API interaction, persona management, tool execution
- Contains:
  - `claude-client.ts`: Anthropic SDK wrapper with tool calling support
  - `mary-persona.ts`: Coaching persona with 4 sub-modes (1,200 lines)
  - `tools/`: Tool implementations (discovery, session control, document generation)
  - `context-builder.ts`: Dynamic system prompt enrichment
  - `context-manager.ts`: Conversation context state
  - `streaming.ts`: Server-sent events infrastructure
  - `conversation-*.ts`: Chat persistence + export + search

**`apps/web/lib/bmad/`** - BMad Method Strategic Engine
- Purpose: Core strategic methodology implementation
- Structure:
  - `session-orchestrator.ts`: Session lifecycle manager with bundled operations
  - `session-primitives.ts`: Atomic session operations (Phase 4)
  - `pathway-router.ts`: Maps pathway types to configurations
  - `capability-discovery.ts`: Runtime capability discovery (Phase 5)
  - `template-engine.ts`: Phase template execution
  - `pathways/`: Pathway implementations (new-idea, business-model, etc.)
  - `generators/`: Document generators (Lean Canvas, Product Brief, Feature Brief)
  - `analysis/`: Domain-specific analysis (market positioning, etc.)
  - `types.ts`: Core type definitions (BmadSession, BmadPathway, etc.)

**`apps/web/lib/canvas/`** - Visual Workspace
- Purpose: tldraw integration + Mermaid diagram rendering
- Contains:
  - `canvas-manager.ts`: tldraw instance pooling
  - `visual-suggestion-parser.ts`: Parse AI suggestions into Mermaid
  - `canvas-export.ts`: Export to PNG/SVG
  - `useCanvasSync.ts`: Bidirectional AI↔Canvas sync

**`apps/web/lib/export/`** - Document Export
- Purpose: Generate professional outputs (PDF, Markdown, JSON)
- Contains:
  - `pdf-generator.ts`: @react-pdf/renderer integration
  - `pdf-templates/`: PDF layout components
  - `chat-export.ts`: Chat conversation export

**`apps/web/lib/monetization/`** - Credit System & Payments
- Purpose: Session access control via credits
- Contains:
  - `credit-manager.ts`: Balance checks, atomic deduction
  - `stripe-service.ts`: Stripe webhook + checkout
  - Database: `user_credits`, `credit_transactions`, `credit_packages`, `payment_history`

**`apps/web/lib/auth/`** - Authentication
- Purpose: User auth + session management
- Contains:
  - `AuthContext.tsx`: React context for auth state (32% code reduction)
  - `supabase/server.ts`: Server-side Supabase client
  - `supabase/client.ts`: Browser Supabase client

**`apps/web/lib/supabase/`** - Database Client & Queries
- Purpose: Supabase (Postgres) integration
- Contains:
  - `server.ts`: Server-side client with service role key
  - `client.ts`: Browser client with anon key
  - `conversation-queries.ts`: Chat history queries
  - `conversation-schema.ts`: Message/conversation types
  - `middleware*.ts`: Auth middleware (mostly disabled)

**`apps/web/lib/monitoring/`** - Logging & Observability
- Purpose: Error tracking, auth metrics, service health
- Contains:
  - `error-monitor.ts`: Centralized error tracking
  - `auth-logger.ts`: Auth event logging (success, provider, timestamp)
  - `service-status.ts`: Health checks for Anthropic, Supabase

**`apps/web/lib/workspace/`** - Session Context
- Purpose: Workspace state management
- Contains:
  - `WorkspaceContext.tsx`: React context for session/workspace state
  - `WorkspaceContextBuilder`: Builds rich context for AI

**`apps/web/app/components/`** - React Components
- Purpose: UI components organized by domain
- Structure:
  - `ui/`: Shadcn/ui components (Button, Card, Input, etc.)
  - `bmad/`: BMad Method UI (PathwaySelector, OutputTypeSelector)
  - `chat/`: Chat interface components (MessageList, InputBox)
  - `canvas/`: Canvas workspace (DualPaneLayout, TldrawCanvas)
  - `guest/`: Guest chat UI (GuestChatInterface, SignupPromptModal)
  - `artifact/`: Output artifact components
  - `assessment/`: Quiz components
  - `monetization/`: Credit guard, feedback forms
  - `workspace/`: Session controls, export panels
  - `monitoring/`: Status indicators

**`apps/web/supabase/migrations/`** - Database Schema
- Purpose: Sequential Postgres migrations
- Files: `001_*.sql` through `011_*.sql`
- Pattern: Sequential execution (never skip), cumulative state
- Latest: `011_add_sub_persona_state.sql`
- Key tables: `bmad_sessions`, `conversations`, `messages`, `user_credits`, `credit_transactions`

**`apps/web/public/`** - Static Assets
- Contains: Icons (SVG), fonts, images, logos
- Example: `apple-icon.svg`, `icon.svg`, favicon

**`apps/web/types/`** - Global Type Definitions
- Purpose: Shared TypeScript types used across the app
- Examples: Route types, API response types

**`tests/`** - Test Files
- Structure:
  - `e2e/`: Playwright end-to-end tests (smoke tests only)
  - `lib/`: Unit tests for lib modules (Vitest)
  - `setup.ts`: Test environment configuration

**`docs/`** - Project Documentation (Not source code)
- Structure:
  - `prd/`: Product requirements
  - `design/`: Design system, wireframes
  - `stories/`: Feature stories
  - `qa/`: QA checklists
  - `troubleshooting/`: Debugging guides

## Key File Locations

**Entry Points:**
- `apps/web/app/layout.tsx`: Root layout with AuthProvider, WorkspaceProvider, fonts
- `apps/web/app/page.tsx`: Landing page (/)
- `apps/web/app/app/page.tsx`: Dashboard redirect
- `apps/web/app/app/session/[id]/page.tsx`: Session workspace

**Configuration:**
- `apps/web/next.config.ts`: Next.js config
- `apps/web/tailwind.config.cjs`: Tailwind CSS (CommonJS format)
- `apps/web/tsconfig.json`: TypeScript config
- `apps/web/package.json`: Dependencies + scripts
- `.env.example`: Environment variable template

**Core Logic:**
- `apps/web/lib/bmad/session-orchestrator.ts`: Session management
- `apps/web/lib/bmad/session-primitives.ts`: Atomic operations
- `apps/web/lib/ai/claude-client.ts`: Claude API integration
- `apps/web/lib/ai/mary-persona.ts`: Coaching persona (4 sub-modes)
- `apps/web/lib/ai/tool-executor.ts`: Tool execution engine
- `apps/web/lib/ai/tools/`: Tool implementations (9 tools)
- `apps/web/lib/monetization/credit-manager.ts`: Credit operations

**Testing:**
- `apps/web/vitest.config.ts`: Unit test config
- `apps/web/playwright.config.ts`: E2E test config
- `apps/web/tests/e2e/smoke/health.spec.ts`: Smoke tests (7 route tests)

## Naming Conventions

**Files:**
- PascalCase for React components: `SessionManager.tsx`, `BmadInterface.tsx`
- camelCase for utilities: `session-orchestrator.ts`, `credit-manager.ts`
- UPPERCASE for constants: `PHASE_ORDER`, `MARY_TOOLS`
- Lowercase for directories: `lib/`, `app/`, `components/`

**Directories:**
- kebab-case for multi-word dirs: `lib/user-workspace/`, `components/dual-pane/`
- Feature-scoped subdirs: `lib/bmad/generators/`, `lib/ai/tools/`
- Route pattern: `app/api/chat/stream/` for `/api/chat/stream` endpoint

**Functions:**
- camelCase: `createSessionRecord()`, `deductCredit()`, `hasCredits()`
- Async functions return Promises: `async function executeAgenticLoop()...`
- Handler suffixes: `route.ts` for API handlers, `page.tsx` for pages
- Hook prefix: `useAuth()`, `useCanvasSync()`

**TypeScript Types:**
- PascalCase for interfaces: `SessionRecord`, `CoachingContext`, `BmadSession`
- UPPERCASE for enums: `PathwayType`, `BmadPhase`
- Type unions: `'active' | 'paused' | 'completed'` for status values

**Database:**
- snake_case for tables: `bmad_sessions`, `user_credits`, `credit_transactions`
- snake_case for columns: `user_id`, `workspace_id`, `created_at`
- Foreign keys: `{table}_id` pattern

## Where to Add New Code

**New Feature in Existing Pathway:**
- Pathway logic: `apps/web/lib/bmad/pathways/[pathway-name].ts`
- Types: Add to `apps/web/lib/bmad/types.ts`
- Tests: `apps/web/tests/lib/bmad/pathways/[pathway-name].test.ts`
- Example: Adding validation step to New Idea pathway

**New AI Tool (Agent-Native):**
- Tool definition: Add to `apps/web/lib/ai/tools/index.ts` (MARY_TOOLS array)
- Implementation: Create file in `apps/web/lib/ai/tools/` (e.g., `custom-tools.ts`)
- Executor: Register in `apps/web/lib/ai/tool-executor.ts` switch statement
- Tests: `apps/web/tests/lib/ai/tools/[tool-name].test.ts`
- Example: New discovery tool for user preferences

**New Document Generator:**
- Generator class: `apps/web/lib/bmad/generators/[document]-generator.ts`
- Export: Add to `apps/web/lib/bmad/generators/index.ts`
- Type: Extend `GeneratedDocument` interface in `apps/web/lib/bmad/types.ts`
- PDF template: `apps/web/lib/export/pdf-templates/[Document]PDF.tsx` (optional)
- Example: Custom RFP generator

**New Component:**
- Feature components: `apps/web/app/components/[domain]/[ComponentName].tsx`
- Shared UI: `apps/web/app/components/ui/[component].tsx` (shadcn pattern)
- Hooks: `apps/web/lib/hooks/use[Feature].ts`
- Example: New user profile editor

**New API Route:**
- Handler: `apps/web/app/api/[endpoint]/route.ts`
- Pattern: Export `GET`, `POST`, `PUT`, `DELETE` functions
- Auth: Call `createClient()` from `apps/web/lib/supabase/server.ts`
- Example: New pricing tier checkout at `/api/checkout/pro-plan`

**Database Migration:**
- File: `apps/web/supabase/migrations/[next-number]_[description].sql`
- Pattern: Sequential naming (012_*, 013_*, etc.)
- Must be idempotent (handle if already applied)
- Example: `012_add_feature_flags.sql`

**New Test:**
- Unit test: `apps/web/tests/lib/[path]/[module].test.ts` (matches lib structure)
- E2E test: `apps/web/tests/e2e/[feature]/[scenario].spec.ts`
- Fixtures: `apps/web/tests/fixtures/[type]/[name].ts`
- Example: Test new persona mode logic

**New Environment Variable:**
- Add to `apps/web/.env.example` with description
- Load in relevant file (e.g., `claude-client.ts` for `ANTHROPIC_API_KEY`)
- Document in CLAUDE.md (project instructions)
- Never commit actual values to `.env.local`

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (created by `npm run build`)
- Committed: No (.gitignore)

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (created by `npm install`)
- Committed: No (.gitignore)
- Lock file: `package-lock.json` (committed)

**`playwright-report/`:**
- Purpose: E2E test results and screenshots
- Generated: Yes (created by Playwright runner)
- Committed: No (.gitignore)
- View: Open `index.html` in browser after test run

**`logs/`:**
- Purpose: Application logs (development)
- Generated: Yes (created at runtime)
- Committed: No (.gitignore)

**`supabase/migrations/`:**
- Purpose: Database schema migrations
- Generated: No (manually written)
- Committed: Yes
- Important: Must be applied sequentially, never skip

**`types/`:**
- Purpose: Global TypeScript definitions
- Generated: No
- Committed: Yes
- Use for: Types shared across multiple features

## Monorepo Structure

**Location:** `apps/web/` contains the entire web application
- Root: `/Users/kthkellogg/Documents/GitHub/thinkhaven/`
- App: `/Users/kthkellogg/Documents/GitHub/thinkhaven/apps/web/`
- No other apps in monorepo (all code is in `apps/web/`)

**Imports:** Use path aliases defined in `tsconfig.json`:
- `@/` → `apps/web/` (root of Next.js app)
- `@/lib/` → `apps/web/lib/`
- `@/components/` → `apps/web/app/components/`

Example import:
```typescript
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/lib/auth/AuthContext'
```

## Build Output

**Development:** `npm run dev`
- Starts Turbopack dev server on localhost:3000
- Hot module reloading enabled
- Uses `.env.local` for secrets

**Production:** `npm run build && npm start`
- Runs TypeScript compilation
- Generates `.next/` optimized bundle
- Requires `NODE_ENV=production`
- Deployed via Vercel (auto-deploy on push to main)

---

*Structure analysis: 2026-01-29*
