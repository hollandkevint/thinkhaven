---
title: "Reviewer agreement is not independence: verify checkable claims before promoting a finding"
date: 2026-06-11
category: workflow-issues
module: code-review
problem_type: workflow_issue
component: development_workflow
severity: medium
applies_when:
  - "Running a multi-agent review with 2+ same-model-tier reviewers"
  - "The synthesis promotes a finding's confidence when reviewers agree on it"
  - "A finding hinges on a mechanically-checkable fact (resolved type, declared type, pinned dependency version, dangling reference)"
  - "A higher-capability reviewer dissents from a lower-tier majority"
tags:
  - code-review
  - multi-agent
  - false-positive
  - reviewer-independence
  - confidence-promotion
  - typescript
  - keyof
  - verification
---

# Reviewer agreement is not independence: verify checkable claims before promoting a finding

## Context

A `/ce-code-review` run used 10 reviewer personas — correctness, security, and adversarial on the session's Opus model, the other seven on Sonnet. The synthesis step applies a **cross-reviewer agreement promotion**: when two or more reviewers return the same finding fingerprint, its confidence is bumped one anchor.

Three Sonnet-tier reviewers (reliability, api-contract, maintainability) plus project-standards independently flagged the *same* finding as a diff-introduced regression. The agreement made it the highest-confidence output of the whole review — the headline recommendation. It was wrong. It was caught only because the orchestrator verified the underlying claim directly against the source before acting on it.

## Guidance

**Agreement is corroboration only when the reviewers are independent.** Same-model-tier reviewers share a training distribution, reasoning patterns, and blind spots. Four Sonnet reviewers converging on a finding is not four independent opinions — it's closer to one opinion with four votes. The agreement-promotion rule assumes statistical independence; when that assumption breaks, the promotion amplifies a shared error instead of validating a real signal. A lone higher-capability reviewer who dissents — or who files the same concern as a *residual risk* rather than a *regression* — carries more independent signal than the agreeing majority. Weight that dissent heavily.

**Verify any agreement-promoted finding that rests on a mechanically-checkable fact, directly, before accepting it.** Checkable facts include: a type's resolved value, a variable's declared type, a pinned dependency version, whether a deleted symbol is still referenced, whether a test still covers a removed constant. These are seconds of work — one `Read`, `Grep`, or `node -e`. If a finding's validity depends on a claim about the code, check the claim before the finding is accepted, and especially before any agreement-based promotion is applied.

**Know the `keyof typeof Record` gotcha** — it's what fooled the reviewers here. `keyof typeof X` narrows to a finite key union *only* when `X` has literal keys: an object literal with inferred keys, or a value typed `as const`. When `X` is typed `Record<string, T>`, `keyof typeof X` is just `string`. A parameter typed `keyof typeof someRecord` provides no key narrowing — it is `string` under another name, and "widening" it to `string` removes nothing.

## Why This Matters

An agreement-promoted false positive is the most dangerous output a multi-agent review can produce. It arrives with the highest displayed confidence, the most surface-area justification (several reviewers, several framings), and is therefore the finding most likely to be acted on without question. Applying the "fix" here — re-narrowing the parameter type — would have produced a churn commit that changed nothing at runtime while creating the false impression that a real safety gap had closed.

The asymmetry is the whole point: verification cost one `Read` of the rate-limiter file and one `Grep` for callers. Acting on a high-confidence false positive costs a code change, a review thread, a misleading summary entry, and a quiet erosion of trust in the review process.

## When to Apply

- Any multi-agent review or analysis pipeline with an agreement, voting, or confidence-promotion mechanic — regardless of domain.
- A finding being promoted to headline / P0 / P1 status whose validity rests on a claim checkable in under a minute.
- A mixed-model-tier reviewer pool where a lower-tier majority disagrees with a higher-tier minority.
- A finding claiming a diff "introduced" or "removed" a property — these are especially prone to false positives because they require reasoning about the code *before and after* the change.

## Examples

**The `withRateLimit` widening — false positive, cleared by one `Read`.**

Before:

```ts
withRateLimit(handler, type: keyof typeof RateLimiter['configs'] = 'default')
```

After:

```ts
withRateLimit(handler, type: string = 'default')
```

Three reviewers concluded: the change drops compile-time key enforcement, so a caller passing an unknown string reaches `getConfig(type).maxRequests` and throws — a diff-introduced regression.

The check that defused it:

```ts
private static readonly configs: Record<string, RateLimitConfig> = { /* ... */ };
```

Because `configs` is a `Record<string, T>`, `keyof typeof RateLimiter.configs` is already `string`. The old parameter type was `string`. The widening is a semantic no-op; the unknown-key runtime hazard is pre-existing, unchanged by the diff, and unreachable (zero callers). The Opus-tier correctness reviewer filed it correctly as a residual risk, not a regression — the one independent read.

**Three sibling false positives in the same review, also cleared only by direct verification:**

- A maintainability reviewer claimed a deleted `EXPLICIT_MARKERS` regex constant silently broke explicit-diagram detection. Cleared: the explicit-detection unit tests were green — the constant was genuinely dead, the path refactored.
- A reliability reviewer marked a `hasCredits` null-client path as a P1 fail-open. Cleared by reading *all* credit-flag states: with the credit system disabled, returning `true` is intended; enabled with a null client, the path is fail-closed. The reviewer had modeled only the enabled+null branch in isolation.
- An api-contract reviewer marked a Stripe `apiVersion` bump to `2025-09-30.clover` as a P1 contract risk. Cleared by checking the installed SDK: `stripe@19.1.0` (hoisted to the monorepo root) pins exactly that version string — the literal change was a *correction* to match the SDK, not a forward reference to an unsupported version.

## Related

- [Code Review Fixes: Security, Correctness, and Performance Hardening](../security-issues/multi-agent-review-security-correctness-hardening.md) — the counterpart case where multi-agent review surfaced *real* bugs. Read together, the two docs frame the calibration: same-tier agreement on a real bug versus same-tier agreement on a false positive look identical until you verify.
- Global CLAUDE.md CE rule 22 ("a sub-agent's or workflow reviewer's number 'correction' is a hypothesis — diff it against the source before accepting") and rule 21 (verify a platform capability against the repo or live app before asserting it's missing). This learning is the same epistemics applied to multi-agent code review: agreement is not independence.
