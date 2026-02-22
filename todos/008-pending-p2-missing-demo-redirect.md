---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, routes, ux]
dependencies: []
---

# Missing /demo Redirect After Page Deletion

## Problem Statement

Demo pages were deleted but no redirect was added in `next.config.ts`. Users with bookmarked `/demo` URLs get a 404 instead of being redirected to `/try`. The CLAUDE.md route architecture documents legacy redirects for other removed routes.

## Findings

**Source:** Security agent

The `/demo` route was removed from `middleware.ts` testOnlyRoutes and the page files were deleted. But `next.config.ts` has no redirects configured.

## Proposed Solutions

### Option A: Add redirect in next.config.ts (Recommended)
```ts
async redirects() {
  return [
    { source: '/demo', destination: '/try', permanent: true },
    { source: '/demo/:path*', destination: '/try', permanent: true },
  ];
}
```
- Effort: Small
- Risk: None

## Acceptance Criteria
- [ ] `/demo` and `/demo/*` redirect to `/try` with 301 status

## Work Log
- 2026-02-16: Identified by security sentinel agent during PR #8 code review
