# Beta Launch Readiness & Staged Rollout

**Date**: 2026-02-15
**Status**: Ready for execution

## What We're Building

A two-wave beta launch strategy for ThinkHaven, starting with 3-5 knowledge workers this week (Wave 1) and expanding based on pull signals in 2-3 weeks (Wave 2). The core question isn't "is the product polished enough" — it's "do people pull this into their lives after trying it?"

## Current State Assessment

### Ready Now
- **Core product works**: Chat with Mary, Board of Directors, dual-pane workspace with canvas, streaming responses, markdown rendering, Mermaid diagrams
- **Auth flow**: Google OAuth + email/password, robust with monitoring
- **Guest mode** (`/try`): 10 free messages, auto-migrates to account on signup
- **LAUNCH_MODE**: Credit system bypassed, 20-message session limits for authenticated users
- **CI/CD**: Healthy — 7 E2E smoke tests passing, auto-deploy to Vercel on main
- **Design system**: Professional Wes Anderson-inspired theme (Jost/Libre Baskerville fonts, terracotta/cream/forest palette, shadcn/ui components)
- **Error handling**: Mature — ErrorState with retry logic, loading skeletons, offline indicator

### Known Rough Edges (Acceptable for Wave 1)
- Assessment page uses blue gradients instead of Wes Anderson palette
- WaitlistForm uses default blue-600 instead of terracotta
- No onboarding flow — just welcome card with prompt suggestions
- Mobile layouts responsive but untested with real users
- No hamburger menu for mobile navigation
- 45/71 unit test files fail (pre-existing tech debt, not regressions)
- No Sentry/external error monitoring — custom logging only
- No analytics beyond Vercel basics

## Strategy: Two Waves

### Wave 1: Test for Pull (This Week)

**Testers**: 3-5 knowledge workers (product managers, designers, enterprise sales, entrepreneurs, product marketers) — people Kevin knows and trusts.

**The Ask**: "I built a decision accelerator. Bring a real decision you're facing — career move, product launch, hiring, pricing — and spend 15 minutes with it. Then explore freely."

**What We're Measuring**:
1. **AI quality**: Does Mary's guidance help? Do board members add value? Is output actionable?
2. **Usability**: Can they navigate without hand-holding?
3. **Pull signal**: Do they come back? Do they mention it to others? Would they pay?
4. **Breakage**: What errors/confusion do they hit?

**Feedback Collection**:
- Simple in-app "Send Feedback" button (email or lightweight form)
- 15-min call or async Slack/text thread with each tester
- Kevin observes natural reactions, not just stated preferences

**Prep Work Needed**:
1. Add a lightweight "Send Feedback" button/link (can be as simple as a mailto: link in the header)
2. Prepare a 2-sentence invite message for testers
3. Verify production deploy is current and stable
4. Test the full flow yourself: signup → new session → chat → board members → export

### Wave 2: Expand or Pivot (2-3 Weeks Out)

**Decision criteria from Wave 1**:
- **Strong pull** (2+ testers come back unprompted, ask to share with others) → Expand beta, add polish based on feedback
- **Moderate interest** (people like it but don't return) → Investigate friction, iterate on core experience
- **No pull** (polite feedback, no return usage) → Rethink value prop before investing in polish

**Polish priorities are determined by Wave 1 feedback**, not pre-planned. Possible areas:
- Visual consistency (assessment page, forms)
- First-time user onboarding
- Mobile experience
- Whatever testers actually struggle with

## Key Decisions

1. **Ship before polishing** — Visual inconsistencies are acceptable for Wave 1 testers who are friends/peers
2. **Test for pull, not satisfaction** — "Would you recommend this?" matters more than "Did you like the design?"
3. **Wave 2 scope TBD** — Let data drive polish priorities, not assumptions
4. **Feedback = conversation + lightweight in-app** — No heavy survey tooling, keep it human
5. **Real decisions + open exploration** — Structured enough to see quality, unstructured enough to see natural behavior

## Open Questions

- Should testers use `/try` (guest mode) or sign up directly? Guest mode is lower friction but limited to 10 messages.
- Do we need a dedicated feedback form or is a mailto: link sufficient for Wave 1?
- Should Kevin share the production URL or a preview/staging URL?
- What's the invite message? Short context matters for framing expectations.

## Implementation Approach

### For Wave 1 (minimal prep):
1. **Add feedback mechanism** — Simple "Send Feedback" button in app header or session page
2. **Write invite message** — 2-3 sentences explaining what it is and what you want them to try
3. **Self-test the flow** — Go through signup → session → board → export as a new user would
4. **Send invites** — Direct message to 3-5 people with the link and the ask

### For Wave 2 (based on Wave 1 data):
- Revisit this doc with learnings
- Prioritize polish based on actual friction points
- Decide scope of wider beta

## Next Steps

Run `/workflows:plan` to create an execution plan for Wave 1 prep work (feedback button, invite message, self-test checklist).
