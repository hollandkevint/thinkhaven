# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
thinkhaven/
├── app/                          # Next.js 15 App Router pages and API routes
│   ├── api/                      # Server-side API endpoints
│   ├── components/               # Page-specific React components
│   ├── dashboard/                # Dashboard page
│   ├── workspace/[id]/           # Dynamic workspace detail page
│   ├── login/                    # Authentication pages
│   ├── signup/
│   ├── account/
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── lib/                          # Domain services and business logic
│   ├── ai/                       # AI integration (Claude API)
│   ├── auth/                     # Authentication context
│   ├── bmad/                     # BMad Method engine
│   ├── supabase/                 # Database client factories
│   └── workspace/                # Workspace state management
├── packages/                     # Monorepo workspace packages
│   ├── ui/                       # Shared UI components (minimal)
│   ├── canvas-engine/            # Canvas integration (minimal)
│   ├── shared/                   # Shared types (minimal)
│   └── bmad-engine/              # BMad engine package (minimal)
├── supabase/                     # Database schema and migrations
│   ├── migrations/               # SQL migration files
│   └── schema.sql                # Full schema definition
├── docs/                         # Product documentation and PRD
│   ├── prd/                      # Product requirements (13 shards)
│   ├── architecture/
│   ├── testing/
│   └── guides/
├── .bmad-core/                   # BMAD Method expansion pack (synced)
├── .bmad-kevin-creator/          # Kevin creator expansion pack (synced)
├── .bmad-pmf-validation/         # PMF validation expansion pack (synced)
├── .bmad-product-leadership/     # Product leadership expansion pack (synced)
├── .planning/                    # GSD planning artifacts
│   ├── codebase/                 # Codebase analysis documents
│   ├── phases/                   # Phase plans
│   └── research/                 # Research notes
├── scripts/                      # Setup and utility scripts
├── public/                       # Static assets
├── package.json                  # Monorepo root package
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
├── CLAUDE.md                     # Claude Code instructions
└── PROJECT.md                    # Project overview
```

## Directory Purposes

**app/ (Next.js App Router):**
- Purpose: Page routes, layouts, and API endpoints
- Contains: Route-based file structure (`page.tsx`, `layout.tsx`, `route.ts`)
- Key files:
  - `app/layout.tsx`: Root layout with AuthProvider wrapper
  - `app/page.tsx`: Landing page with auth redirect logic
  - `app/dashboard/page.tsx`: Workspace list and creation
  - `app/workspace/[id]/page.tsx`: Dual-pane workspace interface

**app/api/ (API Routes):**
- Purpose: Server-side request handlers
- Contains: POST/GET handlers as `route.ts` files
- Key files:
  - `app/api/chat/stream/route.ts`: Streaming AI chat endpoint
  - `app/api/bmad/route.ts`: BMad session management endpoint

**app/components/ (Page Components):**
- Purpose: React components scoped to specific pages
- Contains: Component files organized by feature
- Key files:
  - `app/components/bmad/BmadInterface.tsx`: BMad session UI
  - `app/components/bmad/PathwaySelector.tsx`: Pathway selection UI
  - `app/components/bmad/ElicitationPanel.tsx`: Phase elicitation UI
  - `app/components/bmad/SessionManager.tsx`: Session state management
  - `app/components/bmad/useBmadSession.ts`: Session hook

**lib/ (Domain Services):**
- Purpose: Business logic decoupled from UI
- Contains: Service modules organized by domain
- Key files:
  - `lib/ai/claude-client.ts`: Anthropic API wrapper
  - `lib/ai/streaming.ts`: SSE encoding utilities
  - `lib/bmad/session-orchestrator.ts`: Session lifecycle manager
  - `lib/bmad/pathway-router.ts`: Pathway routing logic
  - `lib/bmad/template-engine.ts`: Template loading and execution
  - `lib/bmad/database.ts`: BMad-specific database operations
  - `lib/bmad/types.ts`: Core type definitions
  - `lib/auth/AuthContext.tsx`: Authentication React Context
  - `lib/supabase/client.ts`: Browser Supabase client factory
  - `lib/supabase/server.ts`: Server Supabase client factory

**supabase/ (Database):**
- Purpose: Database schema versioning and migrations
- Contains: SQL files numbered sequentially
- Key files:
  - `supabase/schema.sql`: Full schema (users, workspaces, chat tables)
  - `supabase/migrations/000_enable_extensions.sql`: UUID extension
  - `supabase/migrations/001_bmad_method_schema.sql`: BMad tables
  - `supabase/migrations/002_new_idea_pathway_schema.sql`: Pathway-specific tables

**packages/ (Monorepo Workspaces):**
- Purpose: Shared code for future multi-app architecture
- Contains: Package.json files with minimal exports
- Key files:
  - `packages/ui/index.ts`: UI component exports (empty)
  - `packages/shared/index.ts`: Shared types (empty)
  - `packages/canvas-engine/index.ts`: Canvas logic (empty)
  - `packages/bmad-engine/index.ts`: BMad engine (empty)
- **Note:** Packages defined but not populated (future refactor target)

**docs/ (Documentation):**
- Purpose: Product requirements and technical documentation
- Contains: Markdown files organized by topic
- Key files:
  - `docs/prd/`: 13 PRD shards (positioning, features, roadmap)
  - `docs/architecture/`: Architecture decision records
  - `docs/testing/`: Test plans and reports
  - `docs/guides/`: Setup and usage guides

**.bmad-* (Expansion Packs):**
- Purpose: BMAD Method framework content (templates, agents, workflows)
- Contains: YAML files synced from external repos
- Generated: Yes (via `npx bmad-method install`)
- Committed: Yes (for version tracking)
- **DO NOT EDIT:** Source of truth is external BMAD-METHOD repo

**.planning/ (GSD Artifacts):**
- Purpose: Planning documents created by GSD commands
- Contains: Codebase maps, phase plans, research notes
- Key files:
  - `.planning/codebase/ARCHITECTURE.md`: This document
  - `.planning/codebase/STRUCTURE.md`: Directory structure
  - `.planning/phases/`: Phase implementation plans

**scripts/ (Utilities):**
- Purpose: Setup and maintenance scripts
- Contains: Shell scripts and docs
- Key files:
  - `scripts/setup-mcp.sh`: MCP server configuration
  - `scripts/setup-supabase.md`: Database setup instructions

**public/ (Static Assets):**
- Purpose: Images, fonts, and other static files served directly
- Contains: Files accessible at `/filename` in browser
- Committed: Yes

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, AuthProvider initialization
- `app/page.tsx`: Landing page with auth redirect
- `app/dashboard/page.tsx`: Main app entry after login
- `app/workspace/[id]/page.tsx`: Workspace detail page

**Configuration:**
- `package.json`: Monorepo scripts and dependencies
- `next.config.ts`: Next.js configuration (headers, security)
- `tsconfig.json`: TypeScript compiler options
- `.env.local`: Environment variables (Supabase URL, API keys) - NOT COMMITTED
- `.env.example`: Example environment template

**Core Logic:**
- `lib/bmad/session-orchestrator.ts`: BMad session state machine
- `lib/ai/claude-client.ts`: AI API integration
- `lib/supabase/server.ts`: Server-side database client
- `lib/auth/AuthContext.tsx`: Authentication state

**Testing:**
- `apps/web/tests/integration/`: Integration tests (Playwright)
- `apps/web/tests/bmad/`: BMad-specific tests (Vitest)
- `apps/web/tests/components/`: Component tests
- `apps/web/tests/canvas/`: Canvas tests

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: `ComponentName.tsx` (PascalCase)
- Hooks: `useHookName.ts` (camelCase with "use" prefix)
- Services: `service-name.ts` (kebab-case)
- Types: `types.ts` (often co-located with service)

**Directories:**
- App routes: `kebab-case` (e.g., `workspace/[id]/`)
- Dynamic routes: `[param]` (Next.js convention)
- Domain modules: `kebab-case` (e.g., `lib/bmad/`)
- Components: `camelCase` or component name (e.g., `app/components/bmad/`)

**Variables/Functions:**
- React components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` (not consistently applied)
- Types/Interfaces: `PascalCase`

**Imports:**
- Absolute imports use `@/` alias (mapped to project root via `tsconfig.json`)
- Relative imports for co-located files
- Example: `import { createClient } from '@/lib/supabase/server'`

## Where to Add New Code

**New Page:**
- Primary code: `app/your-page/page.tsx`
- Layout (if custom): `app/your-page/layout.tsx`
- Tests: `apps/web/tests/components/your-page.test.tsx`

**New API Endpoint:**
- Implementation: `app/api/your-endpoint/route.ts`
- Tests: `apps/web/tests/integration/your-endpoint.test.ts`

**New Component:**
- Shared component: `app/components/your-component/YourComponent.tsx`
- Page-specific: `app/your-page/components/YourComponent.tsx`
- Export: `app/components/your-component/index.ts` (optional barrel)

**New Domain Service:**
- Implementation: `lib/your-domain/service-name.ts`
- Types: `lib/your-domain/types.ts` (if substantial)
- Tests: `apps/web/tests/lib/your-domain/service-name.test.ts`

**New Database Table:**
- Migration: `supabase/migrations/NNN_description.sql` (increment number)
- Update: `supabase/schema.sql` (append new table definition)
- Types: `lib/your-domain/types.ts` (TypeScript interfaces)

**New BMad Feature:**
- Template: `.bmad-core/templates/your-template.yaml` (edit in source repo)
- Generator: `lib/bmad/generators/your-generator.ts`
- Pathway config: Update `lib/bmad/pathway-router.ts` pathway definitions
- Tests: `apps/web/tests/bmad/your-feature.test.tsx`

**Utilities:**
- Shared helpers: `lib/utils/` (create if needed)
- BMad-specific: `lib/bmad/utils/` (if domain-specific)

## Special Directories

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (on `npm run build` or `npm run dev`)
- Committed: No (.gitignore)

**node_modules/:**
- Purpose: npm package installations
- Generated: Yes (on `npm install`)
- Committed: No (.gitignore)

**.vercel/:**
- Purpose: Vercel deployment configuration
- Generated: Yes (on deployment)
- Committed: No (.gitignore)

**.git/:**
- Purpose: Git version control
- Generated: Yes (on `git init`)
- Committed: No (internal Git data)

**thinkhaven-artifacts/:**
- Purpose: Unknown (appears to be a nested git repo)
- Generated: Unknown
- Committed: Yes (has own .git directory)
- **Note:** May be legacy or accidental inclusion

**archived/:**
- Purpose: Old migrations and releases
- Contains: `legacy-migrations/`, `releases/`
- Committed: Yes
- **Note:** Historical data, not actively used

**naming-project/:**
- Purpose: Unknown (empty or minimal content)
- Committed: Likely (in directory listing)
- **Note:** May be legacy or temporary

## Import Path Aliases

**Configured in tsconfig.json:**
- `@/*`: Maps to project root
- Example: `import { createClient } from '@/lib/supabase/server'`

**Common patterns:**
- `@/lib/`: Domain services
- `@/app/`: App router files (rarely imported, mostly for API routes)
- `@/public/`: Static assets (use `/filename` in browser, not imports)

## Monorepo Workspaces

**Defined in root package.json:**
```json
"workspaces": [
  "apps/*",
  "packages/*"
]
```

**Active workspace:**
- `apps/web/`: Main Next.js application (only populated workspace)

**Dormant workspaces:**
- `packages/ui/`, `packages/canvas-engine/`, `packages/shared/`, `packages/bmad-engine/`
- Defined in package.json but not implemented
- Future refactor target for shared code extraction

**Workspace commands:**
```bash
npm run dev --workspace=apps/web       # Run dev server
npm run build --workspace=apps/web     # Build app
```

---

*Structure analysis: 2026-02-14*
