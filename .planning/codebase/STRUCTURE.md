# Codebase Structure

**Analysis Date:** 2026-02-20

## Directory Layout

```
thinkhaven/                        # Monorepo root
├── apps/
│   └── web/                       # Next.js application (all active code lives here)
│       ├── app/                   # Next.js App Router pages + API routes
│       │   ├── app/               # Protected routes (beta-gated at layout level)
│       │   │   ├── layout.tsx     # Beta access gate (Server Component)
│       │   │   ├── page.tsx       # Dashboard (/app)
│       │   │   ├── new/           # New session flow (/app/new)
│       │   │   ├── session/[id]/  # Session workspace (/app/session/:id)
│       │   │   └── account/       # Account settings (/app/account)
│       │   ├── api/               # API route handlers
│       │   │   ├── chat/
│       │   │   │   ├── stream/    # POST /api/chat/stream (main AI endpoint)
│       │   │   │   ├── guest/     # POST /api/chat/guest (unauthenticated, 5 msg limit)
│       │   │   │   └── export/    # POST /api/chat/export
│       │   │   ├── bmad/          # BMad session API
│       │   │   ├── checkout/      # Stripe checkout
│       │   │   ├── credits/       # Credit balance
│       │   │   ├── assessment/    # User assessment flow
│       │   │   ├── feedback/      # Feedback submission
│       │   │   └── monitoring/    # Auth metrics, alerts
│       │   ├── components/        # Feature-specific React components
│       │   │   ├── artifact/      # Artifact panel, editor, list
│       │   │   ├── assessment/    # Assessment UI
│       │   │   ├── bmad/          # BMad interface, pathway selector, session manager
│       │   │   ├── board/         # Board of Directors: speaker messages, handoff annotations
│       │   │   ├── canvas/        # Canvas workspace, context sync
│       │   │   ├── chat/          # Message limit warning
│       │   │   ├── dual-pane/     # StateBridge, PaneErrorBoundary, OfflineIndicator
│       │   │   ├── feedback/      # FeedbackButton
│       │   │   ├── guest/         # Guest mode components
│       │   │   ├── monetization/  # Pricing, upgrade prompts
│       │   │   ├── monitoring/    # Error monitor dashboard
│       │   │   ├── ui/            # App-specific UI: navigation, ErrorState, loading
│       │   │   └── workspace/     # ExportPanel, useSharedInput
│       │   ├── auth/callback/     # OAuth callback route handler
│       │   ├── layout.tsx         # Root layout (AuthProvider, WorkspaceProvider, fonts)
│       │   ├── page.tsx           # Landing page (/)
│       │   ├── login/             # /login
│       │   ├── signup/            # /signup
│       │   ├── try/               # /try (guest mode, 5 msg limit)
│       │   ├── assessment/        # /assessment
│       │   ├── waitlist/          # /waitlist
│       │   ├── blog/[slug]/       # MDX blog
│       │   ├── bmad/              # Legacy /bmad (redirects to /app/new)
│       │   ├── dashboard/         # Legacy /dashboard (redirects to /app)
│       │   └── workspace/[id]/    # Legacy /workspace/:id (redirects to /app/session/:id)
│       ├── components/            # Shared primitive components
│       │   ├── ui/                # shadcn/ui primitives (button, card, badge, etc.)
│       │   ├── canvas/            # CanvasContextSync (shared canvas)
│       │   └── waitlist/          # WaitlistForm
│       ├── lib/                   # All business logic and utilities
│       │   ├── ai/                # Claude client, streaming, personas, tools
│       │   │   └── tools/         # Tool definitions: discovery, document, session
│       │   ├── artifact/          # Artifact system: types, store, persistence, hooks
│       │   ├── auth/              # AuthContext, beta-access, admin, jwt-verify
│       │   ├── bmad/              # BMad engine: sessions, pathways, templates, limits
│       │   │   ├── engines/       # Validation, analysis engines
│       │   │   ├── generators/    # Output generators
│       │   │   ├── pathways/      # Pathway definitions
│       │   │   ├── session/       # Session management helpers
│       │   │   ├── templates/     # Prompt templates
│       │   │   └── types/         # BMad type definitions
│       │   ├── canvas/            # Canvas manager, export, sync hooks
│       │   ├── export/            # PDF generator, chat export
│       │   ├── guest/             # Guest session store and migration
│       │   ├── hooks/             # useNetworkStatus
│       │   ├── monetization/      # Credit manager, Stripe service
│       │   ├── monitoring/        # Auth logger, metrics, rate limiter, alert service
│       │   ├── security/          # Env validator, rate limiter
│       │   ├── stores/            # Zustand: dualPaneStore
│       │   ├── supabase/          # server.ts (SSR client), client.ts (browser Proxy)
│       │   └── workspace/         # WorkspaceContext
│       ├── content/blog/          # MDX blog posts
│       ├── design-system/         # Design tokens, style reference
│       ├── public/                # Static assets
│       ├── scripts/               # Utility scripts
│       ├── supabase/migrations/   # SQL migrations 001–019, sequential
│       ├── tests/                 # All test files
│       │   ├── e2e/smoke/         # Playwright E2E: health.spec.ts, beta-checklist.spec.ts
│       │   ├── components/        # Vitest component tests
│       │   ├── lib/               # Vitest lib unit tests
│       │   ├── fixtures/          # Test data
│       │   ├── helpers/           # Test utilities
│       │   └── config/            # global-setup.ts for Playwright
│       ├── __tests__/             # Legacy test location (bmad, integration, lib/ai)
│       ├── middleware.ts          # Active: session cookie refresh only (no route guard)
│       ├── next.config.ts         # MDX support, security headers, redirects
│       ├── tailwind.config.cjs    # Tailwind (CommonJS format required)
│       ├── vitest.config.ts       # Unit test config
│       ├── playwright.config.ts   # E2E config (local)
│       └── playwright.prod.config.ts  # E2E config (production URL)
├── .planning/                     # GSD planning artifacts
│   ├── codebase/                  # Codebase analysis documents
│   └── phases/                    # Implementation phase plans
├── .bmad-core/                    # BMAD agent framework (non-code)
└── .github/workflows/             # CI pipeline
```

## Directory Purposes

**`apps/web/app/app/` (protected routes):**
- Purpose: All authenticated user-facing pages
- Contains: Dashboard, new session, session workspace, account
- Key files: `layout.tsx` (beta gate), `page.tsx` (dashboard), `session/[id]/page.tsx` (workspace)

**`apps/web/app/api/` (API routes):**
- Purpose: All server-side logic accessible via HTTP
- Contains: Next.js `route.ts` files only; no shared business logic here
- Key files: `chat/stream/route.ts` (main AI endpoint), `auth/callback/route.ts` (OAuth)

**`apps/web/app/components/` (feature components):**
- Purpose: React components tied to specific features
- Contains: Feature directories, each with related components and sometimes a barrel `index.ts`
- Key files: `bmad/BmadInterface.tsx`, `board/SpeakerMessage.tsx`, `dual-pane/PaneErrorBoundary.tsx`

**`apps/web/components/` (shared primitives):**
- Purpose: Truly reusable components not tied to features
- Contains: shadcn/ui primitives in `ui/`, shared canvas, waitlist form
- Key files: `ui/button.tsx`, `ui/card.tsx`, `canvas/CanvasContextSync.tsx`

**`apps/web/lib/ai/` (AI layer):**
- Purpose: All Anthropic SDK interaction
- Contains: Client wrapper, streaming protocol, persona definition, tool executors
- Key files: `claude-client.ts`, `streaming.ts`, `mary-persona.ts`, `board-members.ts`, `tool-executor.ts`

**`apps/web/lib/bmad/` (BMad engine):**
- Purpose: Strategic session logic, pathways, templates, message limits
- Contains: Session primitives, orchestrator, pathway router, template engine, type definitions
- Key files: `session-primitives.ts`, `message-limit-manager.ts`, `pathway-router.ts`

**`apps/web/lib/supabase/` (database clients):**
- Purpose: Supabase client initialization for server and client environments
- Contains: `server.ts` (async, returns null when env missing), `client.ts` (Proxy, no-ops during SSG)
- Key files: `server.ts`, `client.ts`

**`apps/web/supabase/migrations/` (schema):**
- Purpose: Sequential SQL migration files
- Contains: 001 through 019, covering schema, RLS, triggers, functions
- Naming: `NNN_description.sql`, strictly sequential, never skip

**`apps/web/tests/` (tests):**
- Purpose: All test files (Vitest unit + Playwright E2E)
- Contains: `e2e/smoke/` for E2E, feature subdirs for unit tests, `config/global-setup.ts`
- Key files: `e2e/smoke/health.spec.ts` (7 CI tests), `e2e/smoke/beta-checklist.spec.ts` (9 prod tests)

## Key File Locations

**Entry Points:**
- `apps/web/app/layout.tsx`: Root layout, wraps all pages in AuthProvider + WorkspaceProvider
- `apps/web/app/page.tsx`: Landing page
- `apps/web/app/app/layout.tsx`: Beta access gate for all `/app/*` routes
- `apps/web/app/app/session/[id]/page.tsx`: Main session workspace (1000+ lines)
- `apps/web/app/api/chat/stream/route.ts`: Primary AI API endpoint

**Configuration:**
- `apps/web/next.config.ts`: MDX, security headers, legacy redirects
- `apps/web/tailwind.config.cjs`: Tailwind (must stay `.cjs`)
- `apps/web/tsconfig.json`: Path alias `@/*` maps to `apps/web/*`
- `apps/web/vitest.config.ts`: Unit test runner config
- `apps/web/playwright.config.ts`: E2E config for local dev
- `apps/web/playwright.prod.config.ts`: E2E config for production (no local server)

**Core Logic:**
- `apps/web/lib/ai/claude-client.ts`: Anthropic SDK wrapper, singleton `claudeClient`
- `apps/web/lib/ai/streaming.ts`: SSE encoding/decoding, `StreamEncoder` class
- `apps/web/lib/ai/mary-persona.ts`: System prompt generator with sub-persona weighting
- `apps/web/lib/ai/board-types.ts`: `BoardMemberId`, `BoardMember`, `ChatMessage` types
- `apps/web/lib/ai/board-members.ts`: Board member registry and system prompt generator
- `apps/web/lib/ai/tool-executor.ts`: Tool dispatch and result formatting
- `apps/web/lib/bmad/session-primitives.ts`: Atomic session lifecycle functions
- `apps/web/lib/bmad/message-limit-manager.ts`: Per-session message counting
- `apps/web/lib/auth/AuthContext.tsx`: Client-side auth state (React context)
- `apps/web/lib/auth/beta-access.ts`: Server-side beta gate check
- `apps/web/lib/supabase/server.ts`: SSR Supabase client (returns null without env)
- `apps/web/lib/supabase/client.ts`: Browser Supabase Proxy (no-ops during SSG)
- `apps/web/lib/monetization/credit-manager.ts`: Credit deduction functions
- `apps/web/lib/monetization/stripe-service.ts`: Stripe webhook and checkout

**Testing:**
- `apps/web/tests/e2e/smoke/health.spec.ts`: 7 public route smoke tests
- `apps/web/tests/e2e/smoke/beta-checklist.spec.ts`: 9 production verification tests
- `apps/web/tests/setup.ts`: Vitest global setup

## Naming Conventions

**Files:**
- Pages: `page.tsx` (required by Next.js App Router)
- Layouts: `layout.tsx`
- API handlers: `route.ts`
- React components: PascalCase (`BmadInterface.tsx`, `SpeakerMessage.tsx`)
- Lib modules: kebab-case (`claude-client.ts`, `session-primitives.ts`, `board-types.ts`)
- Hooks: camelCase starting with `use` (`useBmadSession.ts`, `useSharedInput.ts`)
- Test files: `*.test.ts` or `*.test.tsx` for Vitest; `*.spec.ts` for Playwright

**Directories:**
- Route segments: lowercase kebab-case (`app/`, `session/`, `new/`)
- Dynamic segments: bracket notation (`[id]/`, `[slug]/`)
- Feature lib dirs: lowercase kebab-case (`lib/ai/`, `lib/bmad/`, `lib/supabase/`)
- Component dirs: lowercase kebab-case (`components/bmad/`, `components/board/`)

## Where to Add New Code

**New protected page:**
- Add directory under `apps/web/app/app/`
- Inherits beta gate from `apps/web/app/app/layout.tsx` automatically
- Example: `apps/web/app/app/reports/page.tsx`

**New API endpoint:**
- Add `route.ts` under `apps/web/app/api/[feature]/`
- Always verify auth with `createClient()` + `supabase.auth.getUser()` at the top
- Example: `apps/web/app/api/export/pdf/route.ts`

**New feature component:**
- Add to `apps/web/app/components/[feature]/`
- Export from feature barrel if one exists (`index.ts`)
- Example: `apps/web/app/components/reports/ReportCard.tsx`

**New shared primitive:**
- Add to `apps/web/components/ui/` following shadcn patterns
- Example: `apps/web/components/ui/tooltip.tsx`

**New lib module:**
- Add file or directory under `apps/web/lib/[feature]/`
- Use kebab-case filename
- Example: `apps/web/lib/reports/report-generator.ts`

**New AI tool:**
- Add handler to `apps/web/lib/ai/tools/`
- Register tool schema in `apps/web/lib/ai/tools/index.ts`
- Add case to `ToolExecutor.execute()` in `apps/web/lib/ai/tool-executor.ts`

**New database table:**
- Add migration as `apps/web/supabase/migrations/NNN_description.sql`
- Follow next sequential number (currently 019 is latest)
- Include RLS policies in the migration

**New unit test:**
- Mirror source path under `apps/web/tests/`
- Example: source at `lib/reports/report-generator.ts` → test at `tests/lib/reports/report-generator.test.ts`

**New E2E test:**
- Add `.spec.ts` under `apps/web/tests/e2e/smoke/` for smoke tests
- Reference `playwright.config.ts` for local, `playwright.prod.config.ts` for production

## Special Directories

**`.planning/`:**
- Purpose: GSD planning artifacts (codebase docs, phase plans, research)
- Generated: No
- Committed: Yes

**`.bmad-core/`, `.bmad-kevin-creator/`, etc.:**
- Purpose: BMAD agent framework configurations (non-application code)
- Generated: No
- Committed: Yes

**`apps/web/.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`apps/web/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`apps/web/supabase/migrations/`:**
- Purpose: SQL migration history
- Generated: No
- Committed: Yes (source of truth for schema)

**`apps/web/tests/fixtures/`:**
- Purpose: Static test data files
- Generated: No
- Committed: Yes

**`apps/web/design-system/`:**
- Purpose: Design token reference and style documentation
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-20*
