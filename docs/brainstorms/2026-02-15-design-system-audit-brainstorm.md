# Design System Audit & Hardening

**Date**: 2026-02-15
**Status**: Ready for planning

## What We're Building

A full design system audit that eliminates every "GenAI-built" visual signal from ThinkHaven's UI, plus a conventions doc that prevents future drift. The app should feel like it was designed by a human with taste, not assembled by AI prompts.

## Why This Matters

Beta testers (Wave 1) will form first impressions in seconds. Right now, the tester flow (Signup → Session → Dashboard) has:
- Blue gradients and hardcoded RGBA colors that contradict the Wes Anderson palette
- Mary's avatar rendered as blue/gray instead of terracotta on the session page
- Three coexisting styling approaches (Tailwind tokens, inline CSS vars, raw blue classes)
- Cookie-cutter layouts that signal AI generation

The design system is well-defined (terracotta, cream, forest, ink, parchment) but inconsistently applied. ~6 pages still use the default blue/indigo Cursor gradient.

## Key Decisions

1. **Scope: Every page gets themed** — Not just tester-facing pages. Assessment, waitlist, validation, monitoring all get branded.
2. **Delete demo pages** — `/demo`, `/demo/[scenario]`, and `demoData.ts` removed entirely. Let testers try the real thing.
3. **Documented conventions, not lint rules** — A design tokens reference doc. Lightweight, relies on discipline. ESLint rules deferred.
4. **Priority order follows tester flow**: Session page → Signup/Login → Dashboard components → Waitlist → New session → Assessment → Others.
5. **Mary avatar = terracotta everywhere** — No more blue/gray inconsistency.
6. **One styling approach**: Tailwind design tokens (`bg-cream`, `text-ink`, `bg-terracotta`) preferred. Inline `style={{}}` with CSS vars acceptable for dynamic values. Raw blue/gray classes eliminated.

## Pages to Retheme

| Page | Current State | Priority |
|------|--------------|----------|
| Session page (`/app/session/[id]`) | Welcome card all blue, Mary avatar blue/gray, user bubbles use hardcoded blue RGBA | 1 - Most time spent here |
| Chat components (ChatInterface, StreamingMessage, TypingIndicator) | Blue/purple gradient avatars | 2 - Part of session experience |
| Signup page | White bg, CSS vars, `gray-200`/`gray-400` defaults | 3 |
| Login page | Same as signup | 3 |
| Dashboard page | Mostly themed, verify components | 4 |
| Waitlist page | Blue gradient | 5 |
| WaitlistForm component | Blue button on landing hero | 6 |
| New session page (`/app/new`) | Blue gradient bg | 7 |
| Assessment pages | Blue gradients throughout | 8 |
| Validation success page | Blue gradient | 9 |
| Monitoring page | Gray defaults | 10 |
| BMad components | Blue/purple throughout | 11 |

## What We're NOT Doing

- Board of Directors Phases 5-6 (Taylor opt-in, polish)
- Onboarding flow / product tour
- Mobile hamburger menu
- Sentry / error monitoring
- Analytics
- ESLint enforcement rules (deferred)

## Research Findings

### GenAI Signals Found (12 categories)

1. `from-blue-50 to-indigo-100` gradient on 6+ pages
2. Session welcome card entirely blue (lines 690-763)
3. Mary avatar inconsistent: blue-500, #6b6b6b, terracotta (varies by component)
4. User messages use `rgba(0, 121, 255, 0.1)` instead of design tokens
5. WaitlistForm CTA: `bg-blue-600` inside terracotta hero
6. Blue/purple gradient avatars in chat, streaming, typing indicator
7. BMad components entirely unthemed (10+ blue/purple instances)
8. 15+ `gray-*` references instead of warm equivalents
9. Three coexisting styling approaches
10. Copyright says 2025
11. Placeholder legal links
12. Cookie-cutter three-column card layouts

### Design System Reference

**Colors**: cream `#FAF7F2`, parchment `#F5F0E6`, terracotta `#C4785C`, forest `#4A6741`, ink `#2C2416`, dusty-rose `#C9A9A6`, mustard `#D4A84B`, slate-blue `#6B7B8C`

**Typography**: Jost (display), Libre Baskerville (body), JetBrains Mono (code)

**Board colors**: mary=terracotta, victoria=mustard, casey=forest, elaine=slate-blue, omar=ink, taylor=dusty-rose

## Next Steps

Run `/workflows:plan` to create the execution plan.
