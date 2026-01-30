# Technology Stack

**Analysis Date:** 2026-01-29

## Languages

**Primary:**
- TypeScript 5 - Full codebase (frontend, API routes, utilities)
- JSX/TSX - React components and Next.js pages
- SQL - Supabase migrations (`apps/web/supabase/migrations/`)

**Secondary:**
- JavaScript - CommonJS in build config (`tailwind.config.cjs`)
- YAML - Migration metadata

## Runtime

**Environment:**
- Node.js 18+ (referenced in vitest.config.ts `esbuild.target`)
- No .nvmrc file present; relies on environment defaults

**Package Manager:**
- npm (monorepo with workspaces)
- Lockfile: npm-shrinkwrap.json or package-lock.json (standard)

## Frameworks

**Core:**
- Next.js 15.5.7 - Full-stack React framework with App Router
- React 19.1.0 - UI components
- React DOM 19.1.0 - DOM rendering

**Styling & UI:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Class Variance Authority 0.7.1 - Component variant management
- Radix UI components:
  - `@radix-ui/react-dropdown-menu` 2.1.16
  - `@radix-ui/react-label` 2.1.7
  - `@radix-ui/react-separator` 1.1.7
  - `@radix-ui/react-slot` 1.2.4
- Lucide React 0.542.0 - Icon library

**Canvas & Visualization:**
- tldraw 4.0.2 - Collaborative whiteboard with v4 API
- Mermaid 11.12.0 - Diagram rendering (flow charts, sequences)

**AI & LLM:**
- @anthropic-ai/sdk 0.27.3 - Anthropic Claude API client with streaming and tool support

**Forms & Validation:**
- React Hook Form 7.62.0 - Form state management
- @hookform/resolvers 5.2.1 - Schema validation resolvers
- Zod 4.1.5 - TypeScript-first schema validation

**State Management:**
- Zustand 5.0.8 - Lightweight state management

**Data & Markdown:**
- React Markdown 10.1.0 - Markdown to React rendering
- Remark GFM 4.0.1 - GitHub Flavored Markdown plugin
- React Syntax Highlighter 15.6.6 - Code block highlighting
- JS-YAML 4.1.0 - YAML parsing

**Export & PDF:**
- @react-pdf/renderer 4.3.1 - PDF generation from React components
- @react-email/components 0.5.6 - Email-ready React components

**Testing:**
- Vitest 3.2.4 - Unit test runner (Vite-based, ESM-first)
- @vitest/ui 3.2.4 - Vitest dashboard UI
- @playwright/test 1.55.0 - E2E test framework
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/jest-dom 6.8.0 - DOM matchers for assertions
- jsdom 26.1.0 - DOM implementation for testing

**Build & Dev:**
- Turbopack - Next.js bundler (via `next dev --turbopack` in dev script)
- TypeScript 5 - Type checking
- ESLint 9 - Code linting
- eslint-config-next 15.5.7 - Next.js linting rules
- PostCSS 8.4.38 - CSS processing
- Autoprefixer 10.4.19 - Browser prefix insertion
- Dotenv 17.2.1 - Environment variable loading

**Utilities:**
- Clsx 2.1.1 - Conditional class name utility
- Tailwind Merge 3.3.1 - Merge Tailwind classes intelligently

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.56.0 - Supabase client (auth, database, realtime)
- @supabase/ssr 0.7.0 - Server-side rendering helpers for Supabase
- @supabase/auth-helpers-nextjs 0.10.0 - Next.js OAuth integration

**Monetization:**
- stripe 19.1.0 - Stripe server SDK (payments, webhooks, customers)
- @stripe/stripe-js 8.0.0 - Stripe client library (checkout redirect)

## Configuration

**Environment:**
- `.env.local` (development, not committed)
- `.env.example` (template for required variables)
- Key configs:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `ANTHROPIC_API_KEY` - Claude API key (server-only)
  - `STRIPE_SECRET_KEY` - Stripe secret (server-only)
  - `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
  - `NEXT_PUBLIC_APP_URL` - Application base URL
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
  - `LAUNCH_MODE` - Feature flag to bypass credits during launch

**Build:**
- `next.config.ts` - Next.js configuration with security headers
- `tsconfig.json` - TypeScript configuration with path aliases
  - `@/*` → `./*` (root imports)
  - `@ideally/shared`, `@ideally/ui`, `@ideally/bmad-engine`, `@ideally/canvas-engine` - Monorepo packages
- `tailwind.config.cjs` - Tailwind CSS theme with Wes Anderson palette
- `vitest.config.ts` - Vitest test runner configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `eslint.config.mjs` - ESLint configuration (ESM format)

## Platform Requirements

**Development:**
- Node.js 18+
- npm or yarn
- macOS/Linux/Windows with standard Node.js toolchain
- Turbopack support (integrated in Next.js 15.5)

**Production:**
- Vercel (deployed at https://thinkhaven.co)
- Edge Runtime compatible (middleware must avoid Node.js APIs)
- Requires all environment variables in Vercel dashboard

---

*Stack analysis: 2026-01-29*
