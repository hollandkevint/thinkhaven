---
title: Start Here
status: active
date: 2026-05-22
---

# Start Here

## Where We Are

Current phase: whole-site design handoff complete, implementation not started.

Overall status: evidence gathered and prioritized. Public routes can be inspected through `npx next dev -p 3002`; the normal `npm run dev` path fails because the Turbopack MDX rule in `next.config.ts` is invalid.

Important preflight already satisfied:

```text
IMPECCABLE_PREFLIGHT: context=pass product=pass command_reference=pass shape=not_required image_gate=skipped:no net-new UI direction; use live browser screenshots and audit evidence mutation=open
```

## Evidence Gathered

- Impeccable context loaded from `PRODUCT.md` and `DESIGN.md`.
- Product register reference loaded and applied.
- Runtime tokens reviewed in `apps/web/app/globals.css` and `apps/web/tailwind.config.cjs`.
- Local app started successfully with `npx next dev -p 3002`.
- `npm run dev` failed because `next dev --turbopack` rejects `turbopack.rules.{*,next-mdx-rule}`.
- `npx impeccable --json --fast apps/web/app apps/web/app/components` ran successfully after network approval.
- Browser pass covered public routes, selected legacy redirects, auth routes, app routes where possible, and mobile/tablet breakpoints.
- `npm run build` passed after the docs were created.
- `npm run lint` failed on pre-existing ESLint debt: 107 errors and 68 warnings.

## Route Coverage

| Surface | Routes Checked | Evidence Status |
|---|---|---|
| Public landing and conversion | `/`, `/try`, `/try?mode=plan-grill`, `/pricing`, `/waitlist` | Browser checked, public render mostly available |
| Assessment | `/assessment`, `/assessment/results` | Browser checked, results route stalls at loading without prior state |
| Content | `/blog`, blog cards | Browser and detector checked |
| Auth | `/login`, `/signup`, `/resend-confirmation`, `/validate/success` | Browser checked |
| Protected app | `/app`, `/app/new`, `/app/session/test-session-id`, `/app/account` | Blocked by auth service unavailable or blank protected shell |
| Ops/admin | `/admin/beta`, `/monitoring` | Redirected or blank due protected access context |
| Legacy redirects | `/dashboard`, `/workspace/test-session-id`, `/account` | Browser saw redirecting state |

## Current Blockers

1. `npm run dev` cannot start because Turbopack rejects the MDX rule shape.
2. Protected `/app/*` local browser evidence is blocked by `Authentication service unavailable` from `apps/web/app/app/layout.tsx`.
3. `ReactMarkdown` throws `Unexpected className prop` and triggers the ThinkHaven error boundary.
4. `/try` overflows horizontally on a 390px mobile viewport because the header and guest session controls do not collapse.
5. Impeccable detector found repeated pure black overlays and side-tab accent borders.

## Next Actions

1. Start with [03-build-handoff.md](./03-build-handoff.md), U1 through U3.
2. Keep [02-design-handoff.md](./02-design-handoff.md) open while editing UI. It contains the product-register rules and surface intent.
3. Verify each unit against [04-launch-readiness.md](./04-launch-readiness.md).
4. Do not edit unrelated untracked files: `.claude/settings.local.json` and `docs/ideation/2026-05-22-research-grounded-ideation-inputs.md`.

## Things To Remember

The product is not a chatbot wrapper. Every surface should make the artifact more visible, the decision more explicit, and confidence more defensible.

Avoid these known project pitfalls while implementing:

- Use Radix Dialog for new or touched modals.
- Do not use `text-secondary` for text.
- Do not use client components that import server-only session primitives.
- Keep heavy libraries dynamically imported.
- Sanitize third-party HTML output.
- Use `RateLimiter.createLimitResponse()` for any touched 429 behavior.
