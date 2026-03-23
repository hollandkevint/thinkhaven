---
title: "ThinkHaven Multi-Sprint Product Roadmap"
type: feat
date: 2026-03-22
deepened: 2026-03-22
supersedes: docs/plans/2026-03-16-feat-thinkhaven-next-phase-plan.md (Phases 2-5)
status: active
---

# ThinkHaven Multi-Sprint Product Roadmap

## Enhancement Summary

**Deepened on:** 2026-03-22
**Research agents used:** 10 total (4 best-practices/framework-docs researchers, architecture-strategist, security-sentinel, performance-oracle, code-simplicity-reviewer, kieran-typescript-reviewer, agent-native-reviewer, spec-flow-analyzer)

### Key Improvements from Deepening
1. **LAUNCH_MODE is dual-purpose and must be split** before Sprint 3. It controls both message limits AND credit bypass. Flipping it breaks one system while enabling the other.
2. **Guest migration never fires after signup** because migration only runs on `/try` page, but users land on `/app` after auth. Requires moving migration to dashboard mount.
3. **Sprint 4 bundle work should move to Sprint 0** (before analytics). Provider splitting and dynamic imports make every subsequent sprint's measurements valid.
4. **Simplicity review cut 60% of scope.** 6 sprints collapse to 3 for a pre-PMF product. PDF export, voice input, email pipeline, mobile responsive, board cross-referencing all deferred.
5. **PostHog session recordings will capture chat content** (business strategies, revenue projections). Masking is P0 security requirement.
6. **Credit system has no signup grant.** When LAUNCH_MODE turns off, all users have 0 credits. Need migration + trigger.
7. **4 agent-native blind spots found.** Mary can't set titles, export canvas, see credit balance, or create share links. Each sprint should add tool parity.
8. **Stripe checkout mode is `payment` (one-time) but roadmap says $19/month subscription.** Fundamental model decision needed before Sprint 3.

### Showstoppers Found and Resolved
- `session-migration.ts` returns `workspaceId` but not `sessionId` (can't redirect to migrated session)
- `SignupPromptModal` close button leaves user with disabled input and no CTA to re-open
- `increment_message_count` RPC lacks `user_id` check (IDOR: any user can increment another's count)
- No `user_credits` row created on signup (credit deduction fails when LAUNCH_MODE turns off)
- Success page at `/validate/success` doesn't verify payment server-side

### Critical Decisions Required Before Implementation
1. **Credits: per-session or per-message?** The code is ambiguous. `CreditGuard` says "sessions." `CREDIT_PACKAGES` define credit counts. But `deductCredit()` is never called in the chat stream. This cascades into every monetization UI decision.
2. **Pricing model: one-time credit packs or monthly subscription?** `stripe-service.ts` uses `mode: 'payment'`. The roadmap says "$19/month." Pick one before Sprint 3.
3. **Existing beta users when LAUNCH_MODE turns off:** Do they get a retroactive credit grant? Keep unlimited access via flag? Data migration needed.

---

## Context

All recent plans are shipped or superseded:
- Progressive Session Loop + Lean Canvas (PR #21, merged 2026-03-17)
- Per-Session Isolated Data Model (merged 2026-03-16)
- Session UX Overhaul: Chat-First (merged 2026-03-15)
- Security hardening: guest endpoint, CORS, monitoring, credits (PR #22, merged 2026-03-22)

The GSD Beta Launch milestone (`.planning/ROADMAP.md`) is 3/4 phases complete and stale since Feb 2. Phase 4 (Analytics) was never started. That milestone should be archived.

**Current product state:** Users can sign up, start a session, get challenged by Mary through 3 structured loops, see a Lean Canvas fill progressively, and bring in the Board of Directors. Guest flow works with 10 message limit. The core value loop exists. What's missing: conversion, monetization, retention, and polish.

**This roadmap covers 3 focused sprints (~6 weeks) organized by what unlocks the most learning.** After Sprint 3, reassess based on data.

---

## Sprint 0: Performance Foundation (2-3 hours, do immediately)

**Goal:** Reduce baseline bundle, split providers, enable measurement. Every subsequent sprint benefits.

### Research Insights: Why First

The performance oracle found zero `next/dynamic` imports in the codebase. `MarkdownRenderer` statically imports `react-syntax-highlighter` (~200KB+ gzipped). `AuthProvider` + `WorkspaceProvider` wrap ALL routes including public ones (`/`, `/try`, `/login`), firing `supabase.auth.getSession()` on every page load. `tldraw` is in `package.json` but has zero imports anywhere.

Fixing this first makes all subsequent analytics measurements valid. PostHog added to an unoptimized bundle gives misleading FCP/LCP baselines.

### Tasks

1. **Split providers out of root layout.** Create `app/(app)/layout.tsx` that wraps only `/app/*` routes with `AuthProvider` + `WorkspaceProvider`. Root layout keeps only fonts and HTML shell. Public pages stop initializing Supabase auth on load.
2. **Dynamic import `MarkdownRenderer`.** Use `next/dynamic` with `ssr: false` and a skeleton loading state. Saves ~200KB from initial bundle.
3. **Remove `tldraw` from `package.json`.** Zero imports exist. Dead weight.
4. **Add `optimizePackageImports: ['react-syntax-highlighter']`** to `next.config.ts`.
5. **Install `@next/bundle-analyzer`** as dev dependency. Run `ANALYZE=true npm run build` to baseline.
6. **Add `ANTHROPIC_MODEL` env var** to `claude-client.ts`. One-line change per occurrence (5 places). Enables switching to Haiku for cost control immediately.

**Files:** `apps/web/app/layout.tsx`, `apps/web/app/(app)/layout.tsx` (new), `apps/web/next.config.ts`, `apps/web/package.json`, `apps/web/lib/ai/claude-client.ts`

---

## Sprint 1: Convert Guests to Users (Week 1-2)

**Goal:** Instrument the app so you can measure. Fix the guest-to-paid path so there IS something to measure.

**Why first:** You can't optimize what you can't see. The conversion funnel has 3+ broken steps that make the guest-to-paid path non-functional.

### 1a. PostHog Integration

**Effort:** 2-3 hours

### Research Insights: PostHog + Next.js 15

Use `posthog-js` directly (not `@posthog/next` which adds unnecessary complexity). Key patterns from the best-practices researcher:

- **Provider pattern:** Client component wrapper in `app/providers.tsx` with `'use client'`. Initialize with `person_profiles: 'identified_only'` (saves money, anonymous visitors don't create person profiles). Set `capture_pageview: false` and handle manually via `usePathname()`.
- **Proxy via rewrites** in `next.config.ts` (`/ingest/*` -> `us.i.posthog.com/*`). Dodges ad blockers without middleware (which is disabled).
- **Env-gating:** `if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>` -- zero PostHog code in dev/CI.
- **Supabase identify:** Add `posthog.identify(user.id)` in `AuthContext.tsx`'s `onAuthStateChange` handler on `SIGNED_IN`, `posthog.reset()` on `SIGNED_OUT`. This merges anonymous guest events with the authenticated profile.

**P0 Security: Mask chat content in session recordings.** PostHog session recordings capture DOM mutations by default. Users type business strategies and revenue projections. Add `maskAllInputs: true`, `maskAllText: true` as defaults. Add `data-ph-no-capture` to chat panel, canvas fields, and all user-generated content. Never record chat text.

**Start with 3 events, not 8** (per simplicity review -- you don't know what questions you're asking yet):

```typescript
// lib/analytics/events.ts
type TrackedEvent =
  | { event: 'session_started'; properties: { source: 'guest' | 'authenticated' } }
  | { event: 'guest_limit_hit'; properties: { message_count: number } }
  | { event: 'signup_completed'; properties: { source: 'modal' | 'page'; method: 'google' | 'email' } }
```

Use a discriminated union for type safety. The TypeScript reviewer confirmed this pattern prevents event name drift.

**Files:** `apps/web/app/providers.tsx` (new), `apps/web/app/layout.tsx`, `apps/web/lib/analytics/events.ts` (new), `apps/web/lib/auth/AuthContext.tsx`, `apps/web/next.config.ts` (rewrites), `.env.example`

**References:**
- [PostHog Next.js App Router docs](https://posthog.com/docs/libraries/next-js)
- [PostHog Session Replay Privacy Controls](https://posthog.com/docs/session-replay/privacy)
- [PostHog identify best practices](https://posthog.com/docs/getting-started/identify-users)

### 1b. Fix Guest-to-Auth Conversion Path

**Effort:** 4-6 hours

### Research Insights: Conversion Flow Analysis

The spec-flow analyzer found **10 error states** in the current guest-to-auth flow. The 3 most critical:

**Bug 1: Migration never fires.** Migration only runs in `TryPage`'s `useEffect`. After signup, users land on `/app` (dashboard), never returning to `/try`. Guest data stays orphaned in localStorage.

**Fix:** Move `SessionMigration.hasGuestSession()` check to dashboard's `useEffect`. On match, run migration, redirect to `/app/session/{migrated_session_id}`.

**Bug 2: `MigrationResult` returns `workspaceId` but not `sessionId`.** The insert does `.select('id').single()` but `newSession.id` is never included in the return value. The "redirect to migrated session" improvement is impossible without this.

**Fix:** Add `sessionId?: string` to `MigrationResult`, populate from `newSession.id`.

**Bug 3: Modal close leaves user stuck.** After closing `SignupPromptModal`, `showSignupModal` is false, input is disabled (`hasReachedLimit()` still true), no way to re-open the modal. Only escape: header "Sign up" button.

**Fix:** Make the CTA persistent after limit. Either keep the modal non-dismissible or show a permanent banner below the disabled input.

**Additional fixes:**
- Add "Already have an account? Sign in" link to `SignupPromptModal` (returning users who clear cookies)
- Validate `role` in migration (reject `"system"` -- per security sentinel, attacker can inject prompt via localStorage)
- Enforce max `content` length (4000 chars) and max 10 messages in migration
- Add toast notification: "Your guest conversation has been saved" (requires installing a toast library -- shadcn Toast recommended)

**Files:** `apps/web/app/try/page.tsx`, `apps/web/lib/guest/session-migration.ts`, `apps/web/app/app/page.tsx`, `apps/web/app/components/guest/SignupPromptModal.tsx`, `apps/web/app/components/guest/GuestChatInterface.tsx`

### 1c. Forgot Password

**Effort:** 1-2 hours

Moved from Sprint 4 per architecture review. Users who sign up during guest conversion and set a password need reset capability immediately. Wire to `supabase.auth.resetPasswordForEmail()`, add link to login page.

**Files:** `apps/web/app/login/page.tsx`

### 1d. Fix `increment_message_count` IDOR

**Effort:** 30 minutes

Security sentinel found the RPC lacks `user_id` check. Any authenticated user can increment another's message count, causing premature limit hits.

**Fix:** Add `p_user_id UUID` parameter, add `AND user_id = p_user_id` to WHERE clause.

**Files:** `apps/web/supabase/migrations/025_fix_increment_message_count.sql` (new)

### Sprint 1 Success Criteria
- [ ] PostHog events flowing for guest and auth funnels (3 events)
- [ ] Chat content masked in session recordings
- [ ] Guest who hits limit can sign up without losing conversation
- [ ] Migrated session opens directly (not dashboard)
- [ ] Password reset works
- [ ] `increment_message_count` requires ownership
- [ ] Can answer: "What % of guests hit the message limit? What % sign up?"

---

## Sprint 2: Make Sessions Feel Finished (Week 3-4)

**Goal:** Users who complete one good session should want another. The session needs a tangible output.

### 2a. Auto-Title Sessions

**Effort:** 1 hour

**Simplification:** Use first 6 words of user's first message. No Haiku API call needed (per simplicity review: "adds latency, cost, and a dependency on the model env var for a cosmetic feature").

```typescript
// In the chat stream handler, after first user message:
const autoTitle = userMessage.split(' ').slice(0, 6).join(' ')
await supabase.from('bmad_sessions').update({ title: autoTitle }).eq('id', sessionId)
```

**Agent-native enhancement:** Add a `set_session_title` tool so Mary can name the session based on conversation context. She has better context than a first-6-words heuristic. Fire-and-forget pattern: don't `await` in the stream handler.

**Files:** `apps/web/app/api/chat/stream/route.ts`, `apps/web/lib/ai/tools/session-tools.ts` (new tool), `apps/web/lib/ai/tools/index.ts`

### 2b. Auto-Scroll + Scroll-to-Bottom Button

**Effort:** 2 hours

Port `messagesEndRef` pattern from `GuestChatInterface`. Add floating "scroll to bottom" button when user scrolls up. Industry standard (Claude.ai, ChatGPT).

**Files:** `apps/web/app/app/session/[id]/page.tsx`, `apps/web/app/app/session/[id]/useStreamingChat.ts`

### 2c. Ephemeral Error Messages

**Effort:** 2 hours

`useStreamingChat` adds API errors as permanent system messages saved to Supabase. Transient network errors pollute chat history forever. Show errors as dismissible banners, don't persist.

**Files:** `apps/web/app/app/session/[id]/useStreamingChat.ts`

### 2d. Lean Canvas Export (Markdown)

**Effort:** 2-3 hours

Add "Export Canvas" button to the Lean Canvas sidebar. Generate formatted markdown with all 9 boxes. Download as `.md` file. This is the first tangible session artifact users can share.

**Agent-native enhancement:** Add `export_lean_canvas` tool so Mary can include the canvas inline in her responses. Server-side markdown generation from the `lean_canvas` JSONB column.

**Files:** `apps/web/app/components/canvas/LeanCanvas.tsx`, `apps/web/lib/export/canvas-export-md.ts` (new), `apps/web/lib/ai/tools/session-tools.ts`

### Sprint 2 Success Criteria
- [ ] Sessions have meaningful auto-generated titles
- [ ] Chat auto-scrolls on new messages
- [ ] Network errors don't pollute chat history
- [ ] Users can export Lean Canvas as markdown
- [ ] Mary can set session titles and export canvas via tools
- [ ] PostHog shows: return visit rate, sessions per user, messages per session

---

## Sprint 3: Prove Willingness to Pay (Week 5-6)

**Goal:** Validate that users will exchange money for this product. Start with the simplest possible payment flow.

### Research Insights: Simplest Viable Payment

The simplicity reviewer recommends starting with a **Stripe Payment Link** (literally a URL generated in the Stripe Dashboard, zero code). Email Kevin when someone pays. Manually provision access. This validates willingness-to-pay without building webhook handlers.

The best-practices researcher recommends **one-time payments, not subscriptions** for initial launch:
- Credit-based SaaS with one-time purchases has lower friction than subscriptions for evaluating users
- You already have the `mode: 'payment'` Checkout flow built
- Subscriptions require additional webhook handling (`invoice.paid`, `customer.subscription.updated`, dunning)
- At 100 users, recurring revenue optimization is premature

### Critical Pre-Requisites

**Split LAUNCH_MODE into two flags.** The architecture strategist found that `LAUNCH_MODE` controls both message limits AND credit bypass inversely. Flipping it breaks one system while enabling the other.

```
MESSAGE_LIMIT_ENABLED=true   # Keep per-session message caps
CREDIT_SYSTEM_ENABLED=false  # Activate when ready
```

**Grant credits to existing users.** Before enabling credits, run a migration that grants N credits to all existing users. Without this, everyone gets 0 credits on cutover.

**Create `user_credits` row on signup.** Currently no row exists for new users. `deduct_credit_transaction` RPC will fail.

### 3a. Stripe Webhook Route

**Effort:** 3-4 hours

### Research Insights: Webhook Implementation

The best-practices researcher provided the complete implementation pattern:

- Use `request.text()` for raw body (NOT `request.json()` -- Stripe signature verification fails on parsed JSON)
- Handle `checkout.session.completed` with idempotency check via existing `getTransactionByStripePayment()`
- Create `lib/supabase/admin.ts` for service-role client (webhooks have no user cookies, can't use the cookie-based client)
- Add UNIQUE constraint on `credit_transactions.stripe_payment_id` (database-level duplicate prevention)

**Security requirements from security sentinel:**
- Register webhook URL in Stripe Dashboard, subscribe only to `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
- Return 200 immediately after processing (Stripe retries on non-2xx within 5s)
- Store processed event IDs for replay protection

**Files:** `apps/web/app/api/webhooks/stripe/route.ts` (new), `apps/web/lib/supabase/admin.ts` (new), `apps/web/supabase/migrations/026_credit_system_activation.sql` (new -- UNIQUE index, signup trigger)

### 3b. Pricing Page

**Effort:** 4-6 hours

Two tiers only:

| | Free | Pro |
|---|---|---|
| Price | $0 | $39 one-time |
| Sessions | 3 | 10 sessions |
| Features | Full access | Full access + canvas export |

One-time payments, not subscriptions. When you see repeat purchases, that's your signal to add a monthly plan.

**Agent-native enhancement:** Add credit balance to `read_session_state` so Mary knows when credits are low. System prompt: "When messagesRemaining < 5, prioritize actionable output over exploratory questions."

**Files:** `apps/web/app/pricing/page.tsx` (new), `apps/web/lib/ai/tools/session-tools.ts` (expand `read_session_state`)

### 3c. Credit System Activation

**Effort:** 3-4 hours

- Set `CREDIT_SYSTEM_ENABLED=true` on Vercel (NOT `LAUNCH_MODE=false` -- keep message limits active)
- Add credit balance display to session header
- Show "upgrade" CTA when credits run out
- Verify `deduct_credit_transaction()` RPC works with per-session data model
- Use Stripe Customer Portal for receipts (15 minutes to configure in Dashboard, link from `/app/account`)

**Race condition fix (security sentinel):** Combine check-and-deduct into a single `deductCredit()` call. Remove the separate `hasCredits()` pre-check. The RPC's `SELECT ... FOR UPDATE` handles atomicity, but the two-call pattern allows races.

**Files:** `apps/web/lib/monetization/credit-manager.ts`, `apps/web/app/app/account/page.tsx`, `apps/web/app/app/session/[id]/page.tsx`

### Sprint 3 Success Criteria
- [ ] Stripe webhook receives and processes payments
- [ ] Pricing page shows Free vs Pro
- [ ] LAUNCH_MODE split into two flags
- [ ] Existing users get credit grant before activation
- [ ] Free users hit credit limit and see upgrade CTA
- [ ] Mary knows credit balance via `read_session_state`
- [ ] PostHog shows: pricing page views, checkout starts, payment completions

---

## Post-Sprint 3: Reassess Based on Data

**After Sprint 3, you'll have data to answer:**
- What % of guests hit the limit?
- What % sign up?
- What % return for a second session?
- What % view the pricing page?
- What % complete checkout?

**If conversion is strong:** Build Sprint 4 (mobile, polish, account deletion).
**If retention is weak:** Build session quality features (board cross-referencing, phase rail, AI mode transitions).
**If nobody pays:** Validate the value proposition before building more features.

### Deferred Items (Build When Data Justifies)

| Item | Trigger to Build | Original Sprint |
|------|------------------|-----------------|
| Mobile responsive (sidebar, session page) | >20% mobile traffic in PostHog | Sprint 4 |
| Account deletion (real cascade) | GDPR complaint or >500 users | Sprint 4 |
| Bundle deep optimization | Lighthouse score <70 | Sprint 4 |
| Board members referencing each other | Users request it, retention data shows Board matters | Sprint 5 |
| Phase progress rail | Users confused about session structure | Sprint 5 |
| Lean Canvas PDF export | Users share canvases and want richer format | Sprint 5 |
| AI-suggested mode transitions | Enough sessions to validate mode switching value | Sprint 5 |
| Email pipeline (Resend) | Retention <30% at 7 days | Sprint 6 |
| Session sharing (public links) | Users manually screenshotting and sharing | Sprint 6 |
| Voice input (Web Speech API) | Mobile traffic + user requests | Sprint 6 |
| Test coverage sprint | Before next major milestone | Sprint 6 |
| Session search on dashboard | Users have >20 sessions | Sprint 6 |
| Personalized paywall copy | Traffic volume supports A/B testing | Sprint 6 |
| Inline signup modal (vs redirect) | Signup conversion <5% | Sprint 6 |
| Board member typing indicators | Users engage with Board frequently | Sprint 6 |

---

## Security Requirements Across All Sprints

From security sentinel audit:

| Priority | Requirement | Sprint |
|----------|-------------|--------|
| P0 | PostHog session recording masking for chat content | 1 |
| P0 | Validate guest migration input (role, content length, message count) | 1 |
| P0 | Create Stripe webhook with signature verification before credits go live | 3 |
| P1 | Fix `increment_message_count` IDOR (add `user_id` parameter) | 1 |
| P1 | UNIQUE constraint on `credit_transactions.stripe_payment_id` | 3 |
| P1 | Split LAUNCH_MODE into separate flags | 3 |
| P2 | Rate limiting: move from in-memory Map to Vercel KV before payments | 3 |
| P2 | Combine credit check-and-deduct into single atomic operation | 3 |

---

## Agent-Native Parity Checklist

From agent-native reviewer -- for each feature, ensure Mary can also interact with it:

| Sprint | Feature | Agent Tool Needed | Status |
|--------|---------|-------------------|--------|
| 1 | Analytics events | Emit PostHog events from tool execution (infrastructure, not tool) | PLAN |
| 2 | Auto-title | `set_session_title` tool | PLAN |
| 2 | Canvas export | `export_lean_canvas` tool | PLAN |
| 3 | Credit system | Add `creditBalance`, `messagesRemaining` to `read_session_state` | PLAN |
| Deferred | Session sharing | `create_share_link` tool | DEFERRED |
| Deferred | Phase rail | `set_phase` tool (only if UI allows non-sequential jumps) | DEFERRED |

---

## Dependency Map

```
Sprint 0 (Bundle/Perf Foundation)     [2-3 hours]
    |
    v
Sprint 1 (Convert Guests)            [Week 1-2]
    |
    v
Sprint 2 (Session Quality)           [Week 3-4, can overlap with Sprint 1]
    |
    v
Sprint 3 (Prove Willingness to Pay)  [Week 5-6, needs Sprint 1 data]
    |
    v
[REASSESS based on PostHog data]
    |
    v
Sprint 4+ (data-driven, from deferred backlog)
```

**Hard dependencies:**
- Sprint 3 needs Sprint 1 analytics data to validate pricing decisions
- Sprint 3 needs LAUNCH_MODE split (pre-requisite)
- Sprint 0 should run before Sprint 1 for clean measurements

**Soft dependencies:**
- Sprint 2 items can start during Sprint 1 if 1a (PostHog) ships first
- Sprint 0 items (model env var, tldraw removal) can ship anytime

---

## Performance Optimization Schedule

From performance oracle:

| Sprint | Impact | Action |
|--------|--------|--------|
| 0 | +200KB saved | Dynamic import MarkdownRenderer |
| 0 | -auth tax on public pages | Split providers to `/app/*` only |
| 0 | -2MB node_modules | Remove tldraw |
| 1 | -30-80ms FCP | PostHog loaded `afterInteractive`, not blocking |
| 2 | Neutral | Auto-title fires async (fire-and-forget, no stream blocking) |
| 3 | Neutral | Stripe.js loaded only on `/pricing` via `next/dynamic` |

**Pre-Sprint 1 quick wins:**
1. Remove `tldraw` from `package.json` (zero imports exist)
2. Dynamic import `mermaid` in `canvas-export.ts` (~1MB saved)
3. Split providers out of root layout

---

## Metrics to Track

| Metric | Target | Sprint Available |
|--------|--------|-----------------|
| Guest-to-signup conversion | >5% | Sprint 1 |
| Signup-to-first-session | >60% | Sprint 1 |
| Messages per session | >8 avg | Sprint 1 |
| Return visit rate (7-day) | >30% | Sprint 2 |
| Sessions per user (monthly) | >3 avg | Sprint 2 |
| Pricing page views | baseline | Sprint 3 |
| Checkout conversion | >3% | Sprint 3 |
| Canvas completion (9/9 boxes) | >40% of sessions | Sprint 2 |

---

## Stale Artifacts to Archive

1. **`.planning/ROADMAP.md`** -- Beta Launch milestone. 3/4 phases done, Phase 4 never started. Archive.
2. **`.planning/STATE.md`** -- Shows "Phase 4, ready to execute" since Feb 2. Archive.
3. **`.planning/PROJECT.md`** -- Core value "100 users can reliably sign up via waitlist." Achieved. Update for next milestone.
4. **`docs/plans/2026-03-16-feat-thinkhaven-next-phase-plan.md`** -- Superseded. Mark as such.
5. **`LAUNCH_MODE_SETUP.md`** -- References `NEXT_PUBLIC_LAUNCH_MODE` which doesn't exist in code (code uses `LAUNCH_MODE`). Fix or delete.

---

## What This Roadmap Does NOT Cover

Explicitly deferred beyond Sprint 3. Build only when data justifies:

| Item | Trigger |
|------|---------|
| Dark mode | User demand signal |
| Admin dashboard | >500 users |
| Subscription billing | Repeat one-time purchases observed |
| Native mobile app | Web responsive sufficient |
| Real-time collaboration | Single-user product |
| Canvas direct editing | Read-only canvas sufficient for v1 |
| Excalidraw diagrams | Post-alpha (see REQUIREMENTS.md VIZ-01/02/03) |
| Email pipeline | Retention <30% at 7 days |

---

## References

### Codebase
- Guest conversion: `apps/web/app/try/page.tsx`, `lib/guest/session-migration.ts`
- Stripe infrastructure: `lib/monetization/stripe-service.ts`, `lib/monetization/credit-manager.ts`
- Credit schema: `supabase/migrations/005_session_credit_system.sql`
- Analytics stub: `lib/bmad/analytics/session-analytics.ts` (in-memory, unused)
- Export system: `lib/export/chat-export.ts`, `app/components/workspace/ExportPanel.tsx`
- Dashboard: `app/app/page.tsx`
- Agent tools: `lib/ai/tools/session-tools.ts`, `lib/ai/tools/index.ts`

### External Research
- [PostHog Next.js App Router docs](https://posthog.com/docs/libraries/next-js)
- [PostHog Session Replay Privacy](https://posthog.com/docs/session-replay/privacy)
- [Stripe Webhook Best Practices](https://docs.stripe.com/webhooks)
- [Stripe Credit-Based Pricing](https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/guides/lazy-loading)
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [1Capture Trial Conversion Benchmarks](https://www.1capture.io/blog/free-trial-conversion-benchmarks-2025)
- [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- [Nami ML Personalized Paywall +17% Conversion](https://www.nami.ml/blog/personalized-paywall-conversion-boost)
- [Authgear Social Login +28% Signups](https://www.authgear.com/post/sign-up-form-best-practices)
