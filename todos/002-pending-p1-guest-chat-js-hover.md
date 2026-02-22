---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, anti-pattern, frontend]
dependencies: []
---

# GuestChatInterface Uses JS Hover Handlers Instead of CSS

## Problem Statement

`GuestChatInterface.tsx` uses `onMouseOver`/`onMouseOut` JavaScript event handlers for button hover states instead of CSS/Tailwind `hover:` classes. This is a React anti-pattern that breaks on touch devices, is slower than CSS, and bypasses transitions.

## Findings

**Source:** Pattern Recognition agent

**File:** `app/components/guest/GuestChatInterface.tsx:294-295`

```tsx
onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta-hover)'}
onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta)'}
```

Also uses hardcoded `rgba()` values at lines 253, 266-269 that have direct Tailwind equivalents.

## Proposed Solutions

### Option A: Convert to Tailwind hover classes (Recommended)
Replace JS handlers with `className="bg-terracotta hover:bg-terracotta-hover transition-colors"` and convert rgba values to Tailwind opacity syntax (`bg-mustard/15`, `bg-rust/10`, `bg-forest/10`).
- Effort: Small
- Risk: None

## Acceptance Criteria
- [ ] Zero `onMouseOver`/`onMouseOut` handlers for styling
- [ ] All inline `rgba()` values replaced with Tailwind opacity classes
- [ ] Button hover works on touch devices

## Work Log
- 2026-02-16: Identified by pattern recognition agent during PR #8 code review
