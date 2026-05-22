---
date: 2026-05-22
topic: thinkhaven-surprise-me
focus: surprise-me
mode: repo-grounded
---

# Ideation: ThinkHaven Surprise-Me

## Grounding Context

### Codebase Context

- ThinkHaven is a Next.js/Supabase/Stripe app at `apps/web/` with a public landing page, guest `/try` path, authenticated `/app` dashboard, session workspace, board-of-directors speaker switching, artifacts, lean canvas, feedback, and credit-based pricing.
- `STRATEGY.md` names the target problem as half-baked ideas amplified by AI confidence and not challenged early enough.
- The strategy says ThinkHaven wins by making structured dissent and multi-perspective refinement cheap, repeatable, and artifact-producing.
- Active tracks are open method distribution, hosted pressure-test experience, defensible artifacts, and a simple paid product loop.
- Current product surfaces already include an open method homepage section, Method Kit repo link, `plan-grill` pathway, board members, artifact rendering, `decision-record` and `domain-context` documents, feedback modal, pricing page, and minimal analytics events.

### Past Learnings

- The board-of-directors architecture exists as a single Claude call with `switch_speaker` tool-call state changes and explicit speaker rendering. Its differentiator is structural perspective, not tone.
- The docs-aware `plan-grill` pathway showed that hosted pathways need end-to-end continuity through guest sessions, migration, Mary prompting, tools, artifacts, and tests.
- Institutional patterns emphasize persistence over conversation, explicit workflow triggers, and rigorous multi-order thinking.

### Method Kit Context

- ThinkHaven Method Kit has a flagship `b2b-idea-vetting` skill that outputs decision under review, strongest case, weakest assumption, evidence gaps, recommended next move, one-week test, and confidence level.
- The public kit is explicitly not a self-hosted platform clone; it exposes methods, prompts, playbooks, and decision architecture.

### External Context

- Every's "Socrates as a Service" argues that the valuable gap is extraction: surfacing tacit knowledge through strong questioning and judgment, especially when the insight is not already written down.
- NAO is an open-source analytics agent that uses an open context builder plus a hosted/chat execution layer and emphasizes reliability visibility through tests, feedback, usage, and context versioning.
- AI validation competitors are report-heavy: many promise instant scores, market scans, competitor data, validation reports, MVP plans, landing tests, and investor-ready outputs. ThinkHaven's wedge is live pressure-testing plus consultant-grade judgment artifacts.

## Topic Axes

Decomposition skipped - surprise-me mode.

## Ranked Ideas

### 1. Method-to-hosted handoff

**Description:** Create a tight bridge from the public Method Kit into hosted ThinkHaven. A user runs `b2b-idea-vetting` manually, then brings the artifact into `/try?mode=plan-grill` or an authenticated session where Mary and the board continue from the decision under review, weakest assumption, evidence gaps, and confidence level.

**Basis:** `direct:` `README.md` and `STRATEGY.md` define the repo as the open method and ThinkHaven as the hosted execution layer; the Method Kit's flagship skill already emits the exact decision fields needed for continuation.

**Rationale:** This is the cleanest way to tie open-source distribution to paid product value without self-hosting or exposing internals.

**Downsides:** Needs careful UX to avoid looking like an upload/import platform; v1 can be copy-paste and prompt-seeded.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 2. Consultant pre-work link

**Description:** Give consultants a "send this to a client before we meet" flow. It opens a narrow pressure test, produces a clean artifact, and makes ThinkHaven useful as pre-session preparation rather than only a solo thinking tool.

**Basis:** `direct:` `STRATEGY.md` names independent consultants as primary; `docs/brainstorms/2026-04-02-icp-gtm-playbook-brainstorm.md` explicitly says client pre-work could save discovery time and become a buying trigger.

**Rationale:** This turns the strongest persona into a distribution loop: every consultant use can expose a client to ThinkHaven.

**Downsides:** Client-facing polish matters; weak artifacts would damage trust faster here than in solo use.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 3. Decision artifact v1.5

**Description:** Standardize the primary artifact around the Method Kit schema: decision under review, strongest case, weakest assumption, evidence gaps, recommended next move, one-week test, and confidence level. Use this as the target output for plan-grill, guest sessions, and consultant pre-work.

**Basis:** `direct:` `skills/b2b-idea-vetting/SKILL.md` already defines this artifact; `apps/web/lib/artifact/artifact-types.ts` and `apps/web/lib/ai/tools/document-tools.ts` already support `decision-record`.

**Rationale:** ThinkHaven's strategy says the work product is a defensible artifact. This makes "defensible" concrete and portable across open repo and hosted app.

**Downsides:** Could flatten different session types if forced everywhere; start with B2B idea, offer, and plan pressure tests.

**Confidence:** 91%

**Complexity:** Medium

**Status:** Unexplored

### 4. Board disagreement receipt

**Description:** After the board weighs in, generate a short "what changed" receipt: where advisors disagreed, which assumption was weakened or strengthened, and what the user should do next. This should appear inside the artifact, not only in chat.

**Basis:** `direct:` the board architecture note says structural perspective is the differentiator; the landing page says advisors are useful because they disagree.

**Rationale:** It makes anti-sycophancy visible. Users can see that ThinkHaven did not just produce another polished AI answer.

**Downsides:** Requires the system to capture disagreement cleanly rather than summarize every speaker equally.

**Confidence:** 78%

**Complexity:** Medium

**Status:** Unexplored

### 5. Product feedback loop around changed judgment

**Description:** Add a lightweight post-session prompt asking: "Did this change your recommendation?", "What would you have done without ThinkHaven?", and "Would you use this in paid work?" Connect answers to artifact completion, exports, repeat sessions, and paid conversion.

**Basis:** `direct:` `STRATEGY.md` names positive feedback, repeat sessions, and paid conversion as key metrics; `FeedbackModal.tsx` already collects feedback and asks what users would do if ThinkHaven disappeared.

**Rationale:** This measures whether the method actually sharpens judgment, not just whether users clicked or exported.

**Downsides:** Feedback prompts can be annoying if triggered too early; tie them to export, session limit, or explicit finish.

**Confidence:** 82%

**Complexity:** Low

**Status:** Unexplored

### 6. Public method eval fixtures

**Description:** Add public fixtures to the Method Kit that run representative ideas through each skill and check for artifact completeness, weak-assumption quality, evidence-gap specificity, and anti-sycophancy. Start with the Jonathan-style and product-manager examples.

**Basis:** `external:` NAO's README emphasizes reliability visibility through tests, feedback, usage, and context versioning; `direct:` the Method Kit already contains sample examples.

**Rationale:** This gives the open-source repo credibility beyond a prompt dump and creates a way to improve the hosted method without exposing platform internals.

**Downsides:** Eval quality is hard; bad tests can reward formulaic artifacts.

**Confidence:** 73%

**Complexity:** Medium

**Status:** Unexplored

### 7. Painkiller onboarding for consultants

**Description:** Rework first-run and pricing copy around the fear and aspiration in the strategy: consultants use ThinkHaven to make their judgment sharper, more repeatable, and harder to replace. Show the "client came with a vague idea; you leave with a defensible next move" use case immediately.

**Basis:** `direct:` strategy names consultants and expert service providers as primary; pricing currently sells "sessions" and "Lean Canvas" rather than consultant-grade judgment leverage.

**Rationale:** This is the clearest conversion copy shift and supports the paid loop without adding a new feature surface.

**Downsides:** Needs restraint so it does not over-narrow the entire product away from product people and PMMs.

**Confidence:** 80%

**Complexity:** Low

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Broad integration marketplace | Strategy explicitly says broad integrations are not current scope. |
| 2 | Self-hosted ThinkHaven | Violates the boundary against exposing platform internals or promising self-hosting. |
| 3 | BYOK kit-hosting mode | Strategy explicitly excludes bring-your-own-keys or full kit-hosting workflows. |
| 4 | Heavy Excalidraw workspace | Interesting, but complex visual outputs are not current scope; keep artifact visuals lightweight. |
| 5 | Generic chatbot replacement mode | Contradicts strategy; ThinkHaven should not compete as a general chatbot. |
| 6 | Team workspace features | Strategy says team features are not a now bet. |
| 7 | Voice board sessions | Prior brainstorm exists, but current strategy favors method, artifacts, and paid loop. |
| 8 | Hosted method recipe gallery | Useful but lower leverage than a direct method-to-hosted handoff. |
| 9 | Consultant-branded artifact footer | Useful variant of consultant pre-work and artifact quality, not strong enough alone. |
| 10 | Repo-to-site release note cadence | Distribution tactic, better handled under open method distribution after stronger product loop exists. |
| 11 | Question-quality library | Good Method Kit improvement, but lower near-term leverage than eval fixtures and hosted artifacts. |
| 12 | No-build win artifact | Strong copy angle, but best as part of decision artifact v1.5 rather than separate idea. |
