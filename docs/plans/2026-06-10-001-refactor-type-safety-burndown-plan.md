---
title: "refactor: Type-safety burndown — eliminate explicit any and source tsc errors"
type: refactor
date: 2026-06-10
---

# refactor: Type-safety burndown

## Summary

Eliminate the suppressed type layer in the web app: 93 `@typescript-eslint/no-explicit-any` errors, ~61 `no-unused-vars`, and ~100 `tsc --noEmit` errors in source files (non-test). Each `any` site requires reading the surrounding code to infer the correct type — judgment work, not find-replace (only 3 of 172 lint problems are auto-fixable). The unit suite is now fully green, so every fix has a regression gate.

## Problem Frame

ESLint reports 172 problems; `tsc --noEmit` reports ~771 errors of which ~100 are in source files (the rest are test-harness drift, lower priority). The source errors concentrate in load-bearing modules: `lib/session/session-primitives.ts` (12), `app/api/chat/stream/route.ts` (10), `lib/ai/tools/session-tools.ts` (8), `lib/ai/tool-executor.ts` (7), `app/components/chat/ExportDialog.tsx` (7), `lib/monetization/credit-manager.ts` (6). A suppressed type layer hides real bugs — the green-test-suite work found a dormant token-usage-callback bug behind exactly this kind of unchecked surface.

**Open question to resolve first (U1):** `npm run build` succeeds despite ~100 source type errors. Determine why (likely `typescript.ignoreBuildErrors` in `next.config.ts` or tsconfig exclusions). The answer determines the end state: if errors are build-suppressed, the burndown's payoff is re-enabling enforcement.

## Key Technical Decisions

- **Source files before test files.** Source `any`s hide runtime bugs; test-harness type errors are noise. Test-file errors (~670) are explicitly deferred to follow-up.
- **Infer real types, never cast to `unknown` as a dodge.** Where a Supabase row shape is needed, derive from `lib/supabase/conversation-schema.ts` or the table interfaces already defined in pages; create shared types only when 2+ consumers need them (client-safe placement per CLAUDE.md pitfall 24).
- **Module-by-module commits**, ordered by error density, tests run after each.
- **End state is enforcement**, not just zero counts: re-enable build-time type checking if it is currently suppressed, so the debt cannot silently re-accumulate.

## Implementation Units

### U1. Diagnose and document the enforcement gap

**Goal:** Establish why source type errors don't fail `npm run build`, and define the enforcement end state.
**Files:** `apps/web/next.config.ts`, `apps/web/tsconfig.json` (read; modify only at U6).
**Approach:** Check `typescript.ignoreBuildErrors` and tsconfig `exclude`. Record the finding in the PR description. Produce the authoritative per-file error inventory (`tsc --noEmit` filtered to non-test paths) as the burndown checklist.
**Verification:** A written inventory of source-file errors by module, and a confirmed answer to the build-suppression question.
**Test expectation:** none — diagnostic unit.

### U2. Burn down `lib/session/` and `lib/monetization/` (highest risk)

**Goal:** Zero tsc errors and zero `no-explicit-any` in `session-primitives.ts` (12 errors), `message-limit-manager.ts`, `credit-manager.ts` (6).
**Files:** `apps/web/lib/session/*.ts`, `apps/web/lib/monetization/*.ts`; tests in `apps/web/tests/lib/` covering these modules.
**Approach:** These touch credits and session ownership (CLAUDE.md pitfalls 2, 9, 17) — type errors here are the most dangerous. Derive row types from the Supabase schema definitions. Do not change runtime behavior; if a type fix reveals a real bug, fix it in a separate commit with a test.
**Patterns to follow:** `lib/session/pathway-labels.ts` for client-safe shared types.
**Test scenarios:** Existing suites must stay green; add a test only where a latent bug is found (bug fix + regression test in its own commit).
**Verification:** `npx tsc --noEmit` shows zero errors for these paths; `npx eslint lib/session lib/monetization` clean; full unit suite green.

### U3. Burn down the AI layer

**Goal:** Zero errors in `lib/ai/tools/session-tools.ts` (8), `lib/ai/tool-executor.ts` (7), `lib/ai/context-builder.ts` (5), `lib/ai/tools/document-tools.ts` (4), remaining `lib/ai/*` sites.
**Files:** `apps/web/lib/ai/**/*.ts`; tests in `apps/web/tests/lib/ai/`.
**Dependencies:** U2 (shared row types may be established there).
**Approach:** Tool-executor and session-tools shapes should align with the Anthropic SDK types already imported in `claude-client.ts` (`Tool`, `ContentBlock`, `ToolUseBlock`). The agentic-loop conversation array (pitfall: tool_results as user messages) has a precise SDK type — use it.
**Test scenarios:** `tests/lib/ai/` suites (181 tests) stay green.
**Verification:** Zero tsc/eslint errors under `lib/ai/`.

### U4. Burn down API routes and components

**Goal:** Zero errors in `app/api/chat/stream/route.ts` (10), `app/app/session/[id]/page.tsx` (4), `app/components/chat/ExportDialog.tsx` (7), remaining `app/` and `lib/` sites (monitoring, voice, supabase, auth).
**Files:** `apps/web/app/api/chat/stream/route.ts`, `apps/web/app/components/**`, `apps/web/lib/{monitoring,voice,supabase,auth}/**`.
**Dependencies:** U3 (stream route consumes tool-executor types).
**Approach:** Note: ExportDialog is also slated for Radix migration (companion plan 2026-06-10-002); if that plan executes first, skip its type fixes here to avoid double work — coordinate by checking git state at execution time.
**Test scenarios:** Component suites stay green (`StreamingMessage`, `navigation`, integration suites).
**Verification:** Zero source-file tsc errors repo-wide; `npx eslint . ` error count ≤ the test-file-only residue.

### U5. Clear `no-unused-vars` and `react-hooks/exhaustive-deps`

**Goal:** Eliminate the 61 unused-vars errors and triage the 6 exhaustive-deps warnings.
**Files:** Across `apps/web` per lint output.
**Dependencies:** U2–U4 (type fixes often remove or rename the offending bindings).
**Approach:** Unused vars: delete, or prefix `_` only where the binding is structurally required. exhaustive-deps: each is a judgment call — fix the dependency array unless doing so introduces a render loop; document any deliberate suppression inline with the reason. Hooks must re-throw errors (pitfall 16) — watch for swallowed errors while in these files.
**Test scenarios:** Full suite green; manually verify no effect-loop regressions in touched components (dev-server smoke of the session workspace).
**Verification:** `npx eslint .` reports zero errors outside test files.

### U6. Re-enable enforcement

**Goal:** Make the clean state permanent.
**Files:** `apps/web/next.config.ts` and/or `apps/web/tsconfig.json`, CI workflow if a typecheck step is added.
**Dependencies:** U2–U5.
**Approach:** Per U1's finding: remove `ignoreBuildErrors` (or equivalent) so source type errors fail the build. If test-file errors still block a blanket `tsc --noEmit` gate, scope the gate to source paths (a `tsconfig.typecheck.json` with test excludes) and leave a documented follow-up for the test-harness debt.
**Test scenarios:** `npm run build` passes; intentionally introducing a type error in a source file fails the build (verify once locally, then revert).
**Verification:** Build-time type enforcement active; CLAUDE.md "Test State"/baseline notes updated.

## Scope Boundaries

- **Deferred to follow-up:** the ~670 test-file tsc errors (jest-namespace remnants, implicit anys in helpers); `react/no-unescaped-entities` cosmetic fixes are fair game opportunistically but not a goal.
- **Non-goals:** no runtime behavior changes except discovered-bug fixes (separate commits, with tests); no dependency upgrades; no `strict` tsconfig flag changes beyond what enforcement requires.

## Risks

- Typing Supabase query results can surface genuine schema-drift bugs — that is the point, but each one becomes its own decision (fix impl vs fix type). Budget for a few.
- ExportDialog overlap with the Radix migration plan — execution-time coordination noted in U4.
