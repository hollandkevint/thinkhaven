---
status: complete
priority: p1
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, frontend, mobile]
---

# ArtifactPanel w-[450px] overflows on mobile

## Problem Statement

`ArtifactPanel.tsx:96` uses `w-[450px]` with no responsive breakpoint. On any screen narrower than 450px (all phones), the panel overflows the viewport.

## Context

Found by: Frontend UI pattern audit

## Acceptance Criteria

- [ ] Change to `w-full sm:w-[450px]` or `max-w-[450px] w-full`
- [ ] Verify panel renders correctly on 375px viewport
- [ ] No horizontal scroll on mobile when panel is open

## References

- `app/components/artifact/ArtifactPanel.tsx:96`
