# Marketing Launch Content — GTM Beta

**Status:** PROVISIONAL. Kevin approves the primary hook and each post before anything is published. Nothing here has been posted.
**Rewritten:** 2026-07-05, replacing the Nov-2025 "MVP Trial" version (assessment-first, single-persona, $25/session). Old version lives in git history.
**Grounding:** STRATEGY.md (2026-06-10), `docs/reports/2026-07-05-strategy-product-drift.md` (U2), `docs/reports/2026-07-05-beta-gate-readiness.md` (U1), and the live landing copy in `apps/web/app/page.tsx`.

---

## Change-log: old framing → new framing

| Old (Nov 2025) | New (this doc) | Why |
|---|---|---|
| Primary audience: anyone making "strategic decisions" | Primary ICP: fractional operators and independent advisors; secondary: product builders | STRATEGY.md "Who it's for" |
| Funnel leads with the free assessment (`/assessment`) | Funnel leads with the guest session (`/try`, free, no signup) | The session is the product; the assessment sells a diagnostic the strategy no longer centers |
| "$25/session", monetization presented as imminent | Pricing removed; monetization is future-framed only | Payment is gated behind beta criteria; `CREDIT_SYSTEM_ENABLED` defaults false (U1: WTP NOT-INSTRUMENTED) |
| Single persona ("strategic thinking tools", Mary as sole voice) | Board of six advisors with distinct worldviews | Matches live landing hero and `board-members.ts` |
| "300+ hours building" credibility claim | Dropped | Unverifiable, and effort is not the pitch |
| Goal: "50+ assessment completions, 20+ signups" | Goals tied to STRATEGY.md metrics: completed pressure tests, artifact share-outs, method-kit activation | STRATEGY.md key metrics |
| No method-kit story | Open method kit as a distribution track | STRATEGY.md "Open method distribution" |
| Claims about product behavior asserted from memory | Current-behavior claims trace to U2 CONFIRMED rows; everything weaker is future-framed or method/vision language | Plan R4; drift audit found the "session won't close without an artifact" promise is NOT enforced (U2 claim 7, MISSING), so no post makes it |

**Claim traceability key (U2 drift audit):** This table goes stale the moment the audited code changes. Before adding a new shipped-behavior claim, re-verify it against a fresh drift audit, not this snapshot.
- CONFIRMED, safe to state as shipped behavior: earned-recommendation gate (no kill/commit verdict before exchange 5), skepticism escalation on overconfidence (devil's-advocate mode shift), shareable decision-record link (public share path with token, caps, RLS).
- Exists but WEAK (mechanism present, coverage weak): board registry + speaker switching, anti-sycophancy prompt posture, challenge-loop phases. Posts describe these as what a session *is* (consistent with the live landing page), never as guaranteed enforcement.
- MISSING: artifact-gated session close. No post promises "won't let you finish without an artifact."

---

## Positioning

**One-liner:**
> ThinkHaven is the peer board fractional operators lost when they went independent: six skeptical advisors who pressure-test a risky idea and leave you with a decision record you can put in front of a client.

**Short description (2–3 sentences):**
> Generic AI flatters your idea; borrowed consulting frameworks give it a generic map. ThinkHaven stages a board of advisors with distinct worldviews who drill into the specific idea you're about to pitch, advise on, or build, and withhold any verdict until it's earned. Sessions end with a shareable decision record, not a chat transcript.

**Primary hook (PROVISIONAL, Kevin approves before use):** the peer-bench gap. "Fractional operators lose something when they go independent: the peer bench." Alternates considered: lead with the artifact (P2 angle) or the anti-sycophancy refusal (P3 angle). The peer-bench frame is recommended because it names the ICP in the first sentence.

---

## LinkedIn posts

All counts measured mechanically (see Compliance evidence). Hard cap 1,248 chars. Suggested cadence: one per week, P1 first.

### Post 1 — The peer-bench gap (primary ICP hook) — 926 chars

```
Fractional operators lose something when they go independent: the peer bench.

At a company, a risky idea got kicked around by other executives before it reached the board. Solo, your pressure test is a chatbot that agrees with you or a framework that maps any idea into the same four boxes.

Neither one says "your client will ask about switching costs in the first ten minutes, and you don't have an answer."

I built ThinkHaven for that gap. A session stages six advisors with distinct worldviews who drill into the idea you're about to pitch, advise on, or commit a client to. Not to validate it. To find the weak assumption before the person paying you does.

You leave with a decision record you can actually show someone, not a chat transcript.

Free to try, no signup: thinkhaven.co/try

If you advise founders or run fractional engagements, I want to know where it falls short. That feedback is the product right now.
```

### Post 2 — The defensible artifact — 881 chars

```
The output of most AI strategy sessions is a chat transcript nobody will ever read again.

That's the tell that the thinking didn't finish. A real pressure test ends with something you can hand to the person paying you: here's the decision, here's what we challenged, here's the assumption that almost killed it, here's the next move.

ThinkHaven sessions close with a shareable decision record. One link. Your client, your founder, your board can read what survived the interrogation without seeing the messy middle.

I built this because I kept watching smart advisors do sharp thinking in AI tools and then have nothing defensible to show for it. The artifact is the point. The conversation is just how you get there.

Try a session free at thinkhaven.co/try and see what the record looks like. I'm collecting examples of what people share out, so if you run one, send me yours.
```

### Post 3 — The earned recommendation — 912 chars

```
I made my AI refuse to give verdicts early, on purpose.

Ask ThinkHaven "should I kill this idea?" in the first few exchanges and it won't answer. Not because it's coy. Because a verdict before the interrogation is a guess wearing a suit.

Most AI tools hand you a confident recommendation in the first reply. That's the sycophancy problem in its most expensive form: you brought a half-baked idea, it brought instant certainty, and now you're pitching a client with borrowed confidence.

ThinkHaven works the other way. It gets more skeptical when you sound more certain. It withholds the kill-or-commit call until the idea has taken enough hits to deserve one. The recommendation is earned or it doesn't exist.

Slower than a chatbot? Yes. That's the feature. The ten extra minutes are cheaper than the month you'd spend building on the assumption nobody challenged.

Free session, no signup: thinkhaven.co/try
```

### Post 4 — The open method kit — 883 chars

**PREREQUISITE: do not post until the public kit repo is published and the link below is real.** (The decision-architecture repo exists locally but is not pushed as of 2026-07-05.)

```
You shouldn't have to trust my product to use my method.

The pressure-testing method behind ThinkHaven is open. You can read every skill, run the grill loop manually in your own AI tool, and see exactly how the interrogation escalates from premise to mechanism to falsification. No account, no product, no trust required.

If the method earns its keep, the hosted version adds what a prompt can't: six advisors with distinct worldviews, memory across the session, and a shareable decision record at the end.

That ordering matters to me. Advisors don't adopt tools because a landing page said "trusted by." They adopt methods they can inspect, then pay for the version that saves them the assembly.

Kit is here: [REPO LINK, publish before posting]
Hosted version: thinkhaven.co

Fork it, break it, tell me where the method is wrong. That argument is worth more to me than a signup.
```

---

## Channel plan

| Channel | What | Notes |
|---|---|---|
| LinkedIn (Kevin's profile) | Posts 1–4, one per week, P1 first | Primary channel. Engage replies from fractional operators and consultants individually; those threads are ICP discovery, not just distribution. |
| HealthTechNerds (existing Slack) | Adapted P1, framed for healthtech advisors/consultants; conversational, no broadcast tone | Post as a "built this, want your skeptical take" ask, not an announcement. |
| Lenny's community (existing) | Adapted P3 (earned recommendation) for the PM/product-leader audience (secondary ICP) | Anti-sycophancy angle lands best with PMs burned by agreeable AI. |
| No custom Slack/Discord communities | n/a | Standing decision (2026-04-07). |

Monetization language across all channels: future-framed only ("free during beta"). Nothing is sold as live. Per U1, WTP instrumentation does not exist yet; the beta's job is engagement and artifact share-out signal first.

---

## Compliance evidence (U3 verification)

- **Char counts** (measured via script, 2026-07-05): P1 926, P2 881, P3 912, P4 883. All ≤ 1,248.
- **Banned-word scan:** regex over all four posts covering the full banned list from Kevin's global CLAUDE.md, including the two known substring traps: zero hits. Em-dash scan over post bodies: zero.
- **Traceability:** every shipped-behavior claim maps to a U2 CONFIRMED row (earned-recommendation gate → P3; skepticism escalation → P3; shareable decision record → P1/P2/P4). Board-of-advisors descriptions match the live landing hero and are framed as what a session is, not as enforcement guarantees. No post claims artifact-gated session close (U2: MISSING). No post states or implies live pricing.
- **Open items for Kevin:** approve the primary hook; approve each post before publishing; publish the kit repo before P4; decide the P4 repo link.
