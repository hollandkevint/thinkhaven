---
title: Build Handoff
status: active
date: 2026-05-22
---

# Build Handoff

## Backlog Summary

| Unit | Priority | Command Lens | Status |
|---|---|---|---|
| U1 | P0 | harden | Fix local dev startup and protected-route evidence blocker |
| U2 | P0 | harden | Fix Markdown runtime crash |
| U3 | P1 | adapt | Fix mobile guest trial overflow |
| U4 | P1 | polish | Remove Impeccable anti-pattern residue |
| U5 | P2 | clarify | Align pricing, assessment, and waitlist copy with product sequence |
| U6 | P2 | audit | Add route and component regression coverage |

## U1: Fix Local Dev Startup And Protected Route Recovery

Goal: make the standard dev path and protected app routes verifiable.

Files likely involved:

- `apps/web/next.config.ts`
- `apps/web/app/app/layout.tsx`
- `apps/web/lib/auth/beta-access.ts`
- `apps/web/tests/integration/middleware-public-routes.test.ts`
- `apps/web/tests/integration/auth-redirect-flow.test.tsx`

Acceptance criteria:

1. `npm run dev` starts without the Turbopack MDX rule failure.
2. If auth service status is unavailable, protected app routes render a branded, route-appropriate recovery state or redirect policy, not a generic runtime error.
3. Public routes still render when auth or Supabase status endpoints are unavailable.
4. Existing beta access gates remain intact for authenticated protected routes.
5. Browser evidence can be collected for `/app`, `/app/new`, `/app/session/[id]`, and `/app/account` with an authenticated or mocked state.

Risks:

- Weakening beta access enforcement while trying to make local evidence easier.
- Changing MDX handling in a way that breaks blog rendering or build output.

Tests:

- Add or update middleware/auth integration tests for unavailable auth status.
- Run `npm run dev`, `npm run build`, and focused protected-route smoke coverage.

## U2: Fix Markdown Runtime Crash

Goal: prevent `ReactMarkdown` from crashing route or session surfaces.

Files likely involved:

- `apps/web/app/components/chat/MarkdownRenderer.tsx`
- `apps/web/app/blog/[slug]/page.tsx`
- `apps/web/tests/components/chat/ArtifactAwareContent.test.tsx`
- `apps/web/tests/components/chat/StreamingMessage.test.tsx`

Acceptance criteria:

1. Browser console no longer logs `Unexpected className prop` from `ReactMarkdown`.
2. Markdown content renders headings, lists, code, links, blockquotes, tables, and images without triggering the app error boundary.
3. Mermaid remains dynamically rendered and sanitized through the existing Mermaid path.
4. Markdown styles use ThinkHaven tokens and remove side-tab blockquote styling.

Risks:

- Accidentally removing code block copy behavior.
- Reintroducing unsafe HTML rendering.

Tests:

- Add a component test that renders representative Markdown and asserts no throw.
- Run focused chat/artifact Markdown tests plus `npm run test:run` if feasible.

## U3: Fix Mobile Guest Trial Overflow

Goal: make `/try` and `/try?mode=plan-grill` usable at 390px without horizontal scroll.

Files likely involved:

- `apps/web/app/try/page.tsx`
- `apps/web/app/components/guest/GuestChatInterface.tsx`
- `apps/web/app/components/chat/MessageInput.tsx`
- `apps/web/tests/e2e/smoke/health.spec.ts`

Acceptance criteria:

1. At 390px width, `/try` has no horizontal overflow.
2. Header secondary actions collapse or wrap without pushing `Sign up` offscreen.
3. Guest session header keeps Mary identity, guest mode, remaining message count, and signup path visible without crowding.
4. The textarea remains reachable above the viewport bottom.
5. Plan-grill mode keeps its sharper placeholder and welcome copy.

Risks:

- Hiding conversion actions too aggressively on the key trial route.
- Breaking desktop guest layout while fixing mobile.

Tests:

- Add Playwright assertion for no horizontal overflow on `/try` at mobile width.
- Add smoke checks for both regular and plan-grill trial text.

## U4: Remove Impeccable Anti-Pattern Residue

Goal: remove repeated detector findings without changing product behavior.

Files likely involved:

- `apps/web/app/components/artifact/ArtifactPanel.tsx`
- `apps/web/app/components/chat/BranchDialog.tsx`
- `apps/web/app/components/chat/ExportDialog.tsx`
- `apps/web/app/components/feedback/FeedbackButton.tsx`
- `apps/web/app/components/feedback/FeedbackModal.tsx`
- `apps/web/app/blog/page.tsx`
- `apps/web/app/blog/[slug]/page.tsx`
- `apps/web/app/components/chat/BookmarksPanel.tsx`
- `apps/web/app/components/canvas/LeanCanvas.tsx`

Acceptance criteria:

1. `npx impeccable --json --fast apps/web/app apps/web/app/components` no longer reports pure black overlays or side-tab accent borders for touched surfaces.
2. Touched overlays use `bg-ink/50`, `bg-ink/30`, or an approved tokenized equivalent.
3. Touched blockquotes, selected canvas states, and blog cards do not use thick one-sided accent borders.
4. Dialogs preserve focus, Escape behavior, labels, and close affordances.

Risks:

- Detector false positives on spinner borders. Treat spinner findings as lower priority unless touching the component.
- Visual drift if fixes are made locally instead of using shared tokens.

Tests:

- Rerun the Impeccable detector.
- Run component tests for touched dialogs where they exist.

## U5: Align Pricing, Assessment, And Waitlist Copy

Goal: bring secondary public funnels into the same decision architecture language as landing and trial.

Files likely involved:

- `apps/web/app/pricing/page.tsx`
- `apps/web/app/assessment/page.tsx`
- `apps/web/app/assessment/results/page.tsx`
- `apps/web/app/waitlist/page.tsx`
- `apps/web/tests/e2e/smoke/health.spec.ts`

Acceptance criteria:

1. Pricing no longer conflicts with the 10-message trial promise.
2. Pricing copy explains what the user gets as defensible decision work, not generic sessions.
3. Assessment result access without prior quiz state has a clear recovery or restart path.
4. Assessment completion routes users toward an appropriate ThinkHaven session or artifact.
5. Waitlist unavailable copy gives a next action and does not trap the user.

Risks:

- Changing commercial terms accidentally. Confirm pricing/session quantities before implementation if product ownership has changed.
- Overwriting existing beta access operations copy with marketing language.

Tests:

- Update public-route smoke tests for canonical trial and pricing copy.
- Add direct `/assessment/results` recovery test.

## U6: Add Route And Launch Regression Coverage

Goal: make the next launch review repeatable.

Files likely involved:

- `apps/web/tests/e2e/smoke/health.spec.ts`
- `apps/web/tests/helpers/routes.ts`
- New or existing component tests near touched components

Acceptance criteria:

1. Public smoke tests cover `/`, `/try`, `/try?mode=plan-grill`, `/pricing`, `/waitlist`, `/assessment`, `/login`, `/signup`, `/resend-confirmation`, and `/blog`.
2. Legacy redirects are asserted for `/dashboard`, `/workspace/[id]`, and `/account`.
3. Mobile overflow is checked on `/try`.
4. Markdown render regression is covered.
5. Launch readiness checklist in `04-launch-readiness.md` can be completed without manual rediscovery.

Risks:

- Making E2E too broad and flaky. Keep smoke assertions focused on route render, core copy, no overlay, no horizontal overflow, and no app error heading.

Tests:

- Run focused Playwright smoke first.
- Run full `npm run test:e2e` only after the focused checks are stable.
