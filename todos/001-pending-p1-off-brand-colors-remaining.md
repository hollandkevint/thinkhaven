---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, design-system, pattern-consistency]
dependencies: []
---

# Off-Brand Color Tokens in ~8 Untouched Components

## Problem Statement

Several components were missed during the design system retheme. They still use banned Tailwind defaults (gray-*, blue-*, red-*, etc.) instead of the Wes Anderson palette tokens defined in design-conventions.md.

## Findings

**Source:** Security, Architecture, Pattern, Performance, TypeScript, and Simplicity agents all flagged this independently.

### Files to fix:

| File | Off-brand classes |
|------|------------------|
| `lib/bmad/utils/scoring-guidance.ts:111-115` | `text-red-600`, `text-orange-600`, `text-yellow-600`, `text-blue-600`, `text-green-600` |
| `app/components/ui/ErrorBoundary.tsx` | `text-red-600`, `text-gray-600` (x3), `bg-yellow-50`, `border-yellow-200`, `text-yellow-800`, `text-gray-500`, `bg-gray-100` |
| `app/components/dual-pane/StateBridge.tsx:130-132` | `bg-blue-100 text-blue-800`, `bg-green-100 text-green-800`, `bg-gray-100 text-gray-800` |
| `app/components/dual-pane/PaneErrorBoundary.tsx:69` | `bg-gray-50`, `text-gray-700` |
| `app/components/canvas/EnhancedCanvasWorkspace.tsx:289` | `ring-green-500 ring-opacity-50` |
| `app/components/chat/MessageInput.tsx:243` | `hover:bg-gray-50` |
| `app/components/chat/MarkdownRenderer.tsx:28` | `text-gray-600 hover:text-gray-800` (copy button, NOT syntax highlighting) |
| `components/ui/dropdown-menu.tsx:139,155` | `hover:bg-gray-100`, `bg-gray-200` (shadcn source) |

## Proposed Solutions

### Option A: Fix all in this PR (Recommended)
- Pros: Complete retheme, single PR
- Cons: Adds scope to an already large PR
- Effort: Small (mechanical class swaps)
- Risk: Low

### Option B: Fix in follow-up PR
- Pros: Keeps current PR scope contained
- Cons: Incomplete retheme ships to main
- Effort: Small
- Risk: Low

## Acceptance Criteria
- [ ] Zero `gray-*`, `blue-*`, `red-*`, `green-*`, `yellow-*`, `orange-*` classes in production UI components (excluding syntax highlighting exemptions documented in design-conventions.md)
- [ ] `scoring-guidance.ts` returns palette token classes
- [ ] MarkdownRenderer copy button uses `text-slate-blue hover:text-ink`

## Work Log
- 2026-02-16: Identified by 6 parallel review agents during PR #8 code review
