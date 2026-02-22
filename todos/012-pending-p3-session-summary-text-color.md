---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, design-system]
dependencies: []
---

# EnhancedSessionManager Session Summary Uses text-terracotta for Body Text

## Problem Statement

Session summary body text is `text-terracotta` (the primary accent color). Per design conventions, body text should be `text-ink-light` or `text-ink`. Terracotta is for accents, buttons, and links.

## Findings

**Source:** Pattern Recognition agent

**File:** `app/components/bmad/EnhancedSessionManager.tsx:476`

```tsx
<div className="space-y-3 text-sm text-terracotta">
```

## Proposed Solutions

Change to `text-ink-light` or `text-secondary`.
- Effort: Small (1 line)

## Work Log
- 2026-02-16: Identified during PR #8 code review
