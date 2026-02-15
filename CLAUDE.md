# CLAUDE.md

*Last Updated: 2026-02-15*

## Project Context
**ThinkHaven** - Decision accelerator for structured AI sessions
- **Tech Stack**: Next.js 15.5, React 19, TypeScript, Supabase, Stripe, Anthropic Claude
- **Architecture**: Monorepo with Next.js app in `apps/web/`
- **Deployment**: Vercel project `thinkhaven` (https://thinkhaven.co)

## Essential Commands

All commands run from `apps/web/`:
```bash
npm run dev              # Dev server (localhost:3000, Turbopack)
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Unit tests (Vitest, watch mode)
npm run test:run         # Unit tests (once)
npm run test:e2e         # E2E tests (Playwright, 7 smoke tests)
```

Migrations: `apps/web/supabase/migrations/` (001 → 011, sequential, never skip)

## Route Architecture

**Protected** (`/app/*` - requires auth):
- `/app` - Dashboard
- `/app/new` - New session
- `/app/session/[id]` - Active session workspace
- `/app/account` - Account settings

**Public**: `/` (landing), `/try` (guest, 5 msg limit), `/demo`, `/assessment`

**Legacy redirects**: `/dashboard` → `/app`, `/bmad` → `/app/new`, `/workspace/[id]` → `/app/session/[id]`, `/account` → `/app/account`

## Environment Variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

## Testing

- Unit tests: `**/*.test.{ts,tsx}`, setup in `tests/setup.ts`
- E2E: `tests/e2e/smoke/health.spec.ts` - 7 public route smoke tests, all passing in CI
- Config: `vitest.config.ts`, `playwright.config.ts`
- 45/71 unit test files fail (pre-existing, not regressions). mary-persona: 67/67 pass.

## Configuration

- `next.config.ts` - Next.js config
- `tailwind.config.cjs` - Tailwind (CommonJS format)
- `eslint.config.mjs` - Linting rules

## Common Pitfalls

1. **Middleware disabled** (`middleware.ts.disabled`) - Edge Runtime incompatibility. Auth via API routes only.
2. **Credit deduction** - ALWAYS use `deduct_credit_transaction()` for atomicity, never manual UPDATE
3. **File-system routing** - Every route needs a `page.tsx` file
4. **Migration order** - Sequential (001 → 011), never skip
5. **Stripe webhooks** - Verify signatures with `stripe-service.ts.constructWebhookEvent()`
6. **Tldraw v4** - Use `getSnapshot(store)` / `loadSnapshot(store, data)`, NOT instance methods
7. **Agentic tool loop** - Max 5 rounds per message (`MAX_TOOL_ROUNDS` in `/api/chat/stream/route.ts`)
8. **Tool results** - Use `ToolExecutor.formatResultsForClaude()` for Claude's expected `tool_result` format
9. **Session ops** - Use `session-primitives.ts` functions, not direct Supabase calls
10. **Supabase server client** - `createClient()` returns null when env vars missing; callers must null-check
11. **Next.js env files** - Only reads `.env`, `.env.local`, `.env.production` (NOT `.env.test`)
12. **SSG safety** - `lib/supabase/client.ts` exports a no-op Proxy for SSG; use for client components

## Production Deployment

- **Vercel**: Auto-deploys on push to main
- **Manual**: `cd apps/web && vercel --prod`
- **Env vars**: Set via Vercel dashboard (Settings -> Environment Variables)
- **URL**: https://thinkhaven.co
