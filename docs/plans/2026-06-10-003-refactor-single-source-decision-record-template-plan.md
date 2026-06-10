---
title: "refactor: Single-source the decision_record template"
type: refactor
date: 2026-06-10
---

# refactor: Single-source the decision_record template

## Summary

Kill the "keep them in sync" duplication: the decision-record section structure is hand-maintained in two places — the synthesis system prompt in `app/api/chat/guest/artifact/route.ts` and `DOCUMENT_TEMPLATES.decision_record` in `lib/ai/tools/document-tools.ts`, with only a comment guarding against drift. Extract one shared definition both consumers derive from. Small, behavior-preserving, removes a silent-drift landmine on the product's reputation-bearing artifact.

## Problem Frame

`app/api/chat/guest/artifact/route.ts:12` carries the comment: "The decision_record section shape mirrors the canonical template in lib/ai/tools/document-tools.ts (DOCUMENT_TEMPLATES.decision_record). Keep them in sync." Comment-enforced sync always drifts eventually; when it does, the guest artifact and the in-chat document tool produce structurally different decision records, and nothing fails. Cost-preservation context: this is a pure refactor with zero model-cost impact — the synthesis prompt content stays semantically identical.

## Key Technical Decisions

- **One canonical section list, two renderers.** Extract the section names (Resolved Decisions, Open Questions, Assumptions, Risks, ADR-Worthy Decisions, Recommended Next Action) plus title/summary slots into a small client-safe module. The synthesis prompt and the document template both render from it.
- **Placement: a new `lib/artifact/decision-record-template.ts`** (the `lib/artifact/` directory already exists and is the artifact domain's home). It must stay free of server-only imports so both an API route and the tools layer can consume it (CLAUDE.md pitfall 24 discipline, applied preemptively).
- **Prompt text stays in the route.** Only the structural skeleton (section list and ordering) is shared; the synthesis instructions (honesty rules, bullet style, ADR criteria) remain route-owned prose that interpolates the shared structure. Sharing the entire prompt would couple the in-chat tool to synthesis-specific voice rules — wrong boundary.
- **A drift test replaces the comment.** The real enforcement is a test asserting both consumers carry the same section sequence.

## Implementation Units

### U1. Extract the canonical template module

**Goal:** `lib/artifact/decision-record-template.ts` exporting the ordered section list and a markdown-skeleton builder.
**Files:** `apps/web/lib/artifact/decision-record-template.ts` (new); `apps/web/tests/lib/artifact/decision-record-template.test.ts` (new).
**Approach:** Export `DECISION_RECORD_SECTIONS: readonly string[]` (ordered) and `decisionRecordSkeleton()` returning the `# title / > summary / ## sections` markdown shape currently embedded in both consumers. No I/O, no env, no server imports. Check `lib/artifact/artifact-types.ts` first — if a decision-record shape already exists there, extend rather than duplicate.
**Test scenarios:**
- Section list has the six known sections in canonical order.
- Skeleton output contains every section as an H2 in order, exactly once.
**Verification:** New module imports cleanly from both a route file and a lib file (no server-only transitive imports).

### U2. Consume from the guest synthesis route

**Goal:** `SYNTHESIS_SYSTEM_PROMPT` builds its structure block from the shared template; the "keep in sync" comment is deleted.
**Files:** `apps/web/app/api/chat/guest/artifact/route.ts`; existing test `apps/web/tests/api/chat/guest-artifact.test.ts`.
**Dependencies:** U1.
**Approach:** Interpolate the section headings from `DECISION_RECORD_SECTIONS` into the prompt template literal. The prompt's instructions and rules text are unchanged — diff of the final rendered prompt string should be empty (assert once during development, then rely on the route tests).
**Test scenarios:**
- Existing guest-artifact suite stays green (transcript validation, rate limit, error mapping).
- New: the system prompt sent to the model contains every canonical section heading in order (assert via the existing claude-client mock).
**Verification:** Rendered prompt is byte-identical to the previous hardcoded version (manual diff at development time); suite green.

### U3. Consume from document-tools and add the drift test

**Goal:** `DOCUMENT_TEMPLATES.decision_record` derives its section structure from the shared module; a test makes future drift fail loudly.
**Files:** `apps/web/lib/ai/tools/document-tools.ts`; `apps/web/tests/lib/ai/tools-index.test.ts` or a new focused test file.
**Dependencies:** U1.
**Approach:** Replace the hardcoded section scaffold in the template definition with the shared builder. Keep the template's tool-facing metadata (type key, label) where it is.
**Test scenarios:**
- Drift guard: the sections produced by `DOCUMENT_TEMPLATES.decision_record` equal `DECISION_RECORD_SECTIONS` (this test is the contract that replaces the comment).
- Existing tools-index suite (19 tests) stays green.
**Verification:** Grep confirms no remaining hardcoded copy of the section list outside the shared module; full suite green.

## Scope Boundaries

- **Non-goals:** no changes to synthesis behavior, model selection, caps, or prompt voice; no authed synthesis endpoint (rejected earlier on cost); no template versioning.
- **Deferred:** if `~/.claude/skills/thinkhaven-plan-grill/` (the CLI harness) carries its own copy of the section structure, note it in the PR as a third consumer to align later — out of repo scope here.

## Risks

- Low. The one real failure mode is accidentally changing the rendered prompt string; the byte-identical check in U2 covers it.
