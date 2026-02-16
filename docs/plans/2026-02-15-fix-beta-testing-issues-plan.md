---
title: Fix Beta Testing Issues
type: fix
date: 2026-02-15
brainstorm: N/A (bugs found during self-test)
---

# Fix Beta Testing Issues

Five issues discovered during Wave 1 self-testing on production. All are blocking or degrading the beta tester experience.

## Acceptance Criteria

- [x] Guest mode (`/try`) chat messages are readable (dark text on light background)
- [x] Demo pages (`/demo/0`, `/demo/1`, `/demo/2`) load without client-side errors
- [x] Demo scenario page uses Wes Anderson theme (not blue gradient)
- [x] "View Strategic Session" button text stays readable on hover (verified: intentional design)
- [ ] Kevin's test account (`hollandkevint`) has `beta_approved` set in Supabase, bypasses waitlist

## Issue 1: Guest Chat Text Nearly Invisible

**Severity**: High — first thing testers see if they visit `/try`

**Root Cause**: `MarkdownRenderer.tsx:15` applies `prose-p:text-secondary` to all paragraph text. In the shadcn/Tailwind config, `text-secondary` resolves to `hsl(var(--secondary))` which is parchment (`#F5F0E6`) — a light background color, not a text color. This makes paragraph text near-invisible on the white message bubble.

The same class `prose-ul:text-secondary prose-ol:text-secondary` affects lists too.

**Fix**: Change `text-secondary` to `text-secondary-foreground` in the prose class list. This resolves to `hsl(var(--secondary-foreground))` = ink (`#2C2416`), which is the correct dark text color.

### Task 1.1: Fix MarkdownRenderer prose text color

**File**: `apps/web/app/components/chat/MarkdownRenderer.tsx:15`

Change the className string:
- `prose-p:text-secondary` → `prose-p:text-secondary-foreground`
- `prose-ul:text-secondary` → `prose-ul:text-secondary-foreground`
- `prose-ol:text-secondary` → `prose-ol:text-secondary-foreground`

Also fix the explicit `<p>` component at line 87:
- `className="text-secondary leading-relaxed"` → `className="text-secondary-foreground leading-relaxed"`

And the `<li>` at line 102:
- `className="text-secondary flex items-start"` → `className="text-secondary-foreground flex items-start"`

And `<td>` at line 177:
- `className="px-4 py-3 text-sm text-secondary"` → `className="px-4 py-3 text-sm text-secondary-foreground"`

**Impact**: Affects ALL chat messages everywhere (guest mode, authenticated sessions, demo viewer). This is a global fix — all markdown-rendered content will become readable.

## Issue 2: Demo Pages Crash (Client-Side Exception)

**Severity**: Critical — demos are completely broken

**Root Cause**: `demo/[scenario]/page.tsx:11` uses a **named import** `{ MarkdownRenderer }` but the component is exported as `export default`. This causes `MarkdownRenderer` to be `undefined` at runtime, crashing when React tries to render it.

All other files correctly use `import MarkdownRenderer from ...` (default import).

**Fix**: Change the import to use default import syntax.

### Task 2.1: Fix MarkdownRenderer import in demo page

**File**: `apps/web/app/demo/[scenario]/page.tsx:11`

Change:
```tsx
import { MarkdownRenderer } from '@/app/components/chat/MarkdownRenderer'
```
To:
```tsx
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer'
```

## Issue 3: Demo Scenario Page Uses Blue Gradient (Not Brand Theme)

**Severity**: Medium — design inconsistency, not blocking

**Root Cause**: `demo/[scenario]/page.tsx` was built with a generic blue theme before the Wes Anderson design system was applied. Key offenders:

- Line 56: `bg-gradient-to-br from-blue-50 to-indigo-100` (page background)
- Line 86: `bg-blue-600 h-2` (progress bar)
- Line 113: `bg-blue-600` (Mary avatar)
- Line 133: `bg-blue-500 text-white` (Mary message avatar)
- Lines 142-144: `bg-blue-50 border border-blue-200` (Mary message bubble)
- Lines 146-148: `text-blue-700` (Mary label)
- Line 203: `text-blue-600` (Strategic Analysis icon)
- Line 214: `bg-blue-600` (progress bar in sidebar)
- Line 262: `border-blue-200 bg-blue-50` (CTA card)
- Lines 264, 267: `text-blue-900`, `text-blue-700` (CTA text)

**Fix**: Replace all blue-* classes with Wes Anderson equivalents. Follow the pattern already used in `demo/page.tsx` (the hub page, which correctly uses the brand palette).

### Task 3.1: Retheme demo scenario page

**File**: `apps/web/app/demo/[scenario]/page.tsx`

Color mapping:
| Blue class | Wes Anderson replacement |
|------------|-------------------------|
| `from-blue-50 to-indigo-100` | `bg-cream` |
| `bg-blue-600` (accent) | `bg-terracotta` |
| `bg-blue-500` (avatar) | `bg-terracotta` |
| `bg-blue-50 border-blue-200` | `bg-parchment border-ink/8` |
| `text-blue-700` | `text-ink` |
| `text-blue-900` | `text-ink` |
| `text-blue-600` | `text-terracotta` |
| `border-blue-200 bg-blue-50` (CTA) | `border-terracotta/20 bg-terracotta/5` |
| `bg-green-500` (user avatar) | `bg-forest` |
| `bg-green-50 border-green-200` | `bg-cream border-ink/8` |
| `text-green-700` | `text-forest` |
| `bg-gray-50` (header bg) | `bg-parchment` |
| `bg-white border-b` (header) | `bg-white border-b border-ink/8` |
| `bg-purple-600` (progress) | `bg-mustard` |
| `bg-green-600` (progress) | `bg-forest` |

## Issue 4: "View Strategic Session" Button Turns White on Hover

**Severity**: Low — cosmetic but noticeable

**Root Cause**: `demo/page.tsx:129` — the button has `hover:bg-ink hover:text-cream` which is correct for the button background, but the button text "View Strategic Session" starts as `text-ink` and switches to `text-cream` (white) on hover. The issue Kevin reported is likely about the button's inner text color, but on closer inspection the hover state is intentional (ink background with cream text).

However, looking at the Card component — the hover on the Card itself (line 80) doesn't change background color, so the button sits on a parchment card with `hover:bg-ink hover:text-cream`. This is actually fine visually.

**Recheck**: If the issue is specifically about text readability during hover, it may be that the `group-hover:text-terracotta` on the card title (line 93) combined with the button hover creates visual confusion. Will verify during implementation.

### Task 4.1: Verify and fix hover state readability

**File**: `apps/web/app/demo/page.tsx:128-134`

Check the actual rendered behavior. If the button text is truly unreadable on hover, ensure the hover text color has sufficient contrast against the hover background.

## Issue 5: Kevin's Account Blocked by Waitlist

**Severity**: Critical — Kevin can't access his own app

**Root Cause**: `app/app/layout.tsx:17` checks `betaApproved` via `checkBetaAccess()`. This reads `beta_approved` from the JWT claims (`lib/auth/beta-access.ts:33`). Kevin's account doesn't have `beta_approved: true` in his user metadata, so the JWT doesn't contain the claim, and he gets redirected to `/waitlist`.

**Fix**: Set `beta_approved: true` in Kevin's Supabase user metadata. This will propagate to the JWT on next token refresh.

### Task 5.1: Set beta_approved for Kevin's account

**Method**: Supabase dashboard or SQL.

Option A — Supabase Dashboard:
1. Go to Supabase dashboard → Authentication → Users
2. Find `hollandkevint` user
3. Edit user metadata → add `"beta_approved": true` to `raw_app_meta_data`

Option B — SQL (via Supabase SQL Editor):
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"beta_approved": true}'::jsonb
WHERE email = 'hollandkevint@gmail.com';
```

**Important**: The JWT claim comes from `app_metadata`, not `user_metadata`. Verify that `beta-access.ts` checks the right field. After setting, Kevin needs to re-login or wait for token refresh.

### Task 5.2: Verify JWT claim propagation

After updating Supabase, verify:
1. Log out of thinkhaven.co
2. Log back in
3. Confirm redirect goes to `/app` (not `/waitlist`)

## Dependencies & Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| MarkdownRenderer color fix affects other pages | Medium | The fix goes from invisible text to readable text — always an improvement |
| Demo retheme introduces layout bugs | Low | Follow existing `demo/page.tsx` patterns exactly |
| JWT claim doesn't propagate | Medium | Force re-login; check Supabase custom claims hook if present |
| `text-secondary-foreground` not defined | Very Low | Already defined in tailwind config (`secondary.foreground`) and globals.css |

## Out of Scope

- Assessment page visual consistency (separate issue)
- WaitlistForm color fix (separate issue)
- Adding more demo scenarios
- Onboarding flow
- Mobile hamburger menu

## References

- MarkdownRenderer: `apps/web/app/components/chat/MarkdownRenderer.tsx`
- Demo hub: `apps/web/app/demo/page.tsx`
- Demo viewer: `apps/web/app/demo/[scenario]/page.tsx`
- Guest chat: `apps/web/app/components/guest/GuestChatInterface.tsx`
- Beta access: `apps/web/lib/auth/beta-access.ts`
- App layout gate: `apps/web/app/app/layout.tsx`
- CSS variables: `apps/web/app/globals.css:82-98`
- Tailwind config: `apps/web/tailwind.config.cjs:60-92`
- StreamingMessage: `apps/web/app/components/chat/StreamingMessage.tsx`
