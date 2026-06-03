---
title: Product Journey Audit
status: active
date: 2026-05-22
---

# Product Journey Audit

## Executive Summary

ThinkHaven's strongest surfaces are the landing page and guest trial. They clearly reject sycophancy, name the board-of-advisors model, and increasingly follow the product sequence: artifact, decision, confidence.

The weakest surfaces are the operational edges: protected app access in local evidence, Markdown-rendered content, mobile guest layout, and legacy UI details that still violate Impeccable rules. These failures matter because the product promise is rigor. Runtime errors, horizontal overflow, and generic accent-border patterns weaken the trust the interface is trying to build.

Design health estimate: 27/40 for public conversion routes, 18/40 for whole-site launch readiness because protected routes and Markdown rendering are blocked in the live pass.

## Scored Journey

| Stage | Representative Routes | Artifact | Decision | Confidence | Notes |
|---|---|---:|---:|---:|---|
| Landing | `/` | 3/4 | 3/4 | 3/4 | Strong promise and sequence, but duplicated beta signal and repeated CTAs add noise |
| Trial | `/try`, `/try?mode=plan-grill` | 3/4 | 3/4 | 2/4 | Strong Mary framing, mobile overflow breaks confidence |
| Pricing | `/pricing` | 2/4 | 2/4 | 2/4 | Clear plans, but "5 sessions" and pricing framing feel disconnected from trial and current product language |
| Waitlist | `/waitlist` | 1/4 | 2/4 | 2/4 | Useful recovery copy, but local evidence only saw unavailable state |
| Assessment | `/assessment`, `/assessment/results` | 1/4 | 2/4 | 2/4 | Quiz is functional, but results route depends on state and stalls when accessed directly |
| Blog | `/blog`, `/blog/[slug]` | 2/4 | 2/4 | 2/4 | Content IA works, visual treatment has side-tab accent violations |
| Auth | `/login`, `/signup`, `/resend-confirmation` | 1/4 | 2/4 | 3/4 | Simple and focused, but sparse copy does not reinforce the product promise |
| App shell | `/app`, `/app/new`, `/app/session/[id]`, `/app/account` | blocked | blocked | blocked | Local pass blocked by auth unavailable state and blank protected shells |
| Ops/admin | `/admin/beta`, `/monitoring` | blocked | blocked | blocked | Protected evidence unavailable locally |
| Legacy redirects | `/dashboard`, `/workspace/[id]`, `/account` | 1/4 | 1/4 | 2/4 | Redirecting state appears, but should be covered by focused smoke assertions |

## Browser Evidence Notes

Desktop public route findings:

- `/` renders the main promise, "Six advisors that challenge your thinking, not validate it.", and the artifact, decision, confidence section.
- `/try` renders Mary, guest mode, 10/10 message counter, and the prompt "What are you trying to decide?"
- `/try?mode=plan-grill` renders the plan-grill welcome and asks "What plan should we grill?"
- `/pricing` renders "Simple pricing for clear thinking", but includes "Free, 5 sessions included", which is inconsistent with the 10-message trial framing.
- `/waitlist` local evidence rendered "We could not check beta access", which is a reasonable recovery surface but not the normal waitlist state.
- `/assessment/results` stayed at "Loading your results..." when accessed directly.
- `/app` rendered the branded error page with "Something went wrong" and console errors for authentication service unavailable.

Mobile evidence:

- Landing has no horizontal overflow at 390px and keeps the primary CTAs visible.
- `/try` has horizontal overflow at 390px. The overflowing elements are the header nav (`Send Feedback`, `Take Assessment`, `Sign in`, `Sign up`) and the guest session header controls (`10/10 messages`, `Sign up`).
- Login, signup, and assessment do not show horizontal overflow in the sampled mobile pass.

Console evidence:

- `ReactMarkdown` throws `Assertion: Unexpected className prop, remove it`, handled by the app error boundary.
- Protected app routes throw `Authentication service unavailable` from `AppLayout`.

## Automated Detector Findings

The Impeccable detector returned warnings in three clusters:

1. Side-tab or thick accent borders:
   - `apps/web/app/blog/[slug]/page.tsx:123`
   - `apps/web/app/blog/page.tsx:76`
   - `apps/web/app/components/chat/BookmarksPanel.tsx:291`
   - `apps/web/app/components/chat/MarkdownRenderer.tsx:142`
   - `apps/web/app/components/canvas/LeanCanvas.tsx:32`
2. Pure black or black-tinted UI:
   - `apps/web/app/components/artifact/ArtifactPanel.tsx:89`
   - `apps/web/app/components/chat/BranchDialog.tsx:117`
   - `apps/web/app/components/chat/ExportDialog.tsx:187`
   - `apps/web/app/components/feedback/FeedbackButton.tsx:20`
   - `apps/web/app/components/feedback/FeedbackModal.tsx:83`
3. Thick spinner borders detected as accent borders:
   - Several `border-b-2` loading spinners. These are lower priority and may be acceptable if replaced during broader loading-state polish.

## Priority Issues

### P0: Local dev and protected app evidence are blocked

`npm run dev` fails because `next dev --turbopack` rejects the MDX rule config. Protected routes also throw `Authentication service unavailable` locally. Together, these block reliable browser verification of the core authenticated product.

Fix: update dev server configuration and make protected-route unavailable state explicit, testable, and route-appropriate.

Suggested command: `$impeccable harden`.

### P0: Markdown rendering can crash the app

The browser console shows `ReactMarkdown` rejecting a `className` prop, then the ThinkHaven error boundary renders. This can break any route or message surface that renders Markdown.

Fix: update `MarkdownRenderer` to apply wrapper classes outside `ReactMarkdown`, remove invalid props, and add a focused component regression.

Suggested command: `$impeccable harden`.

### P1: Guest trial overflows on mobile

The guest trial is the key evaluation surface. At 390px, the nav and session header controls overflow horizontally.

Fix: collapse secondary nav actions behind a menu on mobile, compress or stack the guest mode/message controls, and keep the input visible.

Suggested command: `$impeccable adapt`.

### P1: Anti-pattern residue undercuts the design system

Pure black overlays and side-tab borders remain in dialogs, blog, Markdown, bookmarks, canvas, feedback, and artifact surfaces.

Fix: replace black overlays with `bg-ink/50` or `bg-ink/30`, remove backdrop blur where decorative, and replace side-tabs with full borders, background tints, or typographic hierarchy.

Suggested command: `$impeccable polish`.

### P2: Pricing and assessment are not fully integrated into the product story

Pricing uses a sessions frame and outdated "5 sessions" promise, while assessment feels like a separate quiz funnel rather than a decision architecture entry point.

Fix: align pricing and assessment copy with artifact, decision, confidence. Make the next action after assessment explicit and defensible.

Suggested command: `$impeccable clarify`.

## What Is Working

- Landing and trial copy now largely speak in ThinkHaven's real voice: direct, skeptical, artifact-oriented.
- The trial mode distinction between general pressure test and plan grill is clear.
- The branded error page is better than a raw Next error and gives recovery actions.
- Radix has already replaced the guest signup modal overlay pattern.
- The product visual system is coherent on public routes: cream, parchment, terracotta, ink, Jost, and Libre Baskerville are visible.

## Persona Red Flags

### Executive product leader

The first impression is strong, but a mobile overflow or runtime error breaks the implied rigor. This user is evaluating whether ThinkHaven can be trusted before a high-stakes decision. The current guest trial overflow and Markdown crash say the product is not fully disciplined.

### First-time founder

The trial is approachable, but assessment and pricing do not clearly connect back to what they should do next. They may understand the quiz result or pricing card but not how it leads to a defensible artifact.

### Returning operator

Protected app routes were not locally verifiable. If this user hits auth unavailable or a blank protected shell, the recovery path is too generic for an operational tool.
