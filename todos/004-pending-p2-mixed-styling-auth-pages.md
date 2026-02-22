---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, design-system, consistency]
dependencies: []
---

# Auth Pages Use Inline style={{var(--*)}} Instead of Tailwind Classes

## Problem Statement

Login, signup, and try pages use `style={{ color: 'var(--foreground)' }}` patterns (14+ instances in login.tsx alone) while the rest of the codebase uses Tailwind tokens. This creates two styling paradigms.

## Findings

**Source:** Architecture and Pattern agents

### Files affected:
- `app/login/page.tsx` -- 14+ inline var() styles
- `app/signup/page.tsx` -- 10+ inline var() styles, plus `rgba()` values at lines 235, 249
- `app/try/page.tsx` -- inline var() styles
- `app/components/guest/SignupPromptModal.tsx`
- `app/components/workspace/ExportPanel.tsx` -- ~20 remaining `style={{ color: 'var(--foreground)' }}`

The Tailwind config already maps these tokens: `text-ink` = foreground, `bg-cream` = background, `border-border`, etc.

## Proposed Solutions

### Option A: Convert all to Tailwind classes (Recommended)
`style={{ color: 'var(--foreground)' }}` becomes `className="text-foreground"` or `text-ink`.
- Effort: Medium (5 files, ~60 replacements)
- Risk: Low

## Acceptance Criteria
- [ ] Zero `style={{ color: 'var(--foreground)' }}` in components
- [ ] Auth pages use same Tailwind token approach as rest of codebase

## Work Log
- 2026-02-16: Identified by architecture and pattern agents during PR #8 code review
