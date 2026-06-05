---
title: "feat: OpenRouter fallback for AI synthesis"
type: feat
status: completed
date: 2026-06-04
depth: standard
target_repo: thinkhaven (apps/web)
---

# feat: OpenRouter fallback for AI synthesis

## Summary

Add OpenRouter as a fallback AI provider for the guest decision-record synthesis path so the hero keeps working when the Anthropic key fails (credit exhausted, rate-limited, or upstream 5xx). Anthropic stays the primary provider; OpenRouter is insurance. A manual env switch (`AI_PROVIDER=openrouter`) also lets the OpenRouter path be exercised locally without spending Anthropic credit. Scope is the single-shot `ClaudeClient.complete()` call — the path that actually broke on June 4 — not the streaming/tool chat.

---

## Problem Frame

On June 4 the Anthropic account hit "credit balance too low" and `claudeClient.complete()` started failing. The guest decision-record endpoint (`app/api/chat/guest/artifact/route.ts`) catches the resulting upstream error and returns a 503, so the public "build my decision record" hero — the marketing artifact — silently breaks the moment the Anthropic balance dips. The key was rotated and credit restored, but a single-provider dependency means the same outage recurs on any future credit lapse, rate-limit spike, or Anthropic incident.

OpenRouter keys were added to the Vercel env (prod + preview) to serve as a fallback. This plan wires the code to use them.

---

## Scope Boundaries

**In scope**
- OpenRouter fallback for `ClaudeClient.complete()` (single-shot, no tools, no streaming).
- Manual provider switch via `AI_PROVIDER` env for local/testing.
- Env contract + docs for `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `AI_PROVIDER`.

**Outside this product's identity**
- Falling over the streaming `sendMessage()` / `sendMessageWithTools()` chat paths. OpenRouter is OpenAI-format and does not cleanly speak Anthropic's content-block + tool-use + streaming shape; translating tool schemas and stream parsing is a separate, larger effort. **Consequence: if Anthropic credit lapses, live Mary chat still breaks — only the guest synthesis hero is protected.** Documented, not silently assumed.

### Deferred to Follow-Up Work
- Tool/streaming-path fallback (would require an Anthropic→OpenAI tool-schema translation layer).
- Provider health metrics / alerting on fallback activation.
- Applying the still-unapplied migrations `030`/`031`/`032` and the `030` duplicate-numbering fix (tracked separately; unrelated to this change).

---

## Key Technical Decisions

- **KTD1 — Fallback, not replacement.** Anthropic stays primary; OpenRouter is only reached on failure or explicit switch. Preserves current model quality/cost and keeps the change low-risk.
- **KTD2 — `complete()` only.** (User decision.) It is the path that broke and is single-shot/no-tools, so OpenRouter's OpenAI-format endpoint is a clean drop-in. The tool/streaming paths are not.
- **KTD3 — Raw `fetch`, no new dependency.** Only `@anthropic-ai/sdk` is installed. OpenRouter's `/api/v1/chat/completions` is OpenAI-compatible and the call site is single — a small `fetch` helper beats adding the `openai` SDK.
- **KTD4 — Manual switch `AI_PROVIDER=openrouter`.** (User decision.) Read at call-time (not module-load) so tests and local runs can flip it to exercise OpenRouter without touching Anthropic.
- **KTD5 — Fallback-worthy errors = 402, 429, ≥500, and missing/empty `ANTHROPIC_API_KEY`.** Other 4xx (e.g. 400 invalid request) are re-thrown unmasked so genuine request bugs don't get silently papered over by a second provider.
- **KTD6 — New isolated module `lib/ai/openrouter-client.ts`.** Keeps the OpenRouter transport, model mapping, and config-detection out of `claude-client.ts`, which only orchestrates the try/fallback. Independently testable.

---

## Implementation Units

### U1. OpenRouter transport helper

**Goal:** A self-contained module that performs a single-shot completion against OpenRouter's OpenAI-compatible endpoint and reports whether it is configured.

**Requirements:** Enables KTD1, KTD3, KTD6.

**Dependencies:** none.

**Files:**
- `apps/web/lib/ai/openrouter-client.ts` (new)
- `apps/web/tests/lib/ai/openrouter-client.test.ts` (new)

**Approach:**
- Export `openRouterComplete({ system, prompt, maxTokens, temperature }): Promise<string>`.
- POST to `https://openrouter.ai/api/v1/chat/completions` with raw `fetch`. Body: `{ model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens, temperature }`. Headers: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `Content-Type: application/json`, plus OpenRouter attribution headers (`HTTP-Referer`, `X-Title`).
- Model: `process.env.OPENROUTER_MODEL` or default `anthropic/claude-sonnet-4` (same family as the Anthropic default, read at call-time).
- 60s timeout via `AbortController`, matching the existing Anthropic `complete()` timeout override.
- Parse `choices[0].message.content`; throw a typed `OpenRouterError` (carrying `status`) on non-200 or empty content.
- Export `isOpenRouterConfigured(): boolean` — true only when `OPENROUTER_API_KEY` is a non-empty trimmed string.

**Patterns to follow:** mirror the typed-error + 60s-timeout style already in `claude-client.ts` `complete()`. Config read via `process.env.X?.trim()` as `getAnthropicClient()` does.

**Test scenarios** (Vitest — matches the active `"test": "vitest"` runner; mock global `fetch`):
- Happy path: mocked 200 with `choices[0].message.content` → returns the text.
- Model default: no `OPENROUTER_MODEL` → request body uses `anthropic/claude-sonnet-4`; with it set → uses the override.
- Auth/credit failure: non-200 (401/402) → throws `OpenRouterError` with the status preserved.
- Empty content: 200 but missing/empty `choices` → throws.
- Timeout: aborted/rejected fetch → throws (does not hang).
- `isOpenRouterConfigured()`: true with key present, false when unset or whitespace-only.

**Verification:** new test file green under `npm run test:run`; helper imports cleanly with no new package added to `package.json`.

---

### U2. Wire fallback + manual switch into `ClaudeClient.complete()`

**Goal:** `complete()` uses Anthropic by default, falls back to OpenRouter on fallback-worthy failure, and routes directly to OpenRouter when `AI_PROVIDER=openrouter`.

**Requirements:** Enables KTD1, KTD2, KTD4, KTD5.

**Dependencies:** U1.

**Files:**
- `apps/web/lib/ai/claude-client.ts` (modify `complete()` only)
- `apps/web/tests/lib/ai/claude-client.test.ts` (extend; add a `complete()` describe block using Vitest `vi`)

**Approach:**
- At the top of `complete()`, read `process.env.AI_PROVIDER` at call-time.
  - If `=== 'openrouter'` **and** `isOpenRouterConfigured()` → call `openRouterComplete(options)` directly and return; if the switch is set but no key, log a warning and fall through to Anthropic.
  - Otherwise run the existing Anthropic path inside `try`.
- On Anthropic failure, classify via a small `isFallbackWorthy(error)` helper (status ∈ {402, 429} or ≥ 500, or the missing-key `Error` thrown by `getAnthropicClient()`). If fallback-worthy **and** `isOpenRouterConfigured()` → call `openRouterComplete(options)` and return its text; log that a fallback occurred. Otherwise re-throw the original error.
- If OpenRouter also fails during fallback, throw the `OpenRouterError` (log both the Anthropic and OpenRouter failures).
- Leave `app/api/chat/guest/artifact/route.ts` unchanged — its existing 402/429/5xx handling still applies when *both* providers fail; a successful fallback makes `complete()` resolve normally, so the route just succeeds.

**Patterns to follow:** the route's existing status-based branching (`status === 402` etc.) is the canonical fallback-worthy set — keep U2's classifier consistent with it.

**Execution note:** add the fallback-on-402 test first (red), then implement — it is the exact failure that motivated this work.

**Test scenarios** (extend `claude-client.test.ts`; mock the Anthropic SDK as the existing file does, and mock `@/lib/ai/openrouter-client`):
- Primary success: Anthropic returns text → `openRouterComplete` is **not** called.
- Fallback on 402: Anthropic `messages.create` throws `{ status: 402 }`, OpenRouter configured → returns OpenRouter text.
- Fallback on 429 and on 503: same behavior for each.
- Missing-key fallback: `ANTHROPIC_API_KEY` unset (getAnthropicClient throws) + OpenRouter configured → returns OpenRouter text.
- No fallback when unconfigured: Anthropic throws 402, OpenRouter not configured → original error re-thrown.
- Non-fallback-worthy error: Anthropic throws `{ status: 400 }` → re-thrown, `openRouterComplete` **not** called.
- Manual switch: `AI_PROVIDER=openrouter` + key present → `openRouterComplete` called, Anthropic `messages.create` **not** called.
- Manual switch without key: `AI_PROVIDER=openrouter`, no key → warns and uses Anthropic.
- Both fail: Anthropic 402 then OpenRouter throws → the OpenRouter error surfaces.

**Verification:** `npm run test:run` green for `claude-client.test.ts`; `npm run build` green; the guest-artifact route test (`tests/api/chat/guest-artifact.test.ts`) still passes unmodified.

---

### U3. Env contract and documentation

**Goal:** The three new env vars are documented for local dev, CI, and prod, and the streaming-path gap is recorded.

**Requirements:** Closes the external env contract (CI/prod consumers).

**Dependencies:** U1, U2.

**Files:**
- `apps/web/.env.example` (add `OPENROUTER_API_KEY`, commented `OPENROUTER_MODEL`, commented `AI_PROVIDER`)
- `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` (note OpenRouter as optional fallback in the env list; mark it not required)
- `README.md` or `docs/architecture.md` (one line: Anthropic primary, OpenRouter fallback for guest synthesis only)

**Approach:** mirror the existing `ANTHROPIC_MODEL` commented-example style in `.env.example`. State explicitly that `OPENROUTER_API_KEY` is server-only (never `NEXT_PUBLIC_`) and optional — absence simply disables fallback. Note that the streaming chat paths are **not** covered.

**Test expectation: none — documentation and env-template only.**

**Verification:** `.env.example` parses; required-env lists in AGENTS.md/CLAUDE.md still accurate (OpenRouter listed as optional, not required); Vercel already holds `OPENROUTER_API_KEY` for prod + preview (added by Kevin), so no infra step remains.

---

## Risks & Dependencies

- **Model-id drift.** An invalid `OPENROUTER_MODEL` yields a 404 from OpenRouter during a fallback — i.e. it fails exactly when it's needed. Mitigation: default to the known-good `anthropic/claude-sonnet-4`, keep it env-overridable, surface the status in `OpenRouterError`.
- **Silent quality divergence.** OpenRouter's Claude routing may differ subtly from direct Anthropic. Acceptable for a fallback; the primary path is unchanged.
- **Coverage gap (named, not hidden).** Live Mary chat (tool/streaming) has no fallback. A future Anthropic credit lapse still breaks logged-in chat. Tracked in Deferred.
- **Secret hygiene.** `OPENROUTER_API_KEY` must stay server-only. Verify it is never referenced under a `NEXT_PUBLIC_` name.

---

## Verification Strategy

1. `npm run test:run` — U1 + U2 suites green; existing guest-artifact + share tests still pass.
2. `npm run build` — green.
3. Manual OpenRouter-path proof (local): set `AI_PROVIDER=openrouter` + `OPENROUTER_API_KEY`, POST a transcript to `/api/chat/guest/artifact` → expect 200 with a synthesized record (proves the OpenRouter transport end-to-end). Unset `AI_PROVIDER` → Anthropic path resumes.
4. Fallback proof (local): with `AI_PROVIDER` unset and a deliberately invalid `ANTHROPIC_API_KEY` but valid `OPENROUTER_API_KEY`, the same POST still returns 200 via fallback.
5. Prod smoke after deploy: the Anthropic primary path already verified 200 on June 4 (synthesis → share → public read); re-run that once after merge.

---

## Sources & Research

- `apps/web/lib/ai/claude-client.ts` — current `complete()` (single-shot, 60s timeout), `getAnthropicClient()` lazy init, streaming + tool paths (out of scope).
- `apps/web/app/api/chat/guest/artifact/route.ts` — consumer of `complete()`; existing 402/429/5xx status handling sets the fallback-worthy set.
- `apps/web/tests/api/chat/guest-artifact.test.ts` (Vitest) and `apps/web/tests/lib/ai/claude-client.test.ts` (SDK-mock pattern) — test patterns to mirror.
- `apps/web/package.json` — only `@anthropic-ai/sdk@^0.80.0`; `"test": "vitest"` is the active runner.
- `apps/web/.env.example` — current `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` convention to extend.
