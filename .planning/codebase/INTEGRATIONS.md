# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**AI Assistant:**
- Claude API (Anthropic)
  - Service: Generative AI for business analysis and coaching
  - SDK: `@anthropic-ai/sdk` 0.27.3
  - Model: claude-sonnet-4-20250514
  - Features: Streaming responses, tool calling (9 agent tools), token counting
  - Auth: `ANTHROPIC_API_KEY` (server-only, rotated in Vercel dashboard)
  - Location: `lib/ai/claude-client.ts`

**Authentication:**
- Google OAuth 2.0
  - Provider: Google Cloud Console
  - Client ID: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (public)
  - Flow: OAuth redirect → callback at `/auth/callback/route.ts`
  - Session persistence: Supabase Auth with OAuth provider
  - Implementation: `lib/auth/AuthContext.tsx`, `app/auth/callback/route.ts`

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, scoped)
  - Server auth: Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
  - Client: `@supabase/supabase-js` (realtime client)
  - Server: `@supabase/ssr` (cookie-based session handling)
  - Migrations: Sequential (001-012 in `apps/web/supabase/migrations/`)
  - Tables:
    - `auth.users` - Supabase Auth managed
    - `bmad_sessions` - Strategic session state
    - `conversations`, `messages` - Chat history
    - `user_workspace` - Canvas autosave
    - `user_credits`, `credit_transactions` - Monetization
    - `credit_packages`, `payment_history` - Payment records
    - `trial_feedback` - Trial user feedback
    - Additional tables in migrations for artifacts, canvas state, persona tracking

**File Storage:**
- Local filesystem only (no cloud storage for files currently)
- PDF exports generated in-memory via `@react-pdf/renderer`

**Caching:**
- None detected (HTTP caching via Next.js headers)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Methods:
    - OAuth (Google): Managed by Supabase Auth
    - Email/password: Supabase Auth with confirmation emails
  - Implementation: `@supabase/auth-helpers-nextjs` 0.10.0
  - Session: Cookie-based (SSR-compatible)
  - Location: `lib/auth/AuthContext.tsx`

**Email Confirmation:**
- Supabase email service (built-in)
- Template: Email magic link or confirmation link
- Resend UI: `/resend-confirmation` page

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, or similar)

**Logs:**
- Console.log throughout codebase
- Structured logging in `lib/monitoring/auth-logger.ts`
- Logs include:
  - Auth initiation/success/failure with correlation IDs
  - Session refresh events
  - OAuth flow events with latency
  - Claude API calls and errors
  - Database operations

**Monitoring Endpoints:**
- `/api/monitoring/auth-metrics` - Authentication metrics (GET)
- `/api/monitoring/alerts` - System alerts (GET)
- `lib/monitoring/alert-service.ts` - Alert configuration (webhook support)

## CI/CD & Deployment

**Hosting:**
- Vercel (production at https://thinkhaven.co)
- Vercel project: `thinkhaven`
- Root directory: `apps/web/` (configured in Vercel project settings)
- Auto-deploys on push to main branch

**CI Pipeline:**
- GitHub Actions with 2 active workflows:
  - `.github/workflows/e2e-tests.yml` - Playwright E2E tests on push (7 smoke tests)
  - `.github/workflows/claude-code-review.yml` - Claude Code review on PRs (OIDC authentication)
- Test coverage: 7 smoke tests verifying public routes load

## Environment Configuration

**Required env vars:**

**Public (exposed to client):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (scoped to public access)
- `NEXT_PUBLIC_APP_URL` - Base URL for redirects (default: https://thinkhaven.co)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

**Server-only (secret):**
- `ANTHROPIC_API_KEY` - Claude API key
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `STRIPE_SECRET_KEY` - Stripe API secret
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `LAUNCH_MODE` - Feature flag (true/false) to bypass credit system

**Secrets location:**
- Development: `.env.local` (not committed)
- Production: Vercel dashboard (Settings → Environment Variables)
- Template: `.env.example` documents required variables

**Stripe configuration (env or Stripe dashboard):**
- `STRIPE_PRICE_ID_STARTER` - Price ID for 5-credit pack
- `STRIPE_PRICE_ID_PROFESSIONAL` - Price ID for 10-credit pack
- `STRIPE_PRICE_ID_BUSINESS` - Price ID for 20-credit pack
- `STRIPE_PRICE_ID_IDEA_VALIDATION` - Price ID for $99 validation product

## Webhooks & Callbacks

**Incoming (events received by app):**
- Stripe Webhooks (no endpoint detected yet, but infrastructure in place)
  - Expected events: `checkout.session.completed`, `payment_intent.succeeded`
  - Verification: `stripe-service.constructWebhookEvent()` validates HMAC signature
  - Location: Would be `/api/stripe/webhooks` (not yet created)

**Callback Routes:**
- `/auth/callback` - OAuth callback from Google/Supabase
  - Handles: Code exchange, session creation, error handling with logging

**Outgoing (events sent elsewhere):**
- Alert webhooks (optional, configured in `lib/monitoring/alert-service.ts`)
  - Can send to custom webhook URL if configured

## Payment Processing

**Stripe Integration:**
- Server SDK: `stripe` 19.1.0
- Client: `@stripe/stripe-js` 8.0.0
- Features:
  - Checkout sessions (mode: 'payment')
  - Payment intent retrieval
  - Customer management
  - Refund processing
  - Tax calculation (automatic tax enabled)
  - Test mode support (test clocks)
- API Version: 2024-12-18.acacia (updated per Stripe docs)
- Endpoints:
  - `/api/checkout/idea-validation` - Create checkout for $99 validation product
  - Payment success: `/validate/success?session_id={CHECKOUT_SESSION_ID}`
  - Payment cancel: `/?cancelled=true`
- Products:
  - Idea Validation ($99) - Primary product with 30-day guarantee
  - Credit packages (Starter $19, Professional $39, Business $79) - Legacy for existing users
- Database integration: Payment records stored in `payment_history` table with order reconciliation

## Rate Limiting & Quotas

**Claude API:**
- No explicit rate limiting in code
- Token-based billing tracked in `lib/ai/claude-client.ts`
- Estimated costs: Input $3/1M tokens, Output $15/1M tokens

**Stripe:**
- No explicit rate limiting in code
- Test mode for development (test clocks available)

**Supabase:**
- Database connection pooling (default Next.js + Supabase SSR)
- Row-level security (RLS) enforced for credit deductions
- Concurrent connections: Standard Supabase tier limits

## Data Privacy & Security

**Auth Security:**
- OAuth tokens: Session-based, never exposed to client
- API keys: Server-only environment variables
- Webhook validation: HMAC signature verification with `STRIPE_WEBHOOK_SECRET`

**Data Access:**
- Supabase RLS policies (defined in migrations)
- Credit deductions use row-level locking for atomicity
- Service role key restricted to server-side operations only

**API Security:**
- Content-Type headers: `application/json`
- XSS protection: `X-XSS-Protection: 1; mode=block`
- Clickjacking protection: `X-Frame-Options: DENY`
- MIME type sniffing: `X-Content-Type-Options: nosniff`
- Referrer policy: `strict-origin-when-cross-origin`

---

*Integration audit: 2026-01-29*
