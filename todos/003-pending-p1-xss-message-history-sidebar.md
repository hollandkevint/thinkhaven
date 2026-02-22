---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, security, xss, pre-existing]
dependencies: []
---

# Pre-existing XSS via dangerouslySetInnerHTML in MessageHistorySidebar

## Problem Statement

`MessageHistorySidebar.tsx` renders message content as raw HTML using `dangerouslySetInnerHTML` without sanitization. This is a stored XSS vector if an attacker can inject HTML into chat messages.

**NOT introduced by this PR** -- pre-existing. But the PR touches this component (color class swaps) without fixing the vulnerability.

## Findings

**Source:** Security Sentinel agent

**File:** `app/components/chat/MessageHistorySidebar.tsx:597`

```tsx
<div
  className="text-sm text-secondary leading-relaxed"
  dangerouslySetInnerHTML={{
    __html: message.content.length > 200
      ? `${message.content.substring(0, 200)}...`
      : message.content
  }}
/>
```

The 200-char truncation limits but doesn't eliminate risk (`<img onerror=alert(1)>` is 25 chars).

## Proposed Solutions

### Option A: Replace with text node (Recommended)
Replace `dangerouslySetInnerHTML` with a text node that renders plain text. The sidebar preview doesn't need HTML rendering.
- Effort: Small
- Risk: None

### Option B: Sanitize with DOMPurify
Add DOMPurify sanitization before rendering.
- Effort: Small (add dependency + wrapper)
- Risk: Low (DOMPurify is well-tested)

## Acceptance Criteria
- [ ] No `dangerouslySetInnerHTML` with unsanitized user content
- [ ] Message preview still truncates correctly

## Work Log
- 2026-02-16: Identified by security sentinel agent during PR #8 code review (pre-existing)
