---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, design-system, consistency]
dependencies: []
---

# Hardcoded Hex/RGBA Values in Session Page and SpeakerMessage

## Problem Statement

Two files contain hardcoded `#f9f9f9` and `rgba(0, 0, 0, 0.05)` in inline styles for code block backgrounds. These are cool grays that don't match the warm palette.

## Findings

**Source:** Architecture, Pattern, Performance, and Simplicity agents

| File | Value | Replacement |
|------|-------|-------------|
| `app/app/session/[id]/page.tsx:817` | `rgba(0, 0, 0, 0.05)` | `bg-ink/5` |
| `app/app/session/[id]/page.tsx:824` | `#f9f9f9` | `bg-parchment` |
| `app/components/board/SpeakerMessage.tsx:51` | `rgba(0, 0, 0, 0.05)` | `bg-ink/5` |
| `app/components/board/SpeakerMessage.tsx:60` | `#f9f9f9` | `bg-parchment` |
| `app/components/chat/MessageInput.tsx:269` | `#CBD5E1` (scrollbar) | Should use palette token |

**Additional note:** These two inline markdown renderers (session page + SpeakerMessage) are near-identical copies. The shared `MarkdownRenderer` component already exists and uses the design system correctly. Consider replacing the inline renderers with the shared component.

## Acceptance Criteria
- [ ] Zero hardcoded hex colors in UI components (excluding syntax highlighting)
- [ ] Code block backgrounds use palette tokens

## Work Log
- 2026-02-16: Identified by multiple agents during PR #8 code review
