---
title: Launch Readiness
status: active
date: 2026-05-22
---

# Launch Readiness

## Current Go/No-Go

Recommendation: No-Go for a launch-quality whole-site release.

Reason: the public journey is close enough for product review, but dev startup, protected app verification, Markdown rendering, and mobile trial layout have blocking or major issues.

## Verification Commands

Run from `apps/web/` unless noted.

| Check | Current Result | Notes |
|---|---|---|
| `npm run dev` | Fail | Turbopack MDX rule config rejected, then server exits |
| `npx next dev -p 3002` | Pass | Used for browser evidence without Turbopack |
| `npm run build` | Pass | Completed successfully with warnings about stale browser data and missing `STRIPE_WEBHOOK_SECRET` |
| `npm run lint` | Fail | 107 errors and 68 warnings, mostly pre-existing `any`, unescaped entities, unused vars, and hook dependency warnings |
| `npx impeccable --json --fast apps/web/app apps/web/app/components` from repo root | Warnings | Found side-tab borders, pure black overlays, spinner border warnings |
| Browser public route pass | Partial pass | Landing, trial, auth, pricing, assessment, blog render; some routes stall or show unavailable states |
| Browser protected route pass | Blocked | Auth service unavailable or blank protected shell in local evidence |
| Mobile route pass | Partial pass | `/try` overflows horizontally at 390px |

## Required Before Go

- [ ] `npm run dev` starts without Turbopack config failure.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Focused public smoke tests pass.
- [ ] Protected app routes can be inspected in a valid authenticated or mocked beta-approved state.
- [ ] `/try` and `/try?mode=plan-grill` have no horizontal overflow at 390px, 768px, and desktop.
- [ ] Markdown renderer no longer trips the app error boundary.
- [ ] Impeccable detector no longer reports pure black overlays or side-tab accent borders for touched surfaces.
- [ ] `/assessment/results` handles direct access with a recovery path.
- [ ] Legacy redirects are covered by tests or browser evidence.

## Browser Route Checklist

### Public

- [ ] `/`: landing renders without duplicate beta visual noise, no modal overlay, no horizontal overflow.
- [ ] `/try`: Mary guest trial renders, no horizontal overflow, 10-message promise visible.
- [ ] `/try?mode=plan-grill`: plan-grill welcome and placeholder render.
- [ ] `/pricing`: pricing terms align with product and trial copy.
- [ ] `/waitlist`: approved, pending, unavailable, and migrated states are understandable.
- [ ] `/assessment`: quiz is keyboard and touch usable.
- [ ] `/assessment/results`: direct access recovers cleanly.
- [ ] `/blog`: list cards avoid side-tab and decorative-corner anti-patterns.
- [ ] `/blog/[slug]`: Markdown content renders without runtime errors.
- [ ] `/login`, `/signup`, `/resend-confirmation`: forms render and focus states are visible.
- [ ] `/validate/success`: direct access and loading state do not trap the user.

### Protected

- [ ] `/app`: dashboard renders for beta-approved user.
- [ ] `/app/new`: session creation loading, success, no-credit, and failure paths render.
- [ ] `/app/session/[id]`: active session, empty session, board panel, artifact panel, export, feedback, and error paths render.
- [ ] `/app/account`: account settings render and recover from data errors.

### Ops And Legacy

- [ ] `/admin/beta`: admin-only state, non-admin denial, and unavailable state render.
- [ ] `/monitoring`: auth metrics dashboard renders without detector anti-patterns.
- [ ] `/dashboard` redirects to `/app`.
- [ ] `/workspace/[id]` redirects to `/app/session/[id]`.
- [ ] `/account` redirects to `/app/account`.

## Automated Test Checklist

- [ ] Public route smoke tests cover canonical visible copy.
- [ ] Trial smoke tests assert 10 free messages in regular and plan-grill modes.
- [ ] Mobile overflow test asserts `document.documentElement.scrollWidth <= clientWidth` on `/try`.
- [ ] Markdown component test renders representative Markdown without throw.
- [ ] Auth unavailable test proves protected routes do not crash generically.
- [ ] Detector command output reviewed and archived in PR notes.

## Known Gaps From This Handoff

- No authenticated browser evidence was captured because local protected routes could not pass the auth service check.
- No screenshots were committed. Evidence is captured as route summaries and detector findings in this package.
- No production URL was audited in this pass.
- No visual regression system exists for the routes reviewed.
- Spinner border detector warnings may be false positives, but should be revisited when loading states are touched.

## Go Criteria

Go only when:

1. The standard dev and production build paths pass.
2. Public and protected primary routes are browser-verified.
3. No P0 or P1 items from [03-build-handoff.md](./03-build-handoff.md) remain.
4. The product journey still follows artifact, decision, confidence.
5. The final PR includes evidence from lint, build, detector, and browser smoke checks.
