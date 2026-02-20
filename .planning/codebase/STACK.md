# Technology Stack

**Analysis Date:** 2026-02-20

## Languages

**Primary:**
- TypeScript 5.x - All application code in `apps/web/`, strict mode enabled
- SQL - Supabase migrations in `apps/web/supabase/migrations/`

**Secondary:**
- JavaScript - Config files only (`tailwind.config.cjs`, `postcss.config.mjs`, `eslint.config.mjs`)
- MDX - Blog content, page extensions include `.md` and `.mdx`

## Runtime

**Environment:**
- Node.js 20 (pinned in CI via `e2e-tests.yml`; local: v24.12.0 compatible)
- ES module type declared in `apps/web/package.json` (`"type": "module"`)

**Package Manager:**
- npm workspaces (root-level `package.json` defines `apps/*`, `packages/*`)
- Lockfile: `package-lock.json` present at root and `apps/web/`

## Frameworks

**Core:**
- Next.js 15.5.7 - App Router, deployed at `apps/web/`, Turbopack dev server
- React 19.1.0 - UI rendering
- Tailwind CSS 3.4.1 - Utility-first styling (CommonJS config at `apps/web/tailwind.config.cjs`)

**Testing:**
- Vitest 3.2.4 - Unit tests, jsdom environment, config at `apps/web/vitest.config.ts`
- Playwright 1.55.0 - E2E tests, config at `apps/web/playwright.config.ts` and `apps/web/playwright.prod.config.ts`
- @testing-library/react 16.3.0 - Component testing utilities

**Build/Dev:**
- Turbopack - Dev bundler (via `next dev --turbopack`)
- Next.js build - Production bundler
- PostCSS - CSS processing (`apps/web/postcss.config.mjs`)
- @next/mdx - MDX support for blog and content pages

## Key Dependencies

**AI/Core:**
- `@anthropic-ai/sdk` ^0.27.3 - Claude API client, used in `lib/ai/claude-client.ts`; model: `claude-sonnet-4-20250514`

**Database/Auth:**
- `@supabase/supabase-js` ^2.56.0 - Supabase JS client
- `@supabase/ssr` ^0.7.0 - SSR-safe Supabase wrappers (`lib/supabase/client.ts`, `lib/supabase/server.ts`)

**Payments:**
- `stripe` ^19.1.0 - Server-side Stripe SDK, API version `2024-12-18.acacia` (`lib/monetization/stripe-service.ts`)
- `@stripe/stripe-js` ^8.0.0 - Client-side Stripe.js

**State Management:**
- `zustand` ^5.0.8 - Client state store (`lib/stores/dualPaneStore.ts`)

**UI Components:**
- `@radix-ui/react-dropdown-menu` ^2.1.16 - Accessible dropdown primitives
- `@radix-ui/react-label` ^2.1.7 - Form label primitive
- `@radix-ui/react-separator` ^1.1.7 - Separator primitive
- `@radix-ui/react-slot` ^1.2.4 - Slot/composition primitive
- `lucide-react` ^0.542.0 - Icon library
- `class-variance-authority` ^0.7.1 - Variant-based class composition (shadcn/ui pattern)
- `clsx` ^2.1.1 - Conditional class merging
- `tailwind-merge` ^3.3.1 - Tailwind class conflict resolution

**Content/Rendering:**
- `react-markdown` ^10.1.0 - Markdown rendering in chat (`app/components/chat/MarkdownRenderer.tsx`)
- `react-syntax-highlighter` ^15.6.6 - Code block syntax highlighting
- `remark-gfm` ^4.0.1 - GitHub Flavored Markdown support
- `mermaid` ^11.12.0 - Diagram rendering (`app/components/canvas/MermaidRenderer.tsx`)
- `tldraw` ^4.0.2 - Canvas/whiteboard (`app/components/canvas/TldrawCanvas.tsx`)
- `gray-matter` ^4.0.3 - Frontmatter parsing for blog content
- `reading-time` ^1.5.0 - Blog post reading time estimation

**Export:**
- `@react-pdf/renderer` ^4.3.1 - PDF generation (`lib/export/pdf-generator.ts`, `lib/export/pdf-templates/`)
- `@react-email/components` ^0.5.6 - Email template components (in package.json, not actively used in app code)
- `resend` ^6.1.2 - Transactional email (in package.json; `resend-confirmation` page uses Supabase auth.resend, not Resend SDK directly)

**Forms/Validation:**
- `react-hook-form` ^7.62.0 - Form state management (`components/ui/form.tsx`)
- `@hookform/resolvers` ^5.2.1 - Validation resolver adapters
- `zod` ^4.1.5 - Schema validation (used in `lib/bmad/analysis/`)

**Auth/Security:**
- `jose` ^6.1.3 - JWT verification (`lib/auth/jwt-verify.ts`)
- `js-yaml` ^4.1.0 - YAML parsing
- `dotenv` ^17.2.1 - Env file loading

## Monorepo Packages

Internal packages at `packages/`, aliased via `tsconfig.json` paths:

| Package | Alias | Purpose |
|---------|-------|---------|
| `packages/shared/` | `@ideally/shared` | Shared TypeScript interfaces and utilities |
| `packages/ui/` | `@ideally/ui` | Reusable UI components |
| `packages/bmad-engine/` | `@ideally/bmad-engine` | BMAD analysis engine |
| `packages/canvas-engine/` | `@ideally/canvas-engine` | Canvas primitives |

Note: These packages exist structurally but app code primarily imports from local `@/*` paths.

## Configuration

**TypeScript:**
- `apps/web/tsconfig.json` - strict mode, bundler module resolution, paths alias `@/*` → `./*`
- Target: ES2017, JSX: preserve (Next.js handles transform)

**Next.js:**
- `apps/web/next.config.ts` - MDX enabled, ESLint/TypeScript build errors suppressed, security headers on `/api/*`
- Page extensions: `js, jsx, md, mdx, ts, tsx`

**Tailwind:**
- `apps/web/tailwind.config.cjs` - Custom "Wes Anderson inspired" design tokens; custom color palette (terracotta, forest, ink, cream, parchment); 8px spacing grid; shadcn/ui CSS variable compatibility layer

**ESLint:**
- `apps/web/eslint.config.mjs` - ESLint 9 flat config, `eslint-config-next` base

**Environment:**
- Next.js reads: `.env`, `.env.local`, `.env.production` (NOT `.env.test`)
- Template: `apps/web/.env.example`
- `LAUNCH_MODE=true` bypasses credit system during beta period

## Build Configuration

**Vercel:**
- Root `vercel.json`: `buildCommand: "npm run build"`, `outputDirectory: "apps/web/.next"`
- Auto-deploy on push to `main`

**CI:**
- GitHub Actions at `.github/workflows/e2e-tests.yml` - Node 20, Chromium only
- GitHub Actions at `.github/workflows/claude-code-review.yml` - `anthropics/claude-code-action@v1`

## Platform Requirements

**Development:**
- Node.js 20+ (CI pins to 20; local 24.x works)
- npm (workspace-aware)
- Supabase project credentials
- Anthropic API key

**Production:**
- Vercel (configured)
- Supabase project (PostgreSQL 17.4, managed)
- Stripe account with price IDs configured

---

*Stack analysis: 2026-02-20*
