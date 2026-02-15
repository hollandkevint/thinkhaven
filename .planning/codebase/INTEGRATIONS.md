# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**AI/ML:**
- Anthropic Claude - AI coaching conversations
  - SDK/Client: `@anthropic-ai/sdk` ^0.27.3
  - Auth: `ANTHROPIC_API_KEY`
  - Implementation: `apps/web/lib/ai/claude-client.ts`, `lib/ai/claude-client.ts`
  - Model: Claude 3+ with tool use support
  - Features: Streaming responses, tool calling, conversation continuity

- OpenAI (Optional) - Context bridging and semantic search
  - Auth: `OPENAI_API_KEY`
  - Feature flag: `NEXT_PUBLIC_ENABLE_CONTEXT_BRIDGING`
  - Purpose: Semantic search across knowledge base

**Payments:**
- Stripe - Monetization and subscriptions
  - SDK/Client: `stripe` ^19.1.0 (server), `@stripe/stripe-js` ^8.0.0 (client)
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Implementation: `apps/web/lib/monetization/stripe-service.ts`
  - Products:
    - Idea Validation: `STRIPE_PRICE_ID_IDEA_VALIDATION`
    - Starter: `STRIPE_PRICE_ID_STARTER`
    - Professional: `STRIPE_PRICE_ID_PROFESSIONAL`
    - Business: `STRIPE_PRICE_ID_BUSINESS`
  - Checkout API route: `apps/web/app/api/checkout/idea-validation/route.ts`
  - Webhook support: Signature verification with `STRIPE_WEBHOOK_SECRET`

**Email:**
- Resend - Transactional email delivery
  - SDK/Client: `resend` ^6.1.2
  - Templates: `@react-email/components` ^0.5.6
  - Implementation: Email templates as React components

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/ssr` ^0.7.0, `@supabase/supabase-js` ^2.56.0
  - Implementation:
    - Server: `lib/supabase/server.ts`, `apps/web/lib/supabase/server.ts`
    - Client: `lib/supabase/client.ts`, `apps/web/lib/supabase/client.ts`
    - Middleware: `lib/supabase/middleware.ts`, `apps/web/middleware.ts`
  - Schema: Comprehensive BMAD Method tables
    - `bmad_sessions` - User coaching sessions
    - `bmad_phase_allocations` - Time tracking per phase
    - `bmad_session_progress` - Completion tracking
    - `bmad_user_responses` - User input history
    - `bmad_elicitation_history` - Choice tracking
    - `bmad_persona_evolution` - Persona transitions
    - `bmad_action_items` - Generated action items
    - `bmad_pathway_analytics` - Intent analysis tracking
    - `bmad_knowledge_references` - Knowledge base links
    - `bmad_phase_outputs` - Phase deliverables
    - `bmad_template_outputs` - Template-generated content
    - `bmad_generated_documents` - Final documents
  - Database access layer: `apps/web/lib/bmad/database.ts`, `lib/bmad/database.ts`
  - Features: Row-level security (RLS), realtime subscriptions, server-side rendering support

**File Storage:**
- Local filesystem only (no cloud object storage detected)
- Generated documents stored in database as content strings
- PDF generation via `@react-pdf/renderer` ^4.3.1

**Caching:**
- None detected (no Redis/Memcached integration)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: OAuth callback at `apps/web/app/auth/callback/route.ts`
  - Providers: Google OAuth configured (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` referenced in tests)
  - Session management: Cookie-based via `@supabase/ssr`
  - Middleware: Auth state maintained across requests in `apps/web/middleware.ts`
  - Guest mode: Supported via `apps/web/lib/guest/session-store.ts`

## Monitoring & Observability

**Error Tracking:**
- Custom error monitoring
  - Implementation: `apps/web/lib/bmad/error-monitor.ts`
  - Custom error types: `BmadMethodError` with error codes
  - No external service (Sentry/Bugsnag) detected

**Logs:**
- Console-based logging
- Debug logging in Claude client: `apps/web/lib/ai/claude-client.ts`
- Monitoring API routes:
  - `apps/web/app/api/monitoring/auth-metrics/route.ts`
  - `apps/web/app/api/monitoring/alerts/route.ts`

**Analytics:**
- Custom pathway analytics tracked in `bmad_pathway_analytics` table
- Intent analysis and recommendation tracking

## CI/CD & Deployment

**Hosting:**
- Vercel
  - Config: `vercel.json`
  - Build command: `npm run build`
  - Output directory: `apps/web/.next`
  - Environment: Production build via `npm run build:prod`

**CI Pipeline:**
- None detected (no GitHub Actions, CircleCI, or other CI config files)
- Playwright test commands available:
  - `npm run test:e2e` - E2E tests
  - `npm run test:smoke` - Smoke tests
  - `npm run test:core` - Core functionality tests

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `ANTHROPIC_API_KEY` - Claude API key
- `STRIPE_SECRET_KEY` - Stripe secret key (production)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature verification

**Optional env vars:**
- `OPENAI_API_KEY` - For context bridging feature
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth
- `STRIPE_PRICE_ID_*` - Stripe product price IDs
- Feature flags (all `NEXT_PUBLIC_ENABLE_*` prefixed)
- Configuration limits (max elements, timeouts, thresholds)

**Secrets location:**
- `.env.local` for local development (gitignored)
- Vercel environment variables for production
- `.env.example` documents structure (no secrets)

## Webhooks & Callbacks

**Incoming:**
- Stripe webhooks
  - Purpose: Payment event processing
  - Verification: Signature validation via `STRIPE_WEBHOOK_SECRET`
  - Implementation: `apps/web/lib/monetization/stripe-service.ts` (webhook verification logic)

- OAuth callbacks
  - Google OAuth: `apps/web/app/auth/callback/route.ts`
  - Supabase Auth flow completion

**Outgoing:**
- None detected (no webhook dispatch to external services)

## Internal APIs

**REST Endpoints:**
- `apps/web/app/api/chat/stream/route.ts` - Streaming chat with Claude
- `apps/web/app/api/chat/guest/route.ts` - Guest mode chat
- `apps/web/app/api/chat/export/route.ts` - Conversation export
- `apps/web/app/api/bmad/route.ts` - BMAD session operations
- `apps/web/app/api/assessment/submit/route.ts` - Assessment submission
- `apps/web/app/api/checkout/idea-validation/route.ts` - Stripe checkout creation
- `apps/web/app/api/feedback/trial/route.ts` - Trial feedback collection
- `apps/web/app/api/credits/balance/route.ts` - Credit balance checking
- `apps/web/app/api/monitoring/auth-metrics/route.ts` - Auth metrics
- `apps/web/app/api/monitoring/alerts/route.ts` - Alert management

---

*Integration audit: 2026-02-14*
