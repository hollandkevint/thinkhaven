# External Integrations

**Analysis Date:** 2026-02-20

## APIs & External Services

**AI/LLM:**
- Anthropic Claude API - Core AI for all chat sessions, coaching, Board of Directors feature
  - SDK: `@anthropic-ai/sdk` ^0.27.3
  - Client: `lib/ai/claude-client.ts` (singleton `claudeClient`)
  - Model: `claude-sonnet-4-20250514` (Claude Sonnet 4)
  - Usage: streaming responses, tool-call agentic loop (max 5 rounds, `MAX_TOOL_ROUNDS` in `app/api/chat/stream/route.ts`)
  - Auth env var: `ANTHROPIC_API_KEY`

**Payments:**
- Stripe - Checkout sessions, webhook events, refunds, customer management
  - SDK: `stripe` ^19.1.0 (server), `@stripe/stripe-js` ^8.0.0 (client)
  - Service: `lib/monetization/stripe-service.ts`
  - API version: `2024-12-18.acacia`
  - Auth env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Price ID env vars: `STRIPE_PRICE_ID_IDEA_VALIDATION`, `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PROFESSIONAL`, `STRIPE_PRICE_ID_BUSINESS`
  - Products: $99 Idea Validation (primary), credit packs at $19/$39/$79 (legacy)

**Email:**
- Resend - Package declared in `package.json` (^6.1.2) but Resend SDK not actively imported in application code
- Transactional emails are handled via Supabase Auth's built-in email (signup confirmation, magic link)
- `@react-email/components` ^0.5.6 present for template authoring

**CI/CD AI Review:**
- Anthropic Claude Code Action - Automated PR code review
  - Integration: `anthropics/claude-code-action@v1` in `.github/workflows/claude-code-review.yml`
  - Auth: `ANTHROPIC_API_KEY` GitHub secret
  - Known issue: intermittent crash on PR open (issue #911), `continue-on-error: true` set

## Data Storage

**Databases:**
- Supabase PostgreSQL 17.4 - Primary datastore for all user data, sessions, conversations
  - Connection via SSR-safe client wrappers
  - Server client: `lib/supabase/server.ts` - `createClient()` returns `null` when env missing; all callers must null-check
  - Browser client: `lib/supabase/client.ts` - exports null-safe `Proxy` during SSG
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service role: `SUPABASE_SERVICE_ROLE_KEY` (test helpers only)
  - JWT secret: `SUPABASE_JWT_SECRET` (used in `lib/auth/jwt-verify.ts` via `jose`)
  - Migrations: `apps/web/supabase/migrations/` (001-019, sequential, never skip)
  - RLS: enabled, policies enforced
  - Key DB function: `deduct_credit_transaction()` - always use for credit ops, never raw UPDATE

**Schema highlights (from migrations):**
- `001` - bmad method schema
- `002` - conversations and messages
- `003` - user_workspace table
- `005` - session credit system
- `007` - canvas columns
- `008` - message limits
- `009` - session artifacts
- `013-016` - beta access and triggers
- `017` - custom access token hook
- `019` - credit trigger fix

**File Storage:**
- No dedicated file storage service detected; PDF exports are generated on-demand and served via response streams

**Caching:**
- No external caching layer (Redis, Memcached) detected
- Next.js default caching applies to server components and fetch calls

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - primary identity provider
  - Email/password auth with signup confirmation
  - Google OAuth via Supabase OAuth flow
  - Callback route: `app/auth/callback/route.ts`
  - Resend confirmation page: `app/resend-confirmation/page.tsx`

**Google OAuth:**
  - Configured through Supabase (not direct Google SDK)
  - Client ID env var: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - Callback handled at `/auth/callback` with PKCE code exchange

**JWT Verification:**
  - `jose` library used in `lib/auth/jwt-verify.ts` for server-side JWT validation
  - Custom claims include `beta_approved` field (set via Supabase custom access token hook, migration 017)

**Beta Access:**
  - `lib/auth/beta-access.ts` - gates access during launch period
  - `lib/auth/admin.ts` - hardcoded admin email allowlist

**Middleware:**
  - `middleware.ts` is **disabled** (`middleware.ts.disabled`) - Edge Runtime incompatibility
  - Auth enforcement is done in API routes only

## Monitoring & Observability

**Error Tracking:**
- No third-party error tracking (Sentry, Datadog) detected
- Custom auth monitoring: `lib/monitoring/auth-logger.ts`, `lib/monitoring/auth-metrics.ts`, `lib/monitoring/alert-service.ts`
- Auth metrics API: `app/api/monitoring/auth-metrics/route.ts`
- Auth alerts API: `app/api/monitoring/alerts/route.ts`

**Logs:**
- `console.log`/`console.error` throughout; structured log objects with correlation IDs in auth flows
- No log aggregation service detected

**Environment Validation:**
- `lib/security/env-validator.ts` - validates required env vars on startup; exits process in production if critical vars missing

## CI/CD & Deployment

**Hosting:**
- Vercel - production deployment at https://thinkhaven.co
- Config: root `vercel.json` (`buildCommand: "npm run build"`, `outputDirectory: "apps/web/.next"`)
- Auto-deploys on push to `main`

**CI Pipeline:**
- GitHub Actions - `.github/workflows/e2e-tests.yml`
  - Triggers: push to `main`/`develop`, PRs to `main`
  - Node 20, Chromium only
  - Runs `playwright test --project=chromium` (7 smoke tests)
- GitHub Actions - `.github/workflows/claude-code-review.yml`
  - Automated review on PR open (`auto-review` job, `continue-on-error: true`)
  - Interactive `@claude` mention support in PR comments

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` (GET) - OAuth code exchange after Google login (Supabase PKCE flow)
- Stripe webhook endpoint not found as a separate route in `app/api/`; webhook verification logic exists in `lib/monetization/stripe-service.ts:constructWebhookEvent()` but no dedicated `app/api/webhook/stripe/route.ts` was detected. This may be a gap or handled elsewhere.

**Outgoing:**
- Stripe Checkout redirects to `APP_URL/pricing/success` and `APP_URL/validate/success` after payment
- Supabase Auth emails (signup confirmation, password reset) - sent by Supabase's email infrastructure

## Environment Configuration

**Required env vars (production):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_IDEA_VALIDATION
STRIPE_PRICE_ID_STARTER
STRIPE_PRICE_ID_PROFESSIONAL
STRIPE_PRICE_ID_BUSINESS
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

**Optional / beta controls:**
```
LAUNCH_MODE=true    # Bypasses credit system; server-only, not exposed to client
```

**Secrets location:**
- Local development: `apps/web/.env.local` (gitignored)
- Production: Vercel dashboard (Settings -> Environment Variables)
- CI: GitHub repository secrets

---

*Integration audit: 2026-02-20*
