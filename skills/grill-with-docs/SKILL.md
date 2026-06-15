---
name: grill-with-docs
description: Work a build idea or design decision through with the agent, grounded in the live repo. Walks the decision tree one branch at a time (recommended answer first), reads CLAUDE.md / docs/solutions/ / actual source to ground and cross-check claims, and captures resolved decisions into docs/solutions/ as it goes. Use when shaping a feature, schema change, or architecture call before writing code, or when you want shared understanding plus a durable record. Triggers on "grill with docs", "grill this against the codebase", "work this idea through", "let's design X", or "pressure-test this against the repo".
---

# Grill With Docs

Work a build idea through with the agent until it is sharp enough to implement, grounded in *this* repository's real code and documented decisions, and leave behind a durable record.

This is the **collaborative, file-grounded** member of the grill family. Unlike a paste-driven grill, you have the filesystem: read the code, check the docs, validate claims against what is actually there. Use it before writing code on anything non-trivial (a schema change, a new API surface, a board/persona behavior, a credit/auth path).

**For**: shaping a feature or decision against the real codebase, with shared understanding and a captured record as the output.

**Not for**: pure idea generation (use `ce-brainstorm`), writing an implementation plan (`ce-plan`), or post-hoc documentation of work already shipped (`/compound`).

---

## The loop

1. **Restate the decision in one sentence.** Confirm you and the user mean the same thing before grilling.
2. **Ground before you ask.** When a question can be answered from the repo, answer it from the repo. Do not speculate or ask the user to recite what the code already says. Read first:
   - `CLAUDE.md` (project rules, pitfalls, model/cost posture, conventions)
   - `docs/solutions/` (prior decisions and learnings; `grep -r "<term>" docs/solutions/`)
   - the actual source for the area in question (`lib/`, `app/`, `supabase/migrations/`)
3. **Walk the decision tree one branch at a time.** Ask exactly ONE question, then wait. For each question, **give your recommended answer first** so the user can accept it, correct it, or expose the hard part. Resolve dependencies before moving on.
4. **Cross-check claims against code.** When the user states behavior, verify it. Surface contradictions plainly: *"You said partial cancellation is supported, but `session-primitives.ts:deleteSession` drops the whole row. Which is right?"* Code is ground truth; a user's mental model is a hypothesis.
5. **Sharpen the language.** Challenge fuzzy or overloaded terms immediately. Propose one canonical term when several describe the same thing. Distinguish domain terms from code/module names. Keep this in-conversation. Do not spin up a separate glossary file (this repo does not keep one).
6. **Capture as you resolve** (see below). Do not batch to the end.

Stop when the decision is sharp enough to act on, or when the user says stop. The record is the point. End with a durable artifact, not an open thread.

---

## Capturing decisions: feed the repo's existing homes

This repo already has a durable-knowledge system. Use it; do not invent a parallel one (no `CONTEXT.md`, no `docs/adr/`).

- **Living decision record** writes/updates a `docs/solutions/<dir>/` doc using `docs/solutions/exploration-template.md`. It is this repo's ADR equivalent: `## Question`, `## Multi-Order Analysis` (2nd to 4th order is the second-order lens), `## Long-Term Implications` (Reversibility), `## Decision` / Rationale, `## Next Steps`. Accrete it as branches resolve. Pick the directory from `problem_type` per `docs/solutions/schema.yaml` (architecture calls go to `architecture-patterns/`).
- **Resolved, ship-worthy solution**: once the decision is made and implemented, hand off to the **`/compound`** workflow (owned by `compound-docs/`), which writes the schema-valid solution doc (`date`, `problem_type`, `severity`, `symptoms`, `root_cause`, `tags`).
- **Follow-ups**: `## Next Steps` checkboxes map to the `file-todos/` system; surface them there rather than letting them evaporate.

### The ADR-worthy test (offer sparingly)

Only flag a decision as durable-record-worthy when **all three** hold:

1. **Hard to reverse.** Changing your mind later has meaningful cost.
2. **Surprising without context.** A future reader will look at the code and ask "why on earth did they do it this way?"
3. **The result of a real trade-off.** Genuine alternatives existed and one was chosen for specific reasons.

If a decision is easy to reverse, not surprising, or had no real alternative, do not write a record. Note it in conversation and move on. Most branches resolve without a durable artifact.

---

## Composition

- Hands resolved decisions to **`compound-docs`** / `/compound` for the permanent write.
- Hands cross-referenced "the code says X" findings to **`debug`** when a contradiction turns out to be a bug.
- Hands `## Next Steps` to **`file-todos`**.
- Defers idea generation to `ce-brainstorm` and implementation sequencing to `ce-plan`.

## Tone

Direct, peer-level, skeptical. No praise, no warm-up, no rhetorical three-part lists, no em-dash drama. Read like a competent peer about to ship this with the user and wanting it not to blow up. Honesty over flattery: never invent agreement, evidence, or resolved decisions the conversation did not earn. Unresolved becomes an open question. Asserted without evidence becomes an assumption.

---

*Adapted from Matt Pocock's `grill-with-docs` skill (https://github.com/mattpocock/skills, MIT), retargeted to ThinkHaven's `docs/solutions/` + `compound-docs` knowledge system.*
