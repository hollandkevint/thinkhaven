# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

**Deprecated Next.js Version with Security Vulnerability:**
- Issue: Next.js 15.5.7 marked as deprecated with security vulnerability in package-lock.json
- Files: `apps/web/package.json`, `package-lock.json`
- Impact: Security risk in production, potential exploit vectors
- Fix approach: Upgrade to Next.js 15.6+ immediately. Test auth flows and middleware behavior post-upgrade since Edge Runtime compatibility was a previous blocker

**Severely Outdated Dependencies:**
- Issue: @anthropic-ai/sdk at 0.27.3 (latest: 0.74.0), @supabase/supabase-js at 2.57.4 (latest: 2.95.3) — 38 versions behind
- Files: `apps/web/package.json`
- Impact: Missing API features, potential breaking changes accumulating, security patches not applied
- Fix approach: Incremental upgrade strategy — test Anthropic SDK first (may affect streaming), then Supabase (auth changes likely). Budget 2-3 hours for compatibility fixes

**Massive Analysis Engine Files:**
- Issue: 1000-1500 line TypeScript files with complex business logic
- Files: `apps/web/lib/bmad/analysis/growth-strategy-engine.ts` (1535 lines), `apps/web/app/api/bmad/route.ts` (1491 lines), `apps/web/lib/ai/mary-persona.ts` (1477 lines), `apps/web/lib/bmad/analysis/revenue-optimization-engine.ts` (1398 lines)
- Impact: Hard to test, difficult to reason about, merge conflicts likely, tight coupling
- Fix approach: Extract domain models first (types/interfaces), then split by responsibility — feature analysis vs pricing vs growth vs revenue. Use barrel exports to maintain API compatibility

**Excessive Console Logging in Production:**
- Issue: 159 console.log/error/warn calls across 57 files, likely active in production
- Files: Throughout `apps/web/` — API routes, components, lib utilities
- Impact: Performance overhead, potential info leakage in browser console, noise in monitoring
- Fix approach: Implement structured logger with environment-aware levels. Replace all console calls with logger.debug/info/error. Add ESLint rule to prevent future console usage

**Liberal 'any' Type Usage:**
- Issue: 30+ instances of `any` type, especially in ChatInterface, canvas components, and BMAD pathways
- Files: `apps/web/app/components/chat/ChatInterface.tsx` (multiple), `apps/web/app/components/canvas/EnhancedCanvasWorkspace.tsx`, `apps/web/app/components/bmad/pathways/*.tsx`
- Impact: Type safety lost at critical boundaries, runtime errors not caught at compile time
- Fix approach: Define proper TypeScript interfaces for message metadata, canvas state, export options. Enable `strict: true` and `noImplicitAny: true` after fixing existing violations

**Deep Import Paths (../../../../):**
- Issue: 16 occurrences of ../../../ imports indicating poor module organization
- Files: `apps/web/__tests__/bmad/pathways/new-idea-pathway.test.ts`, `apps/web/app/demo/[scenario]/page.tsx`, test files
- Impact: Brittle imports that break on refactoring, unclear dependency hierarchy
- Fix approach: Configure path aliases in tsconfig.json (`@lib/*`, `@components/*`, `@bmad/*`). Update imports systematically

**115 Files in /lib Without Clear Boundaries:**
- Issue: Flat `apps/web/lib/` directory with 115 files mixing concerns (auth, AI, BMAD, canvas, monetization)
- Files: `apps/web/lib/*`
- Impact: Hard to navigate, circular dependency risk, unclear ownership
- Fix approach: Group by domain — `lib/auth/`, `lib/ai/`, `lib/bmad/`, `lib/canvas/`. Keep only truly shared utilities in lib root

## Known Bugs

**Email Verification Flow Broken:**
- Symptoms: Email verification fails, documented in troubleshooting guide
- Files: `docs/troubleshooting/authentication-issues.md` references issue, auth flow in `apps/web/app/auth/callback/route.ts`
- Trigger: User clicks email confirmation link after signup
- Workaround: Manual approval in Supabase dashboard bypasses email verification requirement

**Session Drops Unexpectedly:**
- Symptoms: User logged out without explicit action, documented in PROJECT.md as "sessions drop"
- Files: Session management in `apps/web/lib/supabase/middleware.ts`, `apps/web/lib/auth/AuthContext.tsx`
- Trigger: Browser refresh, tab switching, or time-based expiry without proper refresh
- Workaround: User must re-authenticate

**OAuth Broken (Google/GitHub):**
- Symptoms: OAuth authentication failures, mentioned in PROJECT.md as "OAuth broken"
- Files: OAuth callback `apps/web/app/auth/callback/route.ts`, Google config in auth components
- Trigger: Attempting Google or GitHub sign-in
- Workaround: Email/password authentication still works

**JWT Claims Cached ~1 Hour:**
- Symptoms: Approved users must re-login to see beta_approved claim update
- Files: Documented in `.planning/STATE.md` line 74
- Trigger: Admin approves user in Supabase, but JWT not refreshed client-side
- Workaround: User manually logs out and back in

## Security Considerations

**Environment Variables in Client Code:**
- Risk: Multiple NEXT_PUBLIC_ variables exposed to browser, `.env.local` files tracked in git
- Files: `.env.local`, `apps/web/.env.local` present (should be .gitignored), usage in `apps/web/lib/supabase/client.ts`, `apps/web/lib/ai/claude-client.ts`
- Current mitigation: .env.example template exists, but actual .env.local files discovered
- Recommendations: Verify .gitignore includes .env.local, audit NEXT_PUBLIC_ variables for sensitive data, rotate any leaked keys

**ANTHROPIC_API_KEY in Client Components:**
- Risk: API key potentially exposed if used in client-side code
- Files: `apps/web/lib/ai/claude-client.ts` should only run server-side
- Current mitigation: API routes use server-side Anthropic client
- Recommendations: Add runtime check to throw error if claude-client imported in browser context. Use Next.js API routes exclusively for AI calls

**No Rate Limiting in Non-Production:**
- Risk: Development/staging environments vulnerable to abuse, rate limiter only active when NODE_ENV=production
- Files: `apps/web/app/api/bmad/route.ts` line 40-41 (`if (isProduction)` check)
- Current mitigation: None in dev/staging
- Recommendations: Enable rate limiting in all environments, use separate limits (dev: higher, prod: strict). Consider IP-based limiting for unauthenticated requests

**Guest Sessions in localStorage Only:**
- Risk: Trivially bypassable access control for guest mode
- Files: Documented in `.planning/PROJECT.md` line 44, implementation in GuestSessionStore
- Current mitigation: Acknowledged as intentional for demo mode
- Recommendations: Document that guest mode is demo-only and not for sensitive data. Add server-side validation if guest sessions start handling real user data

**Error Stack Traces in Production:**
- Risk: ErrorBoundary components show full stack traces when NODE_ENV=development, potentially leaking info
- Files: `apps/web/app/components/ui/ErrorBoundary.tsx` line 124, `apps/web/app/components/dual-pane/PaneErrorBoundary.tsx` line 64
- Current mitigation: Gated by NODE_ENV check
- Recommendations: Ensure NODE_ENV=production in deployed environments. Add integration test to verify stack traces hidden in production builds

## Performance Bottlenecks

**1400+ Line Mary Persona File Loaded on Every Chat:**
- Problem: mary-persona.ts (1477 lines) contains all sub-persona logic, loaded synchronously
- Files: `apps/web/lib/ai/mary-persona.ts`
- Cause: Monolithic file with pathway weights, emotional state detection, viability assessment all in one module
- Improvement path: Code-split by feature — lazy load sub-persona modes, separate pathway configs into JSON, defer viability assessment until needed

**Large API Route Handler (1491 lines):**
- Problem: Single route.ts handling all BMAD operations without pagination or streaming optimization
- Files: `apps/web/app/api/bmad/route.ts`
- Cause: Combined pathway routing, feature analysis, priority scoring, brief generation in one endpoint
- Improvement path: Split into separate API routes — /api/bmad/pathway, /api/bmad/analysis, /api/bmad/priority. Implement request streaming for large responses

**Node_modules Size (14MB):**
- Problem: Relatively small but includes heavy dependencies like @react-pdf/renderer, tldraw
- Files: `apps/web/node_modules/`
- Cause: PDF generation and canvas libraries included in main bundle
- Improvement path: Dynamic import for PDF generation (only on export), lazy load tldraw (only when canvas opened). Could reduce initial bundle by 30-40%

**No Memoization in Analysis Engines:**
- Problem: Growth strategy, revenue optimization, pricing analysis re-calculate on every render
- Files: `apps/web/lib/bmad/analysis/*.ts` engines
- Cause: Pure calculation functions called directly without caching
- Improvement path: Add React.useMemo for expensive calculations, implement LRU cache for analysis results with session ID as key

## Fragile Areas

**Auth Middleware Disabled:**
- Files: `apps/web/lib/supabase/middleware.ts` exists but documented as "minimal token-refresh middleware" only
- Why fragile: All route protection moved to API routes due to Edge Runtime incompatibility. Easy to forget protection on new routes
- Test coverage: Auth flow not covered by E2E tests per PROJECT.md ("E2E tests: only 7 smoke tests exist, no auth flow coverage")
- Safe modification: Always add `const { data: { user } } = await supabase.auth.getUser()` at start of protected API routes. Verify getUser() not getSession() per STATE.md decision

**Custom Access Token Hook Dependency:**
- Files: Beta access depends on Supabase Custom Access Token Hook injecting `beta_approved` claim
- Why fragile: Hook configuration lives in Supabase dashboard, not code. No visibility into hook failures. JWT claims cached ~1 hour
- Test coverage: Manual verification only (no automated tests for JWT claims)
- Safe modification: When changing beta access logic, update hook in dashboard AND document in REQUIREMENTS.md. Test with fresh login (not cached session)

**BMAD Session State Synchronization:**
- Files: `apps/web/lib/bmad/session/universal-state-manager.ts`, `apps/web/app/components/bmad/useBmadSession.ts`
- Why fragile: Complex state sync between localStorage, Supabase, and React state. Race conditions possible on rapid navigation
- Test coverage: Only 218 test files total, unclear coverage of state edge cases
- Safe modification: Always use UniversalSessionManager methods, never direct localStorage. Add explicit wait for state sync before navigation

**Canvas Engine Integration:**
- Files: `apps/web/app/components/canvas/EnhancedCanvasWorkspace.tsx`, `packages/canvas-engine/`
- Why fragile: tldraw library integration with custom event listeners (`canvas:highlight` as any). Memory leak potential from unsubscribed listeners
- Test coverage: No canvas tests in test suite
- Safe modification: Always cleanup event listeners in useEffect returns. Test memory usage in DevTools when opening/closing canvas multiple times

**Dual-Pane State Bridge:**
- Files: `apps/web/app/components/dual-pane/StateBridge.tsx`
- Why fragile: Cross-pane communication via custom events, development-only debug panels that could leak to production
- Test coverage: No dual-pane E2E tests
- Safe modification: Verify NODE_ENV checks before adding debug features. Use TypeScript strict mode to catch event type mismatches

## Scaling Limits

**Manual Beta Approval (100 users):**
- Current capacity: Manual approval via Supabase Table Editor
- Limit: Beyond 100-200 users, manual approval becomes bottleneck
- Scaling path: Implement approval queue UI with bulk actions, add auto-approval rules based on criteria (company domain, referral code), migrate to admin dashboard

**Single Database for All Sessions:**
- Current capacity: All BMAD sessions, chat messages, workspaces in one Supabase project
- Limit: Supabase free tier limits on database size and connections
- Scaling path: Archive completed sessions older than 90 days, implement read replicas for analytics queries, consider session partitioning by date

**No CDN for Static Assets:**
- Current capacity: Vercel serves all assets
- Limit: Geographic latency for non-US users, bandwidth costs at scale
- Scaling path: Enable Vercel Edge Network (included), add CDN for large exports (PDF, canvas images), optimize image delivery with next/image

**In-Memory Rate Limiter:**
- Current capacity: RateLimiter class stores limits in process memory
- Limit: Resets on deployment, doesn't work across multiple Vercel serverless instances
- Scaling path: Migrate to Redis-based rate limiting (Upstash), implement distributed rate limiting with Vercel KV, add rate limit headers for transparency

## Dependencies at Risk

**@anthropic-ai/sdk (0.27.3 vs 0.74.0):**
- Risk: 47 versions behind, major API changes likely
- Impact: Streaming chat breaks, token counting changes, new error types
- Migration plan: Test streaming in isolated environment, review changelog for breaking changes in messages API, budget 4-6 hours for compatibility fixes

**@supabase/supabase-js (2.57.4 vs 2.95.3):**
- Risk: 38 versions behind, auth API changes common in Supabase
- Impact: getUser() behavior changes, RLS policy syntax updates, JWT handling modifications
- Migration plan: Review Supabase migration guide, test auth flows in staging, update RLS policies if needed, expect 6-8 hours for full regression testing

**Next.js (15.5.7 - deprecated with security vuln):**
- Risk: Actively deprecated, security vulnerability documented in package-lock.json
- Impact: Production security risk, App Router changes in 15.6+, middleware behavior shifts
- Migration plan: Upgrade to 15.6 or latest 15.x immediately. Full E2E test pass required. Review middleware for Edge Runtime changes. Critical — do this before beta launch

**tldraw (4.0.2):**
- Risk: Canvas engine dependency, frequent breaking changes in major versions
- Impact: Canvas workspace breaks, drawing API changes, export format shifts
- Migration plan: Pin to 4.0.x range, monitor changelog before any upgrade, test canvas save/load extensively, consider migrating away if canvas de-prioritized

**React 19.1.0:**
- Risk: New major version, ecosystem catching up
- Impact: Third-party library incompatibilities, suspense behavior changes, potential hydration errors
- Migration plan: Already on React 19, but monitor for patch releases. Some libraries (e.g., @testing-library) may lag behind. Consider React 18 downgrade if blocking issues arise

## Missing Critical Features

**No Error Tracking Service:**
- Problem: No Sentry, LogRocket, or error monitoring integrated
- Blocks: Debugging production issues, identifying error patterns, measuring reliability
- Priority: High — cannot operate beta without visibility into failures

**No Analytics Beyond Planned Basic Tracking:**
- Problem: FEED-01 (basic analytics) not yet implemented per REQUIREMENTS.md
- Blocks: Measuring engagement, identifying drop-off points, validating hypotheses
- Priority: High — feedback collection is core beta goal

**No Admin Dashboard for Beta Management:**
- Problem: Manual Supabase Table Editor for user approval
- Blocks: Efficient user management at scale, approval analytics, bulk operations
- Priority: Medium — stated as out-of-scope for <100 users, but needed if beta grows

**Missing Email Notification System:**
- Problem: EMAIL-03 (approval notifications) deferred to v2 per REQUIREMENTS.md
- Blocks: User doesn't know they're approved, manual communication required
- Priority: Medium — could use Supabase email templates as interim solution

**No Session Recovery UI:**
- Problem: Users lose work on browser refresh if session sync fails
- Blocks: Reliable user experience, trust in platform
- Priority: High — mentioned as active requirement ("Session recovery — don't lose work on refresh")

## Test Coverage Gaps

**Auth Flow Not Covered by E2E:**
- What's not tested: Login, logout, session persistence, OAuth flows
- Files: `apps/web/tests/` has 218 test files but PROJECT.md states "only 7 smoke tests exist, no auth flow coverage"
- Risk: Auth regressions go undetected, beta blocker bugs ship to production
- Priority: Critical — auth is beta launch prerequisite per REQUIREMENTS.md

**BMAD Pathway State Transitions:**
- What's not tested: Phase advancement, pathway switching, session completion, error recovery
- Files: Test files exist (`__tests__/bmad/pathways/*.test.ts`) but no E2E validation
- Risk: Users stuck in pathways, data loss on transitions, session corruption
- Priority: High — core product functionality

**Canvas Save/Load Reliability:**
- What's not tested: Canvas state persistence, cross-browser compatibility, concurrent editing
- Files: No canvas tests found in E2E suite
- Risk: User work lost on canvas, export failures, rendering inconsistencies
- Priority: Medium — canvas de-prioritized per PROJECT.md out-of-scope

**Rate Limiting Bypass Scenarios:**
- What's not tested: Rate limit headers, retry behavior, concurrent request handling
- Files: RateLimiter in `apps/web/lib/security/rate-limiter.ts` but no tests
- Risk: API abuse, DoS vulnerability, unfair resource allocation
- Priority: Medium — only active in production per code inspection

**Email Verification Flow:**
- What's not tested: Email sent, link clicked, account activated
- Files: Known broken per bugs section, no tests validating fix
- Risk: Cannot validate email verification works when fixed
- Priority: High — if email verification becomes beta requirement

---

*Concerns audit: 2026-02-14*
