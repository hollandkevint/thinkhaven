---
title: Landing Page Data Duplication & Server Component Migration
date: 2026-02-21
category: logic-errors
tags:
  - landing-page
  - server-components
  - data-duplication
  - static-rendering
  - architecture
  - board-of-directors
severity: medium
component: Landing Page (apps/web/app/page.tsx)
symptoms:
  - Board member data duplicated between page.tsx and canonical registry
  - Elaine's role diverged ("Coach" vs "Coach Lens")
  - optIn field naming mismatch (optIn vs isOptIn)
  - Page unnecessarily marked 'use client' for 3 router.push() calls
  - Landing page shipped as client JS instead of static HTML
root_cause: Board member data hardcoded in page.tsx instead of imported from lib/ai/board-members.ts. Page marked 'use client' for useRouter navigation that could use Link components.
resolution: Imported BOARD_MEMBERS from canonical registry with landing-page-only quote extension. Converted to server component using Link + Button asChild pattern.
verified: true
files_modified:
  - apps/web/app/page.tsx
  - apps/web/app/layout.tsx
  - apps/web/app/components/ui/navigation.tsx
  - apps/web/tests/components/landing-page.test.tsx
---

# Landing Page Data Duplication & Server Component Migration

## Problem

ThinkHaven's landing page had two P1 architectural issues discovered during a 6-agent code review:

**P1-A: Data Duplication**
Board member data was hardcoded in `page.tsx` as a local `boardMembers` array, duplicating the canonical `BOARD_MEMBERS` registry in `lib/ai/board-members.ts`. The data was already diverged: Elaine's role was "Coach" in page.tsx but "Coach Lens" in the registry. The `optIn` field used different naming than the canonical `isOptIn`.

**P1-B: Unnecessary Client Component**
The page was `'use client'` solely because of `useRouter()` for 3 `router.push()` calls. All content was static. This forced the entire page into the client JS bundle, preventing static generation and adding ~20KB of unnecessary JavaScript to every visitor's download.

## Root Cause

1. **Data divergence**: Board member information was copied into the landing page instead of imported from the canonical registry. No compile-time check existed to catch drift.
2. **Router dependency**: Navigation was implemented with client-side `router.push()` instead of `<Link>` components, tying the page to client runtime unnecessarily.
3. **No type validation**: Adding a board member to the registry wouldn't fail the build if the landing page quotes were missing.

## Solution

### Fix 1: Import from Canonical Source

Replace the hardcoded `boardMembers` array with an import from the registry, extending with landing-page-only fields:

```typescript
import { BOARD_MEMBERS } from '@/lib/ai/board-members'
import type { BoardMemberId } from '@/lib/ai/board-types'

const LANDING_QUOTES: Record<BoardMemberId, string> = {
  mary: 'Let me bring in Victoria here, because this is really a question about whether the economics work.',
  victoria: 'Who signs the check? Walk me through your unit economics.',
  casey: 'Real talk, do you actually want to spend two years on this?',
  elaine: 'I have seen this pattern before. What usually happens next is...',
  omar: 'What ships this quarter? Who is building this? What is the critical path?',
  taylor: 'How does this decision sit with you emotionally?',
}

const boardMembers = BOARD_MEMBERS.map(member => ({
  ...member,
  quote: LANDING_QUOTES[member.id],
  cssColor: `var(--board-${member.id})`,
}))
```

The `Record<BoardMemberId, string>` type ensures TypeScript fails at compile time if a board member is added to the registry without a corresponding quote.

### Fix 2: Server Component Conversion

Remove client runtime dependency by replacing router-based navigation with standard links:

**Removed:**
- `'use client'` directive
- `useRouter` import and `const router = useRouter()`
- Three `onClick={() => router.push('/path')}` handlers

**Replaced with `Link` + `Button asChild`:**
```tsx
<Button size="lg" className="..." asChild>
  <Link href="/try">
    Try a Free Session
    <ArrowRight className="w-4 h-4 ml-2" />
  </Link>
</Button>
```

Footer anchors also converted from `<a href>` to `<Link>` for prefetching.

## Verification

- **Build output**: Page now renders as `○ /` (Static, prerendered) instead of client-rendered
- **Tests**: 12/12 pass. Updated to mock `next/link`, verify `href` attributes instead of `mockPush` calls
- **Data integrity**: Canonical board member data single-sourced from registry. Any registry update propagates automatically.

## Prevention

### When to use Server vs Client Components

| Scenario | Component Type |
|----------|---------------|
| Static content with links | Server (use `<Link>`) |
| Needs `useRouter()` for navigation only | Server (use `<Link>` instead) |
| User interaction (click handlers, form state) | Client |
| Needs `useRouter()` for redirect logic | Server (use `redirect()`) |

### Data Duplication Detection

- Before defining data structures, search the codebase for existing definitions
- Use typed Record maps (`Record<BoardMemberId, string>`) to get compile-time safety when extending canonical data
- Code review check: "Does this data already exist elsewhere?"

### Key Pattern

When a page needs to display data that exists in a canonical registry:
1. Import the canonical source
2. Extend with page-specific fields using `.map()`
3. Use TypeScript to enforce completeness

## Related Documentation

- [Dashboard Hydration & E2E Test Failures](../runtime-errors/dashboard-hydration-undefined-property.md) -- SSG safety patterns, WaitlistForm crash
- [Security & Correctness Hardening](../security-issues/multi-agent-review-security-correctness-hardening.md) -- type safety patterns, null guards
- [Board of Directors Architecture](../architecture-patterns/personal-board-of-directors-multi-perspective-ai.md) -- tool-call approach, speaker tracking
- CLAUDE.md Pitfall #12: `lib/supabase/client.ts` no-op Proxy for SSG safety
