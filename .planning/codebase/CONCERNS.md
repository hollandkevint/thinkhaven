# Codebase Concerns

**Analysis Date:** 2026-02-20

## Tech Debt

**Null-unchecked Supabase Client in API Routes:**
- Issue: `createClient()` in `lib/supabase/server.ts` returns `null` when env vars are missing (build-time safety), but most API routes call it and immediately chain `.auth.getUser()` without null-checking. This crashes with a runtime TypeError if env vars are absent.
- Files: `app/api/chat/stream/route.ts:198-199`, `app/api/bmad/route.ts:36-37`, `app/api/checkout/idea-validation/route.ts:14`, `app/api/credits/balance/route.ts:15`, `app/api/feedback/trial/route.ts:22`
- Impact: All API routes will crash at startup if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing. CI failures in edge cases.
- Fix approach: Add `if (!supabase) return 401/500 Response` after each `createClient()` call, or make `createClient()` throw instead of returning null.

**Hardcoded Magic Numbers for Message Limit:**
- Issue: The 10-message-per-session limit is hardcoded in two places that create sessions inline rather than using `DEFAULT_MESSAGE_LIMIT` from `lib/bmad/message-limit-manager.ts`.
- Files: `app/api/chat/stream/route.ts:288`, `app/app/new/page.tsx:55`
- Impact: Changing the limit requires updating three places instead of one. Drift risk.
- Fix approach: Import and use `DEFAULT_MESSAGE_LIMIT` from `lib/bmad/message-limit-manager.ts` at both call sites.

**Single JSONB Column for All Chat History:**
- Issue: `user_workspace.workspace_state` is a single JSONB column storing all data (chat_context, canvas_elements, etc). As sessions grow, this column grows unboundedly. No pagination or pruning at the DB level.
- Files: `supabase/migrations/003_user_workspace_table.sql`, `app/app/session/[id]/page.tsx:77-90`, `app/api/chat/stream/route.ts:224`
- Impact: Large sessions will bloat the JSONB column, increasing read latency on every workspace load. PostgreSQL JSONB columns over ~1MB degrade significantly.
- Fix approach: Introduce a `messages` table with foreign key to `user_workspace`. The existing `conversations` table (migration 002) exists but is unused by the main session flow.

**Legacy `conversations` Table Created But Unused:**
- Issue: Migration `002_conversations_messages_schema.sql` creates a `conversations` table with full schema (messages, search indexes, etc). The main session flow stores chat in `workspace_state` JSONB instead. The only consumer is `lib/supabase/conversation-queries.ts`, called only from `MessageHistorySidebar`.
- Files: `supabase/migrations/002_conversations_messages_schema.sql`, `lib/supabase/conversation-queries.ts`
- Impact: Dead schema adds confusion about where data lives. New developers will find two storage systems.
- Fix approach: Either migrate the main session flow to use `conversations`, or drop the table and `conversation-queries.ts` if the sidebar feature is not prioritized.

**`assessment_submissions` Table Referenced But Absent from Migrations:**
- Issue: `app/api/assessment/submit/route.ts:19` writes to `assessment_submissions`, but no migration creates this table. The route silently swallows the DB error and returns success, so data is lost.
- Files: `app/api/assessment/submit/route.ts:18-35`, `app/components/assessment/StrategyQuiz.tsx:184-198`
- Impact: All assessment submissions fail silently. Data falls back to `localStorage` only, which is per-browser and unrecoverable.
- Fix approach: Write a migration creating `assessment_submissions`. Remove the silent-fail pattern; return a proper error.

**`board_state` Column Referenced But Missing from Migrations:**
- Issue: `app/api/chat/stream/route.ts:372` selects `board_state` from `bmad_sessions`, and `app/app/session/[id]/page.tsx` reads it, but no migration adds this column.
- Files: `app/api/chat/stream/route.ts:372`, `app/app/session/[id]/page.tsx:336-347`
- Impact: Board state is never persisted between page loads. Board of Directors speaker state resets on every refresh.
- Fix approach: Add migration `020_add_board_state.sql` with `ALTER TABLE bmad_sessions ADD COLUMN board_state JSONB`.

**In-Memory Rate Limiter Resets on Every Deploy:**
- Issue: `lib/security/rate-limiter.ts` uses a `private static requests = new Map<string, RateLimitEntry>()`. Vercel serverless functions have no shared memory between instances, and each cold start resets the map.
- Files: `lib/security/rate-limiter.ts:17`
- Impact: Rate limiting provides no real protection in production on Vercel. Each function invocation starts with an empty map.
- Fix approach: Replace with Redis-backed or Supabase-backed rate limiting. Upstash Redis is the standard Vercel-compatible option.

**Duplicate Component Directory Structure:**
- Issue: Two component roots exist: `components/` (shadcn UI primitives + canvas) and `app/components/` (feature components). Some files import from `@/components/...` and others from `@/app/components/...`. Mixed relative paths (`../../../lib/auth/AuthContext`) also exist alongside `@/` aliases.
- Files: `app/components/ui/navigation.tsx:5-13`, `app/components/canvas/EnhancedCanvasWorkspace.tsx:12`, `app/app/session/[id]/page.tsx:15`
- Impact: Confusion about where to place new components. Inconsistent import patterns make refactoring harder.
- Fix approach: Establish canonical rule: `components/` for shadcn primitives only, `app/components/` for all feature code. Replace relative path imports with `@/` aliases.

**Pervasive `as any` Type Casting in Session Page:**
- Issue: `app/app/session/[id]/page.tsx` uses `as any` at least 8 times for speaker-related casts. This bypasses type safety for the Board of Directors feature which has proper types defined in `lib/ai/board-types.ts`.
- Files: `app/app/session/[id]/page.tsx:284-396`
- Impact: Type errors in board member logic won't be caught at compile time. The `BoardMemberId` union type in `lib/ai/board-types.ts` is effectively bypassed.
- Fix approach: Fix the event data types at the streaming/parsing layer so the downstream components receive typed values.

**Mock State in Account Page:**
- Issue: `app/app/account/page.tsx:11-12` sets `workspaceState = null` with comment "Mock empty state" and `saveWorkspace` is a no-op. The account page shows workspace statistics (message count, canvas elements) that always render as 0.
- Files: `app/app/account/page.tsx:11-12, 149-150`
- Impact: Users see incorrect workspace stats. The account page is incomplete.
- Fix approach: Fetch real workspace state from `user_workspace` using the pattern from `app/app/session/[id]/page.tsx`.

## Known Bugs

**`assessment_submissions` Silent Data Loss:**
- Symptoms: Submitting the strategy quiz appears successful but data is never stored in the database.
- Files: `app/api/assessment/submit/route.ts:28-34`
- Trigger: Any user completes the assessment quiz.
- Workaround: None. Data only exists in the submitting browser's `localStorage`.

**Board State Not Persisted:**
- Symptoms: Board of Directors active speaker resets to Mary on page refresh.
- Files: `app/app/session/[id]/page.tsx:65-67`, `app/api/chat/stream/route.ts:392-398`
- Trigger: Any Board session page refresh.
- Workaround: None currently.

**useEffect Missing `diagramId` Stability in MermaidRenderer:**
- Symptoms: `MermaidRenderer` generates `diagramId` with `Math.random()` on each render but includes it in the `useEffect` dependency array. Any re-render produces a new ID, potentially causing infinite re-render loops or missed renders.
- Files: `app/components/canvas/MermaidRenderer.tsx:37, 61`
- Trigger: Any parent re-render while Mermaid diagram is visible.
- Workaround: Use a stable ref or `useMemo` for `diagramId`.

## Security Considerations

**Auth Bypass in `/api/bmad` via Referer Header:**
- Risk: `app/api/bmad/route.ts:66-74` bypasses authentication for any request with a `Referer` header containing `/test-bmad-buttons`. The `Referer` header is fully client-controlled. Any unauthenticated caller can spoof this header to access all BMAD endpoints without auth.
- Files: `app/api/bmad/route.ts:64-78, 190-200`
- Current mitigation: None. The test bypass page (`/test-bmad-buttons`) does not appear to exist in the current app routes, but the server-side bypass remains active.
- Recommendations: Remove the `isTestRequest` bypass entirely. Use proper test credentials or mock the auth layer in tests.

**`getSession()` Used in Auth-Sensitive Code:**
- Risk: Supabase's `getSession()` only validates locally against the stored token without hitting the auth server. A compromised or manually crafted token can pass this check. `getUser()` validates server-side.
- Files: `lib/auth/AuthContext.tsx:24`, `lib/auth/beta-access.ts:19`
- Current mitigation: `beta-access.ts` pairs `getSession()` with `verifyJwt()` which partially mitigates the risk, but `AuthContext.tsx` uses raw `getSession()` for initial state which gates all client-side auth checks.
- Recommendations: Replace `getSession()` in `AuthContext.tsx` with `getUser()` for the server-validated initial session check.

**Admin Emails Hardcoded in Source Code:**
- Risk: Personal email addresses committed to source control. Anyone with repo access can see admin identities.
- Files: `lib/auth/admin.ts:1-5`
- Current mitigation: Repository appears private. Admin check is correct in logic.
- Recommendations: Move admin emails to an environment variable (`ADMIN_EMAILS=a@b.com,c@d.com`) and parse at runtime. Remove from source.

**Guest API Has No Rate Limiting or Message Cap:**
- Risk: `/api/chat/guest` is fully unauthenticated with no rate limiting, no per-IP tracking, and no server-side message count enforcement. Anyone can invoke Claude at the app's cost with no throttle.
- Files: `app/api/chat/guest/route.ts:16-188`
- Current mitigation: Client-side 5-message limit in `GuestChatInterface.tsx`, but this is bypassed by direct API calls.
- Recommendations: Add IP-based rate limiting and a server-side message count enforced via short-lived tokens or Redis.

**MermaidRenderer SVG Injection:**
- Risk: `dangerouslySetInnerHTML={{ __html: svg }}` renders SVG output from mermaid. While `securityLevel: 'strict'` is set, external SVG content injected via user-supplied diagram code could contain click handlers or script-adjacent content that `strict` mode may not fully sanitize.
- Files: `app/components/canvas/MermaidRenderer.tsx:22, 84`
- Current mitigation: Mermaid `securityLevel: 'strict'` is set.
- Recommendations: Add DOMPurify sanitization pass on the rendered SVG before injecting via `dangerouslySetInnerHTML` as a defense-in-depth measure.

## Performance Bottlenecks

**Full Workspace State Written on Every Message:**
- Problem: Every sent message triggers `supabase.update({ workspace_state: { ...all_messages } })`. As the conversation grows, each save writes the full JSONB blob including all prior messages.
- Files: `app/app/session/[id]/page.tsx:429-440`
- Cause: JSONB update replaces the entire column. A 100-message session writes ~100x more data than the incremental change.
- Improvement path: Append messages to a separate `messages` table row-by-row. Use the existing `conversations` schema or create a new append-only table.

**Simulated Streaming Adds Unnecessary Latency:**
- Problem: When Claude returns a non-streaming response (the `else` fallback branch), the route simulates streaming by splitting on spaces and adding per-word delays (20-100ms per word). A 500-word response takes 10-50 seconds to "stream."
- Files: `app/api/chat/stream/route.ts:578-587`, `app/api/chat/guest/route.ts:125-132`
- Cause: Claude client fallback path doesn't use real streaming.
- Improvement path: Remove artificial delays. If streaming isn't available, send the full response immediately without word-by-word simulation.

**Agentic Loop Tool Execution Is Sequential:**
- Problem: In `executeAgenticLoop`, all tool results are gathered then the next Claude call is made. Each round waits for all tools before continuing. If multiple independent tools are called in one round, they execute sequentially via `toolExecutor.executeAll`.
- Files: `app/api/chat/stream/route.ts:95`
- Cause: `executeAll` implementation may be sequential.
- Improvement path: Verify `ToolExecutor.executeAll` runs tool calls in parallel with `Promise.all`.

**Large Single-File Modules:**
- Problem: Several files exceed 1,000 lines, making them hard to navigate and increasing bundle/parse time.
- Files: `lib/bmad/analysis/growth-strategy-engine.ts` (1,535 lines), `lib/ai/mary-persona.ts` (1,486 lines), `app/api/bmad/route.ts` (1,491 lines), `lib/bmad/analysis/revenue-optimization-engine.ts` (1,398 lines)
- Cause: Analysis engines and the BMAD route handler were not split as they grew.
- Improvement path: Split `app/api/bmad/route.ts` into per-action handler files. Extract analysis sub-engines from the monolithic files.

## Fragile Areas

**`app/app/session/[id]/page.tsx` (1,038 lines):**
- Files: `app/app/session/[id]/page.tsx`
- Why fragile: Single component handles workspace loading, message streaming, board state, canvas state, tab switching, retry logic, and export. State is entangled across 15+ `useState` hooks. A change to streaming behavior can break canvas state, and vice versa.
- Safe modification: Add changes to isolated sections only. Always re-test: board speaker handoff, canvas open/close, message retry, and workspace save after any edit.
- Test coverage: No unit tests for this component. E2E smoke tests cover the route existence only.

**Message Limit Enforcement (Race-Prone):**
- Files: `app/api/chat/stream/route.ts:307-320`, `lib/bmad/message-limit-manager.ts`
- Why fragile: Message count is incremented before the response is sent. If the API errors mid-stream after increment, the user loses a message count without getting a response. The limit check also queries the DB twice (increment + check).
- Safe modification: Never move the increment to after the response. Consider adding a `message_attempted_at` column to handle rollback on catastrophic failure.
- Test coverage: Unit tests in `tests/lib/bmad/` but they mock Supabase, so actual DB atomicity is untested.

**Workspace Authorization in Stream Route:**
- Files: `app/api/chat/stream/route.ts:222-226`
- Why fragile: The workspace lookup queries by `user_id = auth.user.id` (correct), but the `workspaceId` parameter from the request body is passed to `bmad_sessions` queries without cross-checking that the session's `workspace_id` matches `user.id`. RLS policies on `bmad_sessions` should prevent IDOR, but this should be verified.
- Safe modification: Confirm RLS policy on `bmad_sessions` includes `user_id = auth.uid()` before relying on it.

**`lib/auth/beta-access.ts` JWT Claim Dependency:**
- Files: `lib/auth/beta-access.ts`
- Why fragile: Beta gate depends on a custom JWT claim (`beta_approved`) injected by a Supabase hook (migrations 015-017). If the hook fails or a user token was issued before approval, the fallback hits the `beta_access` table directly via `getSession()` (not `getUser()`). This creates a two-path auth system where failures in one path silently fall through.
- Safe modification: Do not change the JWT hook migrations without testing both the hook path and the DB fallback path.

## Missing Critical Features

**Stripe Payments Not Wired to Session Access:**
- Problem: `app/api/checkout/idea-validation/route.ts` creates a Stripe checkout session, but there is no webhook handler that grants access or credits upon payment completion. Credit deduction via `deduct_credit_transaction()` exists in `lib/monetization/credit-manager.ts` but is not called from the streaming flow.
- Blocks: Monetization. Users cannot purchase additional sessions.

**No Server-Side Message Count for Guest Users:**
- Problem: Guest message limits (5 messages) are enforced only client-side in `GuestChatInterface.tsx`. The server (`app/api/chat/guest/route.ts`) has no enforcement.
- Blocks: Cost control for the guest experience. Any developer tools bypass will consume API credits without limit.

## Test Coverage Gaps

**Session Page (`app/app/session/[id]/page.tsx`):**
- What's not tested: Streaming message parsing, board speaker handoff, canvas state persistence, message retry logic, workspace save on send.
- Files: `app/app/session/[id]/page.tsx`
- Risk: Any regression in the core session UX goes undetected until manual QA.
- Priority: High

**API Route Auth Bypass (`app/api/bmad/route.ts`):**
- What's not tested: The `isTestRequest` bypass is tested indirectly but the security implication (spoofed Referer) is not tested.
- Files: `app/api/bmad/route.ts:64-78`
- Risk: Security regression if the bypass is forgotten.
- Priority: High

**45/71 Unit Test Files Failing:**
- What's not tested: The 45 failing test files represent broad coverage gaps in auth, workspace context, bmad analysis, and conversation flows.
- Files: See `tests/` directory. Failures noted in project memory as pre-existing.
- Risk: New regressions are masked by pre-existing failures. No clean signal from CI.
- Priority: High - establish a baseline before adding new tests.

**Assessment Submission Flow:**
- What's not tested: No test verifies that the assessment API route actually inserts into the database or handles the missing table error.
- Files: `app/api/assessment/submit/route.ts`, `app/components/assessment/StrategyQuiz.tsx`
- Risk: Silent data loss continues undetected.
- Priority: Medium

---

*Concerns audit: 2026-02-20*
