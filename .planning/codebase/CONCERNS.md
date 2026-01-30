# Codebase Concerns

**Analysis Date:** 2026-01-29

## Tech Debt

**Hardcoded Admin Email (Security Risk):**
- Issue: Admin bypass uses hardcoded email `kholland7@gmail.com` scattered across multiple files
- Files:
  - `lib/monetization/credit-manager.ts` (lines 92-94, 104-106)
  - `app/api/chat/stream/route.ts` (line 207)
- Impact: Admin privileges are granted at multiple decision points based on a single email. If this email is compromised or needs to be changed, code must be modified across multiple files. This is inflexible and creates security surface.
- Fix approach: Extract admin email to environment variable (ADMIN_EMAILS as comma-separated list). Create single `isAdminUser(email: string)` utility function in `lib/auth/admin-check.ts` called from all locations. Update `.env.example` with placeholder.

**Launch Mode Toggle Creates Permanent Bypass:**
- Issue: `LAUNCH_MODE=true` environment variable bypasses credit checks AND credit deductions entirely via `hasCredits()` and `deductCredit()` in `credit-manager.ts`
- Files: `lib/monetization/credit-manager.ts` (lines 87-98, 115-122)
- Impact: During SLC launch, users can create unlimited sessions without consuming credits. Message limits (10 per session) are enforced but credit system is neutered. When LAUNCH_MODE is disabled, credit logic suddenly activates - potential confusion if users expect free access to continue.
- Fix approach: Replace boolean flag with enum: `CREDIT_MODE=LAUNCH|STRICT|GRACE`. LAUNCH mode (current state) with explicit sunset date in code comment. Add warning logs when transitioning modes. Document credit system activation timeline in CLAUDE.md.

**Message Limit Auto-Creation Fails Silently:**
- Issue: `app/api/chat/stream/route.ts` (lines 213-255) creates a tracking session if none exists, but failures are swallowed with "fail open" pattern
- Files: `app/api/chat/stream/route.ts` (lines 248-254)
- Impact: If session creation fails (DB error, permissions), message counting won't work but the request succeeds. Users won't know their messages aren't being tracked. Later users may hit phantom limits based on inconsistent state.
- Fix approach: Fail closed on session creation. If sessionId can't be obtained/created, reject request with clear error: "Unable to initialize session tracking. Contact support." This preserves data integrity.

**Message Increment Race Condition Window:**
- Issue: `app/api/chat/stream/route.ts` (lines 260-276) checks limit after incrementing, but between increment and check there's a window where another request could slip through
- Files: `app/api/chat/stream/route.ts` (lines 277-296)
- Impact: Two concurrent requests might both pass the limit check if they execute after the same increment. Atomic DB function (`increment_message_count`) prevents the count issue but the client-side check is still racy.
- Fix approach: Return limit status from `increment_message_count()` RPC function and use that directly (already done). The code is actually safe here - the RPC does atomic update+return. Just ensure all callers use the returned limit status, never re-check.

**E2E Test Suite is Severely Limited:**
- Issue: Only 7 smoke tests exist, all testing public route loads. No functional testing of authenticated flows, tool execution, credit system, message limits, or critical pathways.
- Files: `tests/e2e/smoke/health.spec.ts` (854 bytes)
- Impact: Regressions in authenticated features (chat streaming, credit deduction, session creation, tool calling) won't be caught. Stripe integration wasn't tested before launch. Message limit bugs went unnoticed until SLC period.
- Fix approach: Priority order:
  1. Chat stream E2E (authenticated message flow with limit detection)
  2. Tool execution E2E (agentic loop with phase completion)
  3. Session creation E2E (credit check, session initialization, pathway routing)
  4. Credit system E2E (deduction on session start, balance updates)
  Target: 20+ tests covering core user flows.

**Tool Execution Round Limit (MAX_TOOL_ROUNDS = 5):**
- Issue: Hard limit of 5 agentic tool rounds in `app/api/chat/stream/route.ts` (line 17) prevents complex multi-step tasks
- Files: `app/api/chat/stream/route.ts` (lines 17, 61, 116-118)
- Impact: If Claude needs to discover pathways, read session state, complete phase, generate document, and save context in one turn, that's 5 rounds already. A 6th round (e.g., recommend action) gets cut off with message "(I reached my processing limit for this turn)". Users see incomplete responses.
- Fix approach: Increase to 10 rounds and add telemetry logging round count per request. If >90% of requests hit limit, increase again. Document expected tool chain complexity in CLAUDE.md.

**Guest Session State Stored in LocalStorage Only:**
- Issue: `app/api/chat/guest/route.ts` (lines 18, 31-40) and `lib/guest/session-store.ts` rely entirely on client-side localStorage for sub-persona state
- Files:
  - `app/api/chat/guest/route.ts` (lines 31-40)
  - `lib/guest/session-store.ts` (full file)
- Impact: Guest users can manually edit localStorage to reset their message counter, reset sub-persona mode, or manipulate session context. No server-side validation. This trivializes the 10-message trial limit.
- Fix approach: Server-side guest session tracking with 30-min TTL. Use Supabase `guest_sessions` table (new). Store UUID in httpOnly cookie, track message count server-side. Invalidate if client and server state diverge.

**Admin Email in Placeholder Exposed:**
- Issue: `app/resend-confirmation/page.tsx` has `kholland7@gmail.com` as placeholder text in email input
- Files: `app/resend-confirmation/page.tsx` (placeholder attribute)
- Impact: This is a minor UX issue but also reveals the admin email to anyone viewing page source or inspecting the DOM. Use generic placeholder like "user@example.com".
- Fix approach: Change placeholder to "you@example.com" or "name@company.com".

## Known Bugs

**Message Limit State Drift:**
- Symptoms: Some sessions show inconsistent message counts; users can continue past 10 messages in rare cases
- Files:
  - `lib/bmad/message-limit-manager.ts` (RPC functions)
  - `app/api/chat/stream/route.ts` (tracking logic)
- Trigger: Concurrent requests to same session + network delays. If client resends the same message twice before receiving limit-reached response, both increments succeed.
- Workaround: Client-side deduplication on message send (add idempotency key). Server-side already atomic via RPC.

**Migration 008 Rollback Artifact:**
- Symptoms: `.bak` file present in migrations directory
- Files: `supabase/migrations/008_rollback_message_limits.sql.bak`
- Trigger: Manual rollback during development was partially executed
- Impact: Confusing when running migrations sequentially. Should be deleted or merged into proper migration history.
- Fix approach: Remove `.bak` file. If 008 needs to be undone, create 013_revert_message_limits.sql instead.

**Sub-Persona Mode Not Wired to Claude API:**
- Symptoms: `mary-persona.ts` has full sub-persona implementation (67 tests) but `mary-persona.systemPrompt()` doesn't dynamically adjust system prompt based on current mode
- Files:
  - `lib/ai/mary-persona.ts` (mode detection works, but prompt generation static)
  - `lib/ai/claude-client.ts` (sends same system prompt regardless of mode)
- Trigger: Mode switching works (via `switch_persona_mode` tool) but Claude doesn't change behavior because system prompt never reflects the change
- Impact: Mode indicators in UI show change, but AI doesn't actually shift coaching style. Users see "Mode: Devil's Advocate" but Claude still responds encouragingly.
- Fix approach: Make `systemPrompt()` method accept `currentMode` parameter. Adjust tone, challenge level, and question style per mode. Wire mode into `CoachingContext` passed to Claude. This is ready to wire - just needs the prompt engineering.

## Security Considerations

**Supabase RLS Policies Not Documented:**
- Risk: RLS (Row Level Security) policies exist but no audit of scope. Could allow users to access other users' sessions if policies are misconfigured.
- Files: `supabase/migrations/010_fix_rls_insert_policies.sql` (migration exists but audit needed)
- Current mitigation: Migration 010 attempted to fix issues. No automated test of RLS policies in CI.
- Recommendations:
  1. Add RLS policy validation test: `tests/rls-policy-validation.test.ts` already exists but may need expansion
  2. Document all RLS policies in `CLAUDE.md` with who can access what
  3. Add to CI: `npm run test:rls` to validate policies on every migration

**Stripe Webhook Signature Verification:**
- Risk: If webhook signature verification fails, errors could leak transaction details
- Files: `lib/monetization/stripe-service.ts` (implementation assumed)
- Current mitigation: `stripe-service.ts.constructWebhookEvent()` called (mentioned in CLAUDE.md)
- Recommendations:
  1. Verify webhook signature verification exists and logs are not exposing request body
  2. Implement replay attack prevention (store webhook IDs, reject duplicates)
  3. Add idempotency keys to all Stripe operations

**API Key Exposure via Error Messages:**
- Risk: Error responses in catch blocks might expose sensitive context
- Files: Multiple API routes (`app/api/chat/stream/route.ts`, `app/api/bmad/route.ts`)
- Current mitigation: Generic error messages in responses ("Message tracking failed", "Workspace not found")
- Recommendations:
  1. Audit all `console.error()` calls to ensure no secrets logged
  2. Use error codes instead of messages for user-facing errors
  3. Log full errors server-side only, return error codes to client

**LAUNCH_MODE Disables Monetization Audit Trail:**
- Risk: With `LAUNCH_MODE=true`, credit system is bypassed, making it impossible to audit credit usage
- Files: `lib/monetization/credit-manager.ts`
- Current mitigation: Environment variable is server-only (not `NEXT_PUBLIC_`)
- Recommendations:
  1. Even in LAUNCH_MODE, log virtual credit transactions to audit table (don't deduct, but record intent)
  2. When transitioning to production, these logs help identify active users for billing

## Performance Bottlenecks

**Analysis Engines Load All Data In Memory:**
- Problem: Growth strategy, revenue, pricing, and feasibility engines instantiate with full template data
- Files:
  - `lib/bmad/analysis/growth-strategy-engine.ts` (1535 lines)
  - `lib/bmad/analysis/revenue-optimization-engine.ts` (1398 lines)
  - `lib/bmad/analysis/pricing-model-analyzer.ts` (1267 lines)
  - `lib/bmad/analysis/feasibility-assessment.ts` (1000 lines)
- Cause: Each engine loads complete interface definitions and method sets even if only 10% used per session
- Improvement path:
  1. Lazy-load engine methods: import only needed analyzer within phase
  2. Stream analysis results instead of accumulating in memory
  3. Cache analyzer instances (currently new instance per call)

**BMad Route Handler is Megafunction:**
- Problem: `app/api/bmad/route.ts` is 1491 lines, handles 10+ different operation types in single function
- Files: `app/api/bmad/route.ts`
- Cause: Should be split into separate routes: `/api/bmad/session`, `/api/bmad/analysis`, `/api/bmad/document`
- Improvement path:
  1. Create dedicated route files for each BMad operation
  2. Extract shared logic to `lib/bmad/route-handlers/`
  3. Reduce route.ts to <300 lines with operation dispatch

**Chat Stream Route Complexity:**
- Problem: `app/api/chat/stream/route.ts` handles auth, credit checking, message limit tracking, agentic loop, AND streaming
- Files: `app/api/chat/stream/route.ts` (350+ lines)
- Cause: All concerns bundled into one route to avoid creating new sessions
- Improvement path:
  1. Extract credit check to middleware or utility
  2. Move agentic loop to `lib/ai/agentic-loop.ts`
  3. Keep route as thin adapter: validate → check credits → execute loop → stream

**Database Queries Not Paginated:**
- Problem: Some queries fetch all records (e.g., pathway discovery, message history)
- Files:
  - `lib/bmad/capability-discovery.ts`
  - `lib/ai/conversation-persistence.ts`
- Cause: Assumes small result sets during MVP
- Improvement path:
  1. Add pagination parameters to all list queries
  2. Implement cursor-based pagination for message history
  3. Limit history to last 50 messages by default

**sub-persona.test.ts Uses 67 Tests (Slow):**
- Problem: `tests/lib/ai/mary-persona.test.ts` is 816 lines with 67 test cases
- Files: `tests/lib/ai/mary-persona.test.ts`
- Cause: All persona mode transitions tested exhaustively
- Impact: Test suite takes 10+ seconds to run
- Improvement path:
  1. Move expensive tests to separate `*.slow.test.ts` file
  2. Run slow tests on CI only, not during dev watch mode
  3. Use test.skip() for edge cases not critical to MVP

## Fragile Areas

**Session Primitives Layer:**
- Files: `lib/bmad/session-primitives.ts`
- Why fragile: `createSessionRecord()`, `completePhase()`, and `persistSessionState()` are atomic operations with implicit dependencies on BMad schema
- Safe modification:
  1. Always update schema migration + TypeScript types together
  2. Add integration tests for each primitive before modifying
  3. Use transactions for multi-step operations
- Test coverage: Unit tests exist, integration tests incomplete

**Message Limit Manager Depends on RPC Functions:**
- Files: `lib/bmad/message-limit-manager.ts`
- Why fragile: Relies on `increment_message_count()` and `check_message_limit()` RPC functions in Supabase. If functions are deleted/modified without code changes, silent failures.
- Safe modification:
  1. Keep migration 008 snapshot for comparison
  2. Test RPC functions exist before deployment
  3. Add schema migration test in CI: `npm run test:migrations`
- Test coverage: Tested in isolation but not end-to-end with API

**Agentic Tool Loop (Max 5 Rounds):**
- Files: `app/api/chat/stream/route.ts` (lines 23-126)
- Why fragile: Hard limit prevents flexible tool chains. If new tools added that require >5 rounds, requests fail silently.
- Safe modification:
  1. Add `toolRoundsExceeded` flag to response metadata
  2. Log when limit is hit to identify problematic patterns
  3. Increase limit gradually with telemetry
- Test coverage: No test of tool loop exhaustion scenarios

**Canvas Sync Two-Way Binding:**
- Files: `lib/canvas/useCanvasSync.ts`
- Why fragile: AI responses must contain valid Mermaid syntax wrapped in `<diagram>` tags. Parser is permissive but if format changes, canvas updates fail silently.
- Safe modification:
  1. Add strict validation: reject diagrams that don't parse
  2. Fallback rendering: show raw Mermaid if canvas fails
  3. Log parsing failures for debugging
- Test coverage: Canvas export tested, sync not tested

## Scaling Limits

**Session Storage Unbounded:**
- Current capacity: Each user can create unlimited sessions (except message limits during LAUNCH_MODE)
- Limit: Query performance degrades when user has >1000 sessions; no archive/cleanup
- Scaling path:
  1. Implement session archive: move completed sessions to cold storage after 90 days
  2. Add session pagination to dashboard (currently loads all in memory)
  3. Set hard limit of 500 active sessions per user

**Conversation History Stored in Supabase:**
- Current capacity: Full chat messages stored in `conversations` table (one row per message)
- Limit: ~10 million rows = 100 GB at current usage (~1KB/message average)
- Scaling path:
  1. Compress old conversations (zip + archive after 30 days)
  2. Implement message summarization: keep first/last 10 messages, summarize middle
  3. Move to dedicated message queue (e.g., PubSub) for long-term storage

**BMad Session Complexity Data:**
- Current capacity: Phase data, artifacts, insights all in JSONB columns
- Limit: No index on complex JSONB queries; scans full table for feature brief generation
- Scaling path:
  1. Normalize JSONB data into proper tables for frequently queried fields
  2. Add materialized views for common analysis outputs
  3. Implement read replicas for heavy analytical queries

**Stripe Webhook Processing:**
- Current capacity: Synchronous webhook processing in route handler
- Limit: 10-30 webhooks/sec causes request timeout
- Scaling path:
  1. Move webhook processing to queue (Bull, Inngest)
  2. Use async credits grant (eventual consistency acceptable)
  3. Add webhook deduplication by event ID + idempotency key

**Agentic Tool Execution:**
- Current capacity: Max 5 tool rounds per message, each round is serial
- Limit: Complex scenarios (discover pathway → read state → complete phase → generate doc) hit limit
- Scaling path:
  1. Increase MAX_TOOL_ROUNDS to 10
  2. Add parallel tool execution where possible
  3. Allow clients to request multi-turn with continuation tokens

## Dependencies at Risk

**Anthropic Claude API Version Pinning:**
- Risk: `@anthropic-ai/sdk` version may change API surface
- Impact: Tool definitions, message format changes could break tool calling
- Migration plan:
  1. Pin to specific SDK version in package.json
  2. Test SDK upgrades in staging before production
  3. Document API assumptions in `CLAUDE.md`

**Supabase RPC Functions Coupling:**
- Risk: RPC functions (`increment_message_count`, `check_message_limit`) tightly coupled to schema
- Impact: Schema migrations without RPC updates cause silent failures
- Migration plan:
  1. Always update RPC functions when modifying bmad_sessions schema
  2. Add schema migration validation test
  3. Document RPC dependencies in each migration file

**React PDF Renderer Version Compatibility:**
- Risk: `@react-pdf/renderer` has known compatibility issues with Next.js 15
- Impact: PDF generation may fail with version mismatch
- Migration plan:
  1. Test PDF generation on every Next.js upgrade
  2. Consider alternative: `pdfkit` (lower-level but more stable)
  3. Document tested version combinations

**tldraw Canvas v4 API Stability:**
- Risk: `tldraw` is under active development; API may change significantly
- Impact: Canvas sync could break on version update
- Migration plan:
  1. Pin to specific tldraw version
  2. Test canvas operations on any version bump
  3. Keep `lib/canvas/canvas-export.ts` abstraction layer stable

## Missing Critical Features

**Admin Dashboard:**
- Problem: No way to view user sessions, message usage, or credit transactions except via direct DB
- Blocks: Can't diagnose user issues, can't manage credits, can't see abuse patterns
- Impact: MEDIUM - affects ops and support
- Timeline: Implement in next sprint after SLC launch stabilizes

**Monitoring & Alerting:**
- Problem: No structured error tracking or alerting (only console logs)
- Blocks: Can't detect service degradation in production; issues only found via user complaints
- Impact: HIGH - affects reliability
- Recommendation: Integrate Sentry or similar service, add synthetic monitoring

**Idempotency Keys:**
- Problem: No request deduplication; concurrent messages may be processed twice
- Blocks: Can't reliably retry failed requests
- Impact: MEDIUM - affects reliability during network issues
- Timeline: Add to chat route first (highest volume)

**User Feedback Loop:**
- Problem: Trial feedback collection (migration 006) not wired to UI
- Blocks: Can't collect structured feedback on why users don't upgrade
- Impact: LOW - affects product insights
- Timeline: Wire up in post-MVP feedback collection phase

## Test Coverage Gaps

**Chat Streaming API:**
- What's not tested: Streaming response chunks, error handling mid-stream, tool execution context
- Files: `app/api/chat/stream/route.ts` (no E2E tests)
- Risk: Streaming bugs (truncation, encoding errors) only found in production
- Priority: HIGH - add E2E tests for message limit trigger, tool round limit, streaming failure recovery

**Credit System Atomic Operations:**
- What's not tested: Race conditions on concurrent deductions, Stripe webhook idempotency
- Files: `lib/monetization/credit-manager.ts` (RPC functions not tested with concurrent calls)
- Risk: Double-charging or under-charging in edge cases
- Priority: HIGH - add concurrent load tests before Stripe activation

**Message Limit Enforcement:**
- What's not tested: Off-by-one errors at limit boundary, LAUNCH_MODE bypass, RPC function failures
- Files: `lib/bmad/message-limit-manager.ts` (unit tests exist, but no integration tests)
- Risk: Users bypass limit (MAJOR) or false-positive blocks
- Priority: CRITICAL - add E2E test: create session → 10 messages → verify 11th fails

**Sub-Persona Mode Switching:**
- What's not tested: Mode switching during multi-turn conversation, persistence across sessions
- Files: `lib/ai/mary-persona.ts` (67 unit tests) but no E2E test of switch in chat
- Risk: Mode doesn't switch in practice despite tests passing
- Priority: MEDIUM - add E2E test for `switch_persona_mode` tool in chat flow

**Session Primitives Atomicity:**
- What's not tested: Partial failures in `completePhase()` or `persistSessionState()`, schema mismatches
- Files: `lib/bmad/session-primitives.ts` (unit tests exist)
- Risk: Sessions left in inconsistent state if transaction fails
- Priority: MEDIUM - add integration test for phase completion with concurrent API calls

**Error Handling Paths:**
- What's not tested: Database connection failures, Claude API timeouts, Supabase RPC errors
- Files: Multiple (error-handling tests exist but coverage <50%)
- Risk: Unhandled errors crash requests or return confusing messages
- Priority: MEDIUM - add `tests/error-scenarios/` tests for common failure modes

**RLS Policy Enforcement:**
- What's not tested: User A accessing User B's sessions/workspace, cross-workspace access
- Files: `tests/rls-policy-validation.test.ts` exists but may be incomplete
- Risk: Data leak if RLS misconfigured
- Priority: HIGH - verify all policies in CI before deployment

---

*Concerns audit: 2026-01-29*
