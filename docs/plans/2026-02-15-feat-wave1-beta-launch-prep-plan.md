---
title: Wave 1 Beta Launch Prep
type: feat
date: 2026-02-15
brainstorm: docs/brainstorms/2026-02-15-beta-launch-readiness-brainstorm.md
---

# Wave 1 Beta Launch Prep

Ship the minimum prep needed to send ThinkHaven to 3-5 trusted knowledge workers this week. The product works end-to-end — this plan covers the gaps between "works" and "ready for real humans."

## Acceptance Criteria

- [x] In-app feedback button accessible during normal session use
- [x] Feedback button visible on dashboard sidebar AND session workspace header
- [ ] Invite message drafted and approved
- [x] LAUNCH_MODE verified active in Vercel production
- [ ] Self-test checklist completed on production with fresh account
- [ ] Testers recommended to sign up directly (not guest mode)

## Phase A: Add Feedback Button (Code Change)

Add a "Send Feedback" button that's always accessible — not gated behind credit exhaustion.

### Approach: mailto link with branded styling

The simplest thing that works. A mailto link pre-fills subject line and opens the tester's email client. No new database tables, no new API endpoints, no new components beyond a small reusable button.

**Why mailto over a form:**
- Zero backend work
- Testers are friends — they'll write an email
- Kevin gets threaded email conversations, not anonymous form submissions
- Can upgrade to an in-app form in Wave 2 if needed

### Tasks

#### A1. Create FeedbackButton component

**File**: `apps/web/app/components/feedback/FeedbackButton.tsx`

New component. Small, reusable across dashboard and session pages.

```tsx
// Simplified structure — adapt to match existing component patterns
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedbackButtonProps {
  variant?: 'sidebar' | 'header'
}

export function FeedbackButton({ variant = 'sidebar' }: FeedbackButtonProps) {
  const mailto = 'mailto:kevin@kevintholland.com?subject=ThinkHaven%20Beta%20Feedback'

  if (variant === 'header') {
    return (
      <a href={mailto} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Feedback
        </Button>
      </a>
    )
  }

  // sidebar variant — matches dashboard sidebar button style
  return (
    <a href={mailto} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-cream">
      <MessageSquare className="w-4 h-4" />
      Send Feedback
    </a>
  )
}
```

**Pattern to follow**: Match the sidebar link styles in `apps/web/app/app/page.tsx` lines 268-290 (Settings, Sign Out links).

#### A2. Add FeedbackButton to Dashboard sidebar

**File**: `apps/web/app/app/page.tsx`

Insert `<FeedbackButton variant="sidebar" />` in the sidebar, between the Settings link and Sign Out button (around line 282).

#### A3. Add FeedbackButton to Session workspace header

**File**: `apps/web/app/app/session/[id]/page.tsx`

Insert `<FeedbackButton variant="header" />` in the session header bar, near the existing Account/settings controls.

#### A4. Add FeedbackButton to Guest mode header

**File**: `apps/web/app/try/page.tsx`

Insert feedback link in the guest header bar (lines 67-86), so even guest users can send feedback.

## Phase B: Verify Production Readiness (No Code)

### Tasks

#### B1. Verify LAUNCH_MODE in Vercel

Check Vercel dashboard → Settings → Environment Variables. Confirm `LAUNCH_MODE=true` is set for Production environment.

**Important**: The server-side code (`credit-manager.ts:87`, `message-limit-manager.ts:47`) checks `process.env.LAUNCH_MODE` — NOT `NEXT_PUBLIC_LAUNCH_MODE`. The docs (`SLC_LAUNCH_CHECKLIST.md`, `LAUNCH_MODE_SETUP.md`) have stale references to `NEXT_PUBLIC_LAUNCH_MODE`. Use `LAUNCH_MODE` (without prefix).

If missing: add it and trigger a redeploy.

#### B2. Self-test checklist on production

Using a fresh test account (NOT Kevin's personal email), verify each step in production:

- [ ] Sign up with email/password (new account)
- [ ] Arrive at `/app` dashboard — see empty state with "New Session" CTA
- [ ] Click "New Session" — session creates without credit errors
- [ ] Send 3 messages to Mary — streaming responses work
- [ ] Ask a question that triggers board members (e.g., "I'm deciding whether to raise a seed round or bootstrap. Can you help me think through the financial implications?")
- [ ] Verify a board member (likely Victoria) joins the conversation via speaker change
- [ ] Continue chatting — confirm multiple board members can participate
- [ ] At ~15 messages, verify yellow warning appears ("5 messages remaining")
- [ ] At 20 messages, verify red limit banner appears
- [ ] Click Export button — verify markdown download works
- [ ] Open the same session on mobile browser — verify it's usable (not broken)
- [ ] Click "Send Feedback" button — verify mailto link opens email client
- [ ] Test Google OAuth signup (optional but recommended)

**If anything fails**: Fix before sending invites. Document the failure and resolution.

#### B3. Verify guest mode → signup migration (optional)

If testers might stumble onto `/try`:

- [ ] Visit `/try` in incognito
- [ ] Send 5 messages
- [ ] Click "Sign up" from guest mode
- [ ] Verify conversation history migrates to new account
- [ ] Verify session appears in `/app` dashboard

## Phase C: Write Invite Message (No Code)

### Tasks

#### C1. Draft invite message

Two versions — one for DM, one for follow-up if they say yes.

**DM (2-3 sentences):**

> I built something I want your honest take on. It's a decision accelerator — you bring a real decision you're facing (career move, product launch, pricing, hiring) and work through it with AI advisors who each bring a different lens. Takes about 15 minutes. Want to try it?

**Follow-up (after they agree):**

> Here's the link: https://thinkhaven.co — sign up with email or Google, click "New Session," and just bring whatever decision is on your mind right now. Don't hold back on feedback. If something breaks, confuses you, or feels off, screenshot it and text me. If it helps you, I want to know that too.

#### C2. Decision: tester path

**Recommendation: Direct signup** (not `/try` guest mode).

Rationale:
- 20-message limit gives enough depth for "bring a real decision"
- 10-message guest limit is too shallow for meaningful exploration
- Board members (the differentiator) require authentication
- Signup with Google OAuth is one click

Include `https://thinkhaven.co` in invite (lands on homepage with signup in nav) or `https://thinkhaven.co/signup` for direct signup.

## Dependencies & Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| LAUNCH_MODE not set in prod | Medium | Check before coding (Phase B1) |
| Board members don't trigger naturally | Medium | Include suggested prompt in follow-up message |
| Silent errors during testing | High | Ask testers to screenshot + DM; check Vercel logs daily |
| Guest mode migration breaks | Low | Recommend direct signup; test migration anyway |
| Mobile layout unusable | Medium | Test in self-test; warn "desktop recommended" if broken |

## Out of Scope (Wave 2)

These are explicitly deferred — they're worth doing but not before Wave 1 invites go out:

- Assessment page visual consistency (blue gradients → brand palette)
- WaitlistForm color fix (blue-600 → terracotta)
- Onboarding flow / tooltips / product tour
- Mobile hamburger menu
- Sentry / external error monitoring
- Analytics beyond Vercel basics
- In-app feedback form (database-backed)
- Proactive export prompt at yellow warning

## References

- Brainstorm: `docs/brainstorms/2026-02-15-beta-launch-readiness-brainstorm.md`
- Existing feedback form: `apps/web/app/components/monetization/FeedbackForm.tsx`
- Dashboard sidebar: `apps/web/app/app/page.tsx:268-290`
- Session header: `apps/web/app/app/session/[id]/page.tsx`
- Guest mode: `apps/web/app/try/page.tsx:67-86`
- Design tokens: `apps/web/app/globals.css:48-68`
- Navigation: `apps/web/app/components/ui/navigation.tsx`
