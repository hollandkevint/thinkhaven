# Beta-Gate Readiness: Can We Measure 60/50/40 Today?

*2026-07-05 — read-only instrumentation audit. No code changed. No queries executed against prod; every query below is runnable-but-not-executed.*

Produced alongside `2026-07-05-strategy-product-drift.md` by `docs/plans/2026-07-05-001-feat-fable-briefs-gtm-audits-plan.md`.

## Bottom line

One of the three gate metrics is measurable today from the database (engagement, with caveats). One is half-measurable (portability: share links yes, exports only as unjoinable client events). One is not instrumented at all and cannot be, by design, until payments go live (WTP). No gate can be scored from PostHog alone because half the defined events have zero call sites and the authenticated app fires almost nothing.

| Gate metric | Threshold | Verdict |
|---|---|---|
| Engagement | 60% | **MEASURABLE-NOW** (database; two caveats below) |
| Willingness-to-pay | 50% | **NOT-INSTRUMENTED** (expected: `CREDIT_SYSTEM_ENABLED` defaults false) |
| Output portability | 40% | **NEEDS-SMALL-CHANGE** (share leg measurable now; export leg can't be joined to sessions) |

## 1. Provenance of the 60/50/40 thresholds

The 60% engagement / 50% WTP / 40% portability gate comes from Kevin's project memory (roadmap-state beta-gate criteria, recorded 2026-04). **It does not exist in any repo document.** `STRATEGY.md` (repo root, lines 22–28) lists five key metrics and carries zero percentages or thresholds. Anyone auditing the repo alone would not find these numbers.

Reconciliation of the memory gates onto STRATEGY.md's actual key metrics:

| Memory gate (60/50/40) | STRATEGY.md key metric (line) | Fit |
|---|---|---|
| 60% engagement | Repeat advisor usage (line 27); Completed pressure tests (line 24) | Direct — engagement decomposes into "came back" and "finished with an artifact" |
| 50% WTP | Paid conversion (line 28) | Direct in intent; STRATEGY.md measures actual payment, the gate measures willingness — pre-payment these are different things |
| 40% output portability | Artifact share-out (line 25) | Direct — share/export of the decision artifact |
| (no gate) | Activated method forks (line 26) | Unmapped — the gate set predates the open-kit distribution track |

## 2. Definitions, term-by-term traces, verdicts

### 2.1 Engagement (60%) — MEASURABLE-NOW

**Proposed definition.** Numerator: approved beta users with at least one completed session OR at least two started sessions. Denominator: approved, non-revoked beta users who have accessed the app at least once. (Two-pronged numerator because "engaged" per STRATEGY.md means both repeat usage and completed pressure tests.)

**Term traces:**
- *Session started:* row insert into `bmad_sessions` with `status: 'active'` — `apps/web/lib/session/session-primitives.ts:128-141` (`createSessionRecord`). Table defined in `apps/web/supabase/migrations/001_bmad_method_schema.sql` (status check constraint at line 21: `active|paused|completed|abandoned`).
- *Session completed:* `completePhase` sets `status: 'completed'` + `end_time` when the last phase closes — `session-primitives.ts:465-470`. So "completed pressure test" = `bmad_sessions.status = 'completed'`.
- *Denominator:* `beta_access` with `approved_at IS NOT NULL AND revoked_at IS NULL`, plus `first_access_at` for "actually showed up" — `apps/web/supabase/migrations/030_beta_operations.sql:9-17` (columns) and the partial index at lines 33-35. (Note: two migrations share prefix 030; this is `030_beta_operations.sql`, not `030_feedback_recommend_fields.sql`.)

**Runnable query (PostgreSQL / Supabase SQL editor — not executed):**

```sql
WITH eligible AS (
  SELECT user_id FROM beta_access
  WHERE approved_at IS NOT NULL AND revoked_at IS NULL
    AND first_access_at IS NOT NULL AND user_id IS NOT NULL
),
activity AS (
  SELECT s.user_id,
         COUNT(*) AS sessions_started,
         COUNT(*) FILTER (WHERE s.status = 'completed') AS sessions_completed
  FROM bmad_sessions s
  JOIN eligible e ON e.user_id = s.user_id
  GROUP BY s.user_id
)
SELECT
  (SELECT COUNT(*) FROM eligible) AS denominator,
  COUNT(*) FILTER (WHERE sessions_completed >= 1 OR sessions_started >= 2) AS numerator,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sessions_completed >= 1 OR sessions_started >= 2)
        / NULLIF((SELECT COUNT(*) FROM eligible), 0), 1) AS engagement_pct
FROM activity;
```

**Caveats:**
1. Guest sessions (`/try`) never touch `bmad_sessions`; this metric covers authenticated users only. That matches "beta engagement" but means guest-to-signup funnel drop-off is invisible here.
2. `status = 'completed'` is only written by `completePhase` (`session-primitives.ts:405-481`). Whether real sessions actually traverse to that terminal state in production cannot be confirmed from code — if the agent loop rarely calls the final `completePhase`, completed counts will undercount true "finished" sessions. First query run will reveal this (a near-zero completed count with healthy session counts = lifecycle drift, not user apathy).
3. The client event that could corroborate this — `session_started` in the `TrackedEvent` union (`apps/web/lib/analytics/events.ts:4`) — is fired **only** from the guest interface with `source: 'guest'` (`apps/web/app/components/guest/GuestChatInterface.tsx:85`). No authenticated call site exists. PostHog cannot measure authenticated engagement today; the database can.

### 2.2 Willingness-to-pay (50%) — NOT-INSTRUMENTED

**Proposed definition (default WTP proxy).** Numerator: engaged users exhibiting any explicit payment-intent signal (purchase, checkout start, or pricing-CTA click). Denominator: engaged users (numerator of 2.1).

**Term traces:**
- *Actual purchases:* schema exists and is payment-ready — `credit_transactions` with `transaction_type = 'purchase'` and `stripe_payment_id` (`apps/web/supabase/migrations/005_session_credit_system.sql:23`, TypeScript shape at `apps/web/lib/monetization/credit-manager.ts:29-41`), plus `payment_history` (`005_session_credit_system.sql:53`). But `CREDIT_SYSTEM_ENABLED !== 'true'` bypasses all credit checks and deductions (`credit-manager.ts:87,130`), payment activation is pending, and migration `027_credit_system_activation.sql` only seeds 5-credit welcome grants. Purchase rows should be empty or near-empty; the schema is a container with nothing flowing into it.
- *Payment-intent client events:* the `TrackedEvent` union (`events.ts:3-11`) contains **no** payment-intent event — no pricing-page CTA, no checkout-started, nothing. Full union: `session_started`, `guest_limit_hit`, `signup_completed`, `board_offered`, `board_activated`, `canvas_exported`, `feedback_submitted`, `signup_prompt_shown`.
- *Stated-preference near-miss:* `feedback.would_recommend BOOLEAN` exists (`apps/web/supabase/migrations/030_feedback_recommend_fields.sql:4`) and is captured via `feedback_submitted` (`apps/web/app/components/feedback/FeedbackModal.tsx:62`). Recommendation intent is not payment intent; using it as the WTP numerator would be a silent substitution.

**Verdict: NOT-INSTRUMENTED.** No behavioral payment signal exists in schema data flow or analytics events. This is expected, not a bug — the WTP gate was defined for a state (payments live) the product hasn't entered. There is nothing to query.

### 2.3 Output portability (40%) — NEEDS-SMALL-CHANGE

**Proposed definition (default portability proxy).** Numerator: completed sessions that produced a share link OR an export. Denominator: completed sessions.

**Term traces:**
- *Share links — MEASURABLE-NOW (DB):* `POST /api/artifact/share` inserts into `public_artifacts` with `session_id`, `source` (`guest|session|cli`), `pathway`, `created_at` — `apps/web/app/api/artifact/share/route.ts:132-140` (allowed sources at line 20); table in `apps/web/supabase/migrations/033_public_artifacts.sql:13-23`. Note `session_id` is nullable and only populated when the client passes it; guest and CLI shares have `session_id = NULL`, so per-session joins only work for `source = 'session'` rows.
- *Canvas export — client event only:* `canvas_exported` (`events.ts:9`) fires from `apps/web/lib/export/canvas-export-md.ts:51` with `{ format, filled_boxes }` — **no `session_id` property**, so it cannot be joined to `bmad_sessions`. It supports a count-level export rate, not a per-session portability rate.
- *Conversation export — untracked:* `apps/web/lib/export/chat-export.ts` contains no `track()` or `posthog` call. Chat exports are invisible to analytics entirely.

**Runnable queries (not executed):**

Share leg (PostgreSQL / Supabase):
```sql
WITH completed AS (
  SELECT id FROM bmad_sessions WHERE status = 'completed'
)
SELECT
  (SELECT COUNT(*) FROM completed) AS completed_sessions,
  COUNT(DISTINCT pa.session_id) AS sessions_with_share,
  ROUND(100.0 * COUNT(DISTINCT pa.session_id)
        / NULLIF((SELECT COUNT(*) FROM completed), 0), 1) AS share_out_pct
FROM public_artifacts pa
JOIN completed c ON c.id = pa.session_id
WHERE pa.source = 'session';
```

Export leg (PostHog insight, described): Trends insight, event `canvas_exported`, aggregation = unique users (or total count), date range = beta period. This yields "how many users/exports," not "what share of completed sessions exported," because the event carries no session identifier. **Caveat: any PostHog-backed number is conditional on PostHog actually initializing in prod with a valid `NEXT_PUBLIC_POSTHOG_KEY` — init is silently skipped without one (`apps/web/app/providers.tsx:13-24`, no-key fallback at line 45). Not verifiable from code alone.**

**Verdict: NEEDS-SMALL-CHANGE.** The share-only proxy is measurable now from the database. The full definition (share OR export, per completed session) needs `session_id` on `canvas_exported` and a tracked chat export.

## 3. Gaps, smallest fixes, ranked by effort

| # | Gap | Smallest fix | Effort |
|---|---|---|---|
| 1 | `canvas_exported` has no `session_id` | Add `session_id` to the event properties in `lib/export/canvas-export-md.ts:51` and the union in `lib/analytics/events.ts:9` | ~5 lines |
| 2 | Chat export untracked | Add one `track()` call in `lib/export/chat-export.ts` (new `conversation_exported` union member with `session_id`) | ~10 lines |
| 3 | `signup_completed` and `board_activated` are defined in the union (`events.ts:6,8`) but have **zero call sites**; `board_offered` fires only via raw `posthog.capture` in the guest interface (`GuestChatInterface.tsx:253`) | Wire the two dead events at the auth-callback and board-activation points; route `board_offered` through `track()` | ~15 lines across 3 files |
| 4 | No authenticated `session_started` client event (guest-only, `GuestChatInterface.tsx:85`) | Optional — DB already covers authenticated engagement; add only if funnel analysis in PostHog is wanted | ~5 lines |
| 5 | WTP has no signal at all | Two-stage: (a) cheapest interim — add a `pricing_cta_clicked` / `checkout_started` event on `app/pricing/page.tsx` as an intent proxy; (b) real measurement requires flipping `CREDIT_SYSTEM_ENABLED` + Stripe activation, which is a product decision, not an instrumentation task | (a) ~10 lines; (b) launch decision |

## 4. Go/no-go read

**Can support today:** a defensible engagement percentage (SQL in 2.1) and a share-out percentage against completed sessions (SQL in 2.3), both from Supabase, no client-analytics dependency. If the engagement query returns a healthy denominator, the 60% gate can be scored this week.

**Cannot support today:** any WTP number (nothing to count — do not substitute `would_recommend`), a true portability rate that includes exports (unjoinable events), or any PostHog-derived number without first confirming the prod key is set and events are arriving. A gate decision made today would rest on one measurable metric, one half-metric, and one blank — that is a "not yet scoreable," not a "failed gate."

**Watch item:** if the first engagement query shows near-zero `status = 'completed'` rows alongside normal session volume, the problem is the completion lifecycle (caveat 2 in 2.1), and the gate definition should fall back to a message-depth proxy (`bmad_sessions` message-count columns from `apps/web/supabase/migrations/008_add_message_limits.sql`, RPC hardened in `026_fix_increment_message_count_idor.sql`) until `completePhase` reliably fires.

## 5. Kevin's call

Four decisions this report cannot make:

1. **WTP proxy definition.** Default taken here: WTP = explicit payment-intent signal only. None exists, so WTP is NOT-INSTRUMENTED — expected given `CREDIT_SYSTEM_ENABLED` defaults false. Accept the interim `pricing_cta_clicked` proxy (gap #5a), or hold the WTP gate blank until payments activate? Holding is the honest option; a CTA click is weaker evidence than the 50% bar implies.
2. **Portability proxy definition.** Default taken here: share-link creation or export per **completed** session. Alternative denominators (all sessions; all engaged users) move the number materially. Also: should guest shares (`public_artifacts.source = 'guest'`, no session join) count toward the gate, or is portability a beta-user metric only?
3. **Are 60/50/40 still the bar?** They live only in memory, predate the STRATEGY.md rewrite (2026-06-10), and don't map onto "activated method forks" at all. If they're still binding, codify them as thresholds in STRATEGY.md's key-metrics section so the repo carries them; if not, retire them explicitly.
4. **PostHog prod assumption.** Every client-event verdict assumes `NEXT_PUBLIC_POSTHOG_KEY` is set in Vercel prod and events are flowing. One check in the PostHog project (any `guest_limit_hit` or `feedback_submitted` events in the last 30 days?) confirms or kills that assumption. Do that before trusting any event-backed number.
