# Technology Stack

**Analysis Date:** 2026-02-14

## Languages

**Primary:**
- TypeScript 5.x - All application code (frontend, backend, packages)
- JavaScript ES2017+ - Config files and scripts

**Secondary:**
- MDX - Content and documentation (`@mdx-js/loader` ^3.1.1, `@mdx-js/react` ^3.1.1)

## Runtime

**Environment:**
- Node.js v24.12.0

**Package Manager:**
- npm 11.6.2
- Lockfile: `package-lock.json` present (npm workspaces monorepo)

## Frameworks

**Core:**
- Next.js 15.5.7 - React framework with App Router
- React 19.1.0 - UI library
- React DOM 19.1.0 - React renderer

**Testing:**
- Vitest ^3.2.4 - Unit testing with jsdom environment
- Playwright ^1.55.0 - E2E testing (desktop Chrome + mobile)
- Testing Library React ^16.3.0 - Component testing utilities
- Testing Library Jest-DOM ^6.8.0 - DOM matchers

**Build/Dev:**
- Turbopack - Next.js dev bundler (`next dev --turbopack`)
- TypeScript ^5.x - Type checking
- ESLint ^9 - Linting with Next.js config
- PostCSS ^8.4.38 - CSS processing
- Tailwind CSS ^3.4.1 - Utility-first styling

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` ^0.27.3 - Claude AI integration for coaching conversations
- `@supabase/ssr` ^0.7.0 - Supabase client with SSR support
- `@supabase/supabase-js` ^2.56.0 - Supabase database and auth
- `stripe` ^19.1.0 - Payment processing (server-side)
- `@stripe/stripe-js` ^8.0.0 - Stripe client-side SDK
- `zod` ^4.1.5 - Schema validation
- `zustand` ^5.0.8 - State management

**UI & Visualization:**
- `@radix-ui/react-*` - Accessible UI primitives (dropdown, label, separator, slot)
- `lucide-react` ^0.542.0 - Icon library
- `tldraw` ^4.0.2 - Canvas/drawing functionality
- `mermaid` ^11.12.0 - Diagram rendering
- `@react-pdf/renderer` ^4.3.1 - PDF generation

**Content Processing:**
- `react-markdown` ^10.1.0 - Markdown rendering
- `remark-gfm` ^4.0.1 - GitHub Flavored Markdown support
- `react-syntax-highlighter` ^15.6.6 - Code syntax highlighting
- `gray-matter` ^4.0.3 - Frontmatter parsing
- `reading-time` ^1.5.0 - Reading time estimation

**Forms & Validation:**
- `react-hook-form` ^7.62.0 - Form state management
- `@hookform/resolvers` ^5.2.1 - Validation resolvers

**Infrastructure:**
- `jose` ^6.1.3 - JWT operations
- `resend` ^6.1.2 - Email delivery
- `@react-email/components` ^0.5.6 - Email templates
- `dotenv` ^17.2.1 - Environment variable loading
- `js-yaml` ^4.1.0 - YAML parsing (for BMAD templates)

**Styling Utilities:**
- `class-variance-authority` ^0.7.1 - Variant composition
- `clsx` ^2.1.1 - Class name utilities
- `tailwind-merge` ^3.3.1 - Tailwind class merging
- `tw-animate-css` ^1.3.8 - Tailwind animations

## Configuration

**Environment:**
- `.env.local` for local development
- `.env.example` documents required variables
- Configuration loaded via Next.js env support + `dotenv`

**Build:**
- `next.config.ts` - Next.js configuration with security headers
- `tsconfig.json` - TypeScript compiler options (ES2017 target, ESNext module)
- `tailwind.config.cjs` - Tailwind theme with Wes Anderson-inspired design system
- `eslint.config.mjs` - ESLint flat config extending Next.js rules
- `postcss.config.mjs` - PostCSS with Tailwind
- `vitest.config.ts` - Vitest test configuration
- `playwright.config.ts` - Playwright E2E test configuration

**Workspace Structure:**
- Monorepo with npm workspaces
- `apps/web/` - Main Next.js application
- `packages/shared/` - TypeScript interfaces and utilities
- `packages/ui/` - Reusable UI components
- `packages/bmad-engine/` - YAML template parser and coaching logic engine
- `packages/canvas-engine/` - Canvas rendering (Excalidraw-based)

## Platform Requirements

**Development:**
- Node.js 24.x
- npm 11.x
- TypeScript 5.x knowledge

**Production:**
- Vercel deployment (configured via `vercel.json`)
- Supabase PostgreSQL database
- Anthropic API access (Claude)
- Stripe account (payments)
- Optional: OpenAI API (context bridging)
- Optional: Resend account (email delivery)

---

*Stack analysis: 2026-02-14*
