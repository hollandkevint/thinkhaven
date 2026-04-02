---
title: "feat: ICP launch sprint - product readiness + content + distribution"
type: feat
date: 2026-04-02
deepened: 2026-04-02
---

# ICP Launch Sprint: Product Readiness + Content + Distribution

## Enhancement Summary

**Deepened on:** 2026-04-02
**Research agents used:** spec-flow-analyzer, learnings-researcher, linkedin-content-system, B2B SaaS ICP validation

### Critical Findings
1. **Guest board tease is completely broken** — `GuestChatInterface` never sends `subPersonaState` back, so exchange count never increments. Board offer at exchange 3 never fires. This is the #1 conversion killer.
2. **SignupPromptModal promises "Unlimited conversations"** — actual model is 5 free sessions with 10-msg caps. Bait-and-switch risk.
3. **Guest session migration double-counts messages** — counts user + assistant messages, immediately hitting the limit on the migrated session.
4. **ICP validation research says: 5 conversations BEFORE content distribution** — validate demand through direct calls first, not LinkedIn posts.
5. **Realistic LinkedIn conversion: 0-2 paid users/month from organic alone** — DMs are higher leverage than posts at zero users.

### Revised Strategy
The original plan had content distribution in week 1. Research says that's premature. **New sequence:** Fix bugs (days 1-3) -> Validate ICP through 5-10 direct conversations (days 4-7) -> Content distribution only AFTER validation confirms the ICP (days 8-14).

---

## Overview

Two-week sprint to go from zero distribution to first real users. Four phases: fix critical product bugs, validate ICP through conversations, produce ICP-targeted content, execute distribution with feedback loops.

**Brainstorm source:** `docs/brainstorms/2026-04-02-icp-gtm-playbook-brainstorm.md`
**Lead ICP:** Alex (Multi-Bet Operator) for week 1. Add Jordan (Strategy Practitioner) in week 2 based on results.

---

## Phase 1: Critical Bug Fixes (Days 1-3)

These bugs would kill the /try -> signup -> paid funnel. Fix before any human sees the product.

### 1.0 FIX: Guest board tease is broken (SHOWSTOPPER)

**Problem:** `GuestChatInterface.tsx` never sends `subPersonaState` back to `/api/chat/guest`. The API initializes a fresh state on every request, so `exchangeCount` never increments past 0-1. The board offer at exchange 3 **never fires in guest mode**. This is the core conversion hook for the entire GTM funnel.

**Root cause:** `GuestChatInterface.tsx:129` — the fetch body doesn't include `subPersonaState`. The API at `api/chat/guest/route.ts:65-86` reads state from the body but falls back to fresh init when it's missing.

**Fix:**
1. Store `subPersonaState` in component state (returned from each API response)
2. Send it back with each subsequent message in the fetch body
3. API already handles it — just needs the client to pass it through

**Files to modify:**
- `apps/web/app/components/guest/GuestChatInterface.tsx` — Add `subPersonaState` to component state, include in fetch body, update from response
- `apps/web/app/api/chat/guest/route.ts` — Verify it returns `subPersonaState` in the response (may already do this)

**Acceptance criteria:**
- [ ] Open /try, send 3 messages. Mary explicitly offers the board by name: "Want me to bring in Victoria, Casey, and Omar?"
- [ ] Board offer includes signup nudge (guest can't activate board)
- [ ] Taylor (opt-in) is NOT mentioned in the initial board tease

### 1.1 FIX: Landing page says "5 messages", actual limit is 10

**Problem:** `app/page.tsx:82` reads "5 messages to see if it's for you." Actual limit is 10 (`lib/guest/session-store.ts:24`).

**Fix:** Update CTA subtext. Keep 10 as the limit (gives users time to experience the board tease at exchange 3 and still have 7 messages after).

**Implementation note (from learnings):** `page.tsx` is a server component. Keep it that way. CTA text appears 4x on the page (known P3 duplication). Consider extracting a const for the CTA copy to single-source it. Use `<Link>` + `Button asChild` pattern, not `div+onClick`.

**Files to modify:**
- `apps/web/app/page.tsx:82` — Update "5 messages" to "10 messages"

**Acceptance criteria:**
- [ ] Landing page CTA subtext matches `MAX_MESSAGES` value

### 1.2 FIX: SignupPromptModal promises "unlimited" (bait-and-switch)

**Problem:** `SignupPromptModal.tsx:84-86` promises "Unlimited conversations / No more message limits." Actual model: 5 free sessions, each capped at 10 messages. Users who sign up expecting unlimited will feel deceived when they hit session limits.

**Fix:** Change copy to accurately reflect the value: "5 free sessions with your full Board of Directors" or "Continue this session with Victoria, Casey, and Omar."

**Files to modify:**
- `apps/web/app/components/guest/SignupPromptModal.tsx:84-86` — Fix copy

**Acceptance criteria:**
- [ ] SignupPromptModal copy accurately describes what users get (5 free sessions, board access)
- [ ] No promises of "unlimited" anything

### 1.3 FIX: Guest migration double-counts messages

**Problem:** `lib/guest/session-migration.ts:70` sets `message_count: chatMessages.length` which includes BOTH user and assistant messages. Authenticated sessions only count user messages via `incrementMessageCount`. A guest with 5 user messages (10 total with responses) migrates with `message_count: 10` against a `message_limit: 10`, immediately hitting the limit.

**Fix:** Filter to user messages only when setting `message_count` during migration.

**Files to modify:**
- `apps/web/lib/guest/session-migration.ts:70` — Change to count only `role === 'user'` messages

**Acceptance criteria:**
- [ ] Guest with 5 user messages migrates with `message_count: 5`, not 10
- [ ] Migrated session has remaining capacity matching the user's actual usage

### 1.4 FIX: CreditGuard "Coming Soon" + env var check

**Problem:** `CreditGuard.tsx:128-131` shows "Purchase Credits (Coming Soon)" as a disabled button. If the payment flow is supposed to work, this needs to link to `/pricing` or the Stripe Payment Link.

**Also:** Two env vars must be set in Vercel for the paywall to exist:
- `CREDIT_SYSTEM_ENABLED=true` (defaults to `false`, meaning unlimited free sessions)
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (without it, pricing page Pro CTA shows "Coming soon")

**Files to modify:**
- `apps/web/app/components/monetization/CreditGuard.tsx:128-131` — Link to `/pricing` or Stripe
- Vercel dashboard — Set env vars

**Acceptance criteria:**
- [ ] CreditGuard button links to working payment flow
- [ ] `CREDIT_SYSTEM_ENABLED` and `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` set in production

---

## Phase 1b: Instrumentation (Day 2-3, parallel with bug fixes)

### 1.5 Add PostHog events for funnel tracking

**Problem:** Only 3 events tracked (`lib/analytics/events.ts`): `session_started`, `guest_limit_hit`, `signup_completed`. Can't measure the conversion funnel.

**Add these events (from learnings: all events must go in the typed events file, not ad-hoc captures):**

```typescript
type TrackedEvent =
  | { event: 'session_started'; properties: { source: 'guest' | 'authenticated' } }
  | { event: 'guest_limit_hit'; properties: { message_count: number } }
  | { event: 'signup_completed'; properties: { source: 'modal' | 'page'; method: 'google' | 'email' } }
  // NEW:
  | { event: 'board_offered'; properties: { exchange_count: number; source: 'guest' | 'authenticated' } }
  | { event: 'board_activated'; properties: { exchange_count: number } }
  | { event: 'canvas_exported'; properties: { format: 'markdown'; filled_boxes: number } }
  | { event: 'feedback_submitted'; properties: { feedback_type: string; would_recommend?: boolean } }
  | { event: 'signup_prompt_shown'; properties: { trigger: 'guest_limit' | 'board_tease' | 'manual' } }
```

**Note:** Added `board_offered` and `signup_prompt_shown` (from spec-flow analysis: can't measure the funnel without knowing when the conversion-critical moments happen).

**Files to modify:**
- `apps/web/lib/analytics/events.ts` — Add event types
- `apps/web/lib/ai/tool-executor.ts` — Fire `board_activated` on first `switch_speaker`
- `apps/web/lib/export/canvas-export-md.ts` — Fire `canvas_exported` on download (note: this is a client-side file, PostHog works here)
- `apps/web/app/components/feedback/FeedbackModal.tsx` — Fire `feedback_submitted` on submit
- `apps/web/app/components/guest/SignupPromptModal.tsx` — Fire `signup_prompt_shown`
- `apps/web/app/components/guest/GuestChatInterface.tsx` — Fire `board_offered` when board tease text appears

**From learnings (Pattern #29):** FeedbackModal error handling must re-throw after setting error state. Don't swallow the submit failure.

**Acceptance criteria:**
- [ ] All 8 events fire at correct moments
- [ ] PostHog funnel: session_started -> board_offered -> signup_prompt_shown -> signup_completed -> board_activated -> canvas_exported

### 1.6 Add "Would you recommend?" to FeedbackModal

**Revised approach (from ICP validation research):** At <25 users, "Would you recommend?" always gets yes and is meaningless. Better question: **"If ThinkHaven disappeared tomorrow, what would you do instead?"** as a free-text field. This reveals whether they have genuine alternatives (meaning the product solves a real problem) or would just shrug (meaning it doesn't).

**However:** Keep the yes/no toggle too for quantitative tracking at scale. It becomes useful after 50+ responses.

**Change:** Add two fields after feedback_type:
1. "Would you recommend ThinkHaven to a colleague?" — Yes/No toggle (quick signal)
2. "If ThinkHaven disappeared tomorrow, what would you do instead?" — Short text field (deep signal)

**Files to modify:**
- `apps/web/app/components/feedback/FeedbackModal.tsx` — Add both fields
- `apps/web/lib/feedback/feedback-schema.ts` — Add to Zod schema
- `apps/web/app/api/feedback/route.ts` — Accept new fields
- New migration: `ALTER TABLE feedback ADD COLUMN would_recommend BOOLEAN, ADD COLUMN disappear_alternative TEXT;`

**Acceptance criteria:**
- [ ] Both fields visible in FeedbackModal
- [ ] Both optional (form submits without them)
- [ ] Values stored in feedback table

### 1.7 Smoke-test the full funnel

After bugs are fixed and instrumentation is in, Kevin runs the exact scenarios:

- [ ] Open /try. Send 3 messages. Confirm Mary offers the board with named members.
- [ ] Board offer includes clear "sign up to continue" nudge
- [ ] Sign up via Google OAuth. Confirm guest session migrates correctly (message count accurate)
- [ ] Dashboard shows migrated session with remaining capacity
- [ ] Start new full session. Board members have distinct voices.
- [ ] Export lean canvas. Output is structured markdown with 9 sections.
- [ ] Hit message limit. FeedbackModal auto-triggers with new fields.
- [ ] Check PostHog. All events fired correctly in sequence.

**Log every issue.** Fix before proceeding to Phase 2.

---

## Phase 2: ICP Validation Conversations (Days 4-7)

**This phase is new (from ICP validation research).** Before writing content, validate demand through direct conversations. Content amplifies existing demand; it doesn't create it.

### 2.0 Identify 10 candidates (5 per ICP)

**Alex types (Multi-Bet Operator):**
- Fractional exec communities, Chief of Staff Network, On Deck alumni
- Kevin's existing network: anyone running 2+ things simultaneously
- HealthTechNerds members who are also running side projects

**Jordan types (Strategy Practitioner):**
- Independent consultants in Kevin's LinkedIn network
- Strategy/advisory people in Lenny's or HealthTechNerds
- People who post about frameworks, decision-making, or client work

### 2.1 Run 5-10 conversations (Mom Test format)

**NOT a product demo.** Ask about their last decision, not whether they'd use ThinkHaven.

**Questions (from Mom Test framework):**
1. "Walk me through the last strategic decision you made in the past 2 weeks"
2. "What did you actually do to think it through?"
3. "What was the hardest part?"
4. "How much time did that take?"
5. Show ThinkHaven /try only in the last 5 minutes: "I built something for this. Try it and tell me if it's garbage."

**Score each conversation (1-5):**
- Frequency of the problem
- Intensity of pain
- Existing alternatives they use
- Willingness to try something new

**Wallet test:** "I'm charging $39 for this. Would you buy it right now?"

### 2.2 Decide: proceed, pivot ICP, or pivot product

**Proceed to Phase 3 if:** 3+ of 5 conversations in one ICP score 4+ on frequency AND intensity, and at least 1 person says yes to the wallet test.

**Pivot the ICP (not the product) if:** People say "this is cool" but don't return or wouldn't pay.

**Pivot the product if:** People return but don't complete sessions, or complete them but describe zero impact on actual decisions.

---

## Phase 3: Content Production (Days 7-9)

Only proceed here after Phase 2 validates the lead ICP.

### 3.1 LinkedIn post #1: Alex hook (Tuesday)

**Research insights (from linkedin-content-system skill):**

**Hook type:** Personal Vulnerability + Pattern Recognition. Not a product announcement.

**Recommended hook:**
> "Running 4 bets at once taught me something uncomfortable: I was using AI to confirm decisions I'd already made."

**Format rules:**
- 150-300 words, hard cap 1,248 characters
- Line break every 2-3 sentences (mobile-first)
- Link in FIRST COMMENT, not post body (40-50% fewer impressions with links in body)
- CTA is a question (drives comments): "What's the hardest part about running multiple bets?"
- "I built" not "we launched"
- Don't say "AI-powered" in the hook
- Name tools specifically: "ChatGPT," "Claude," not "AI tools"

**Voice (non-negotiable from Kevin's style):**
- Contractions always. Specific numbers always.
- Wildly varied sentence lengths. Parenthetical asides.
- Kill on sight: "moreover," "leverage," "transform," "seamless," passive voice

**Draft skeleton (ready for Kevin to edit):**
```
Running 4 bets at once taught me something uncomfortable:
I was using AI to confirm decisions I'd already made.

ChatGPT is great at "yes, and." It'll validate your
pivot, your hire, your pricing change. Every time.

That's not strategy. That's a mirror.

What I actually needed:
- Someone to ask "what happens if this fails?"
- A check on my assumptions before I commit $40K
- Challenge that feels like a tough board meeting,
  not a cheerful assistant

(Turns out this is a known problem. Confirmation bias
scales beautifully with AI.)

So I built something different. Structured challenge
sessions with AI advisors who push back on your thinking.
20 minutes. Not a chatbot.

If you're running multiple ventures and making solo
decisions on each one, you know this feeling.

What's the hardest part about running multiple bets?

#solopreneur #AI #decisionmaking #strategy
```

**Quality checklist (run before posting):**
- [ ] Hook stops the scroll
- [ ] Value clear in first 3 lines (above the fold)
- [ ] Scannable format with line breaks for mobile
- [ ] One CTA (question OR link, not both)
- [ ] Sounds like Kevin (direct, practical, slightly contrarian)
- [ ] Personal element included
- [ ] Active voice only, no banned words
- [ ] Under 1,248 characters

### 3.2 Slack post: HealthTechNerds

**Angle:** Healthcare decision-making, not a product pitch. Value-first, link-last. Under 500 chars.

**Draft:**
```
Built a tool that runs structured challenge sessions
for strategic decisions. Using it myself for portfolio
allocation across my ventures. Six AI advisors who
actually push back on your thinking (not a chatbot).

Looking for 5-10 fractional execs or multi-hat operators
to try it and give brutal feedback.

Free, no signup: thinkhaven.co/try
```

### 3.3 DM follow-up template

For people who engage with the LinkedIn post:

```
Hey [Name] - saw your comment on the multiple bets post.
Are you juggling a few things right now? I built a
structured challenge tool that pressure-tests whether
each bet is worth your time. 5 min, no signup:
thinkhaven.co/try

Would genuinely love your take on whether it's useful
or just another AI thing.
```

### 3.4 LinkedIn post #2: Framework education (Thursday)

**Hook type:** Contrarian reframe. Give away 100% of the insight. ThinkHaven is the footnote.

**Recommended hook:**
> "You don't have a strategy problem. You have an allocation problem."

**Draft skeleton:**
```
You don't have a strategy problem.
You have an allocation problem.

When you're running 2-4 ventures, every hour and
every dollar is a bet. Most people treat each venture
independently. That's backwards.

The frame I use: Portfolio Allocation.

Same concept VCs use, applied to your own ventures:
- Which bet has the highest expected value right now?
- Where am I over-indexed on hope vs. evidence?
- What would I kill if I had to drop one today?

Two of those questions are uncomfortable. That's the point.

I run this frame through ThinkHaven, a structured
challenge session that forces me to defend my
allocation out loud. 20 minutes, and I've caught
myself over-investing in the wrong bet twice already.

(Honestly, the second time stung. I'd been pouring
energy into something for emotional reasons, not
strategic ones. The AI advisors didn't care about
my feelings. Helpful.)

The framework is free. Use it however you want.
If you want the structured version: thinkhaven.co/try

#portfoliothinking #solopreneur #strategy #AI
```

**Cadence:** Post 1 Tuesday, Post 2 Thursday. Gives each post time to breathe.

---

## Phase 4: Distribution + Feedback (Days 9-14)

### 4.1 Week 2 execution

| Day | Action | Channel |
|-----|--------|---------|
| Tue (Day 9) | Post Alex-focused LinkedIn post (#3.1) | LinkedIn |
| Tue | Post to HealthTechNerds (#3.2) | Slack |
| Tue | Engage 15-30 min before and after posting (algorithm signal) | LinkedIn |
| Wed | DM 10 people who engage (#3.3) | LinkedIn DMs |
| Thu (Day 11) | Post framework education post (#3.4) | LinkedIn |
| Thu | If signal from Jordan types: post to Lenny's | Slack |
| Fri-Sat | Respond to comments, follow up in Slack threads, DM follow-ups | All |
| Sun (Day 14) | Synthesize all feedback, decide next sprint | Internal |

### 4.2 Feedback collection protocol

**In-app (automated):**
- FeedbackModal triggers at message limit
- Tracks: feedback_type, would_recommend, disappear_alternative, free_text

**Direct conversations (highest signal, from ICP validation research):**
- After anyone completes 2+ sessions, send a personal message asking for a 15-minute call
- Questions that work:
  1. "What were you trying to figure out when you used ThinkHaven?"
  2. "What did you do before/after the session? Did it change anything?"
  3. "If ThinkHaven disappeared tomorrow, what would you do instead?"
  4. "How would you describe this to a colleague in one sentence?" (tests positioning)
  5. "Who else do you know who'd find this useful?" (if they can't name anyone, positioning is off)
- Avoid: "Would you recommend this?" (always yes), "What features would you add?" (users design for themselves)

**Key signal to watch:** Do any of the first 10 users come back unprompted for a second session? That's the only metric that matters at this scale.

**LinkedIn comments (public signal):**
- Watch for language patterns. What words do people use to describe their situation?
- Feed successful phrases back into next cycle's copy
- 80% of posts should be about decision-making challenges, 20% about ThinkHaven

### 4.3 Daily DM outreach (parallel to posts)

**From ICP validation research:** Direct outreach is higher leverage than content at zero users.

- 10 personalized DMs/day to ICP-matching LinkedIn profiles
- Lead with the problem, not the product
- Direct to /try (zero friction)
- Goal: 5 new trial users per week from DMs alone

---

## Success Metrics (2-week sprint)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| ICP validation conversations | 5-10 | Manual count (Phase 2) |
| "Would you buy right now?" yes | 2+ | Wallet test in conversations |
| /try sessions started | 15+ | PostHog `session_started` where source=guest |
| Board offer shown in /try | 10+ | PostHog `board_offered` |
| Signups from /try | 5+ | PostHog `signup_completed` |
| Full sessions completed (5+ msg) | 5+ | PostHog or DB query |
| Board activated (post-signup) | 3+ | PostHog `board_activated` |
| Unprompted return users | 1+ | PostHog repeat session_started |
| Feedback responses | 3+ | Supabase feedback table |
| DM conversations | 15+ | Manual count |

**Revised targets (from conversion benchmarks):** Original plan expected 25+ /try sessions and 10+ signups. Realistic at zero brand recognition: 15+ /try and 5+ signups in 2 weeks from organic + DMs. Expect 0-2 paid conversions in the first sprint.

---

## Conversion Benchmarks (reference)

From ICP validation research, realistic for early-stage B2B SaaS with no brand:

| Stage | Rate | Your math |
|-------|------|-----------|
| LinkedIn impression -> click | 0.5-1.5% | 1,000 impressions = 5-15 clicks |
| Website visit -> /try start | 5-15% | 10 clicks = 0.5-1.5 trials |
| /try start -> meaningful session | 30-50% | |
| Active free user -> paid ($39) | 5-10% | Need 10-20 active users per conversion |

Working backwards: ~15,000-40,000 impressions needed per paid user. At 3 posts/week averaging 1,500 impressions (500-2000 connection account), that's ~18,000/month. **Expect 0-2 paid users/month from LinkedIn organic alone.** DM outreach supplements this.

---

## Dependencies & Risks

**Risks:**
- **Guest board tease bug (mitigated by Phase 1.0):** Without this fix, the entire funnel is broken. No board tease = no differentiation from ChatGPT = no signup motivation.
- **Mary gives generic responses:** Smoke-test in Phase 1.7. If Mary doesn't reframe, tune the system prompt before distributing.
- **Email signup kills momentum:** Guest clicks signup, gets "Check email for confirmation." Session dies. If they confirm in a different browser, localStorage is gone. Google OAuth is the preferred path. Consider making Google the primary/only signup method for the /try flow.
- **Kevin's LinkedIn audience composition:** May not contain enough Alex types. HealthTechNerds Slack + daily DMs mitigate.

**Dependencies:**
- Phase 1 (bugs) must complete before Phase 2 (validation conversations) — product must work
- Phase 2 (validation) must confirm ICP before Phase 3 (content) — don't invest in content for wrong audience
- Phase 3 (content) completes before Phase 4 (distribution) — have posts ready before calendar starts

---

## References

### Product Files
- Board offer logic: `apps/web/lib/ai/mary-persona.ts:517-538` (`BOARD_OFFER_EXCHANGES = [3, 8, 15]`)
- Guest state bug: `apps/web/app/components/guest/GuestChatInterface.tsx:129` (missing `subPersonaState`)
- Guest API: `apps/web/app/api/chat/guest/route.ts:65-86`
- Guest message limit: `apps/web/lib/guest/session-store.ts:24` (`MAX_MESSAGES = 10`)
- Landing page CTA: `apps/web/app/page.tsx:82`
- SignupPromptModal: `apps/web/app/components/guest/SignupPromptModal.tsx:84-86`
- Migration bug: `apps/web/lib/guest/session-migration.ts:70`
- CreditGuard: `apps/web/app/components/monetization/CreditGuard.tsx:128-131`
- FeedbackModal: `apps/web/app/components/feedback/FeedbackModal.tsx`
- PostHog events: `apps/web/lib/analytics/events.ts`
- Canvas export: `apps/web/lib/export/canvas-export-md.ts`
- Feedback auto-trigger: `apps/web/app/app/session/[id]/page.tsx:90-101`
- Auth callback: `apps/web/app/auth/callback/route.ts` (redirects to `/app`, not `/try`)

### Research Sources
- Brainstorm: `docs/brainstorms/2026-04-02-icp-gtm-playbook-brainstorm.md`
- LinkedIn content skill output: `.claude/plans/quiet-humming-pebble-agent-a2c09c3ebe57967ff.md`
- Project learnings: `docs/solutions/patterns/individual/pattern-13-observability-by-default.md`, `pattern-23-mandatory-instrumentation.md`, `pattern-29-explicit-error-handling-no-silent-swallowing.md`, `pattern-01-single-source-of-truth-for-business-logic.md`
- Landing page learnings: `docs/solutions/code-quality/landing-page-review-findings-and-fixes.md`
- Board architecture: `docs/solutions/architecture-patterns/personal-board-of-directors-multi-perspective-ai.md`
