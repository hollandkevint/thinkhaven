---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, quality, typescript]
---

# Use Zod validation for feedback API, not manual validation

## Problem Statement

The existing `feedback/trial/route.ts` uses manual validation. The new feedback route should use Zod (`^4.1.5`, already installed) for a single source of truth between runtime validation and TypeScript types.

Found by: TypeScript reviewer

## Context

- Zod, react-hook-form, and @hookform/resolvers all installed
- Manual validation means maintaining the shape in two places (validation logic + type definition)
- `FeedbackSchema` provides both `safeParse()` for runtime and `z.infer<>` for types

## Acceptance Criteria

- [ ] `FeedbackSchema` defined in `lib/feedback/feedback-schema.ts`
- [ ] `FeedbackPayload` type derived via `z.infer<typeof FeedbackSchema>`
- [ ] API route uses `FeedbackSchema.safeParse(body)` instead of manual checks
- [ ] Invalid payloads return structured error response

## References

- Plan: `docs/plans/2026-03-29-feat-product-vision-v2-plan.md` (Zod schema section)
