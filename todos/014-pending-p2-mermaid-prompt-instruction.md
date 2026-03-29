---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, agent-native, prompt]
---

# Add Mermaid diagram capability to Mary's system prompt

## Problem Statement

The artifact parser at `lib/artifact/artifact-parser.ts` already extracts `mermaid-diagram` artifacts from fenced code blocks. The rendering pipeline is ready. But `generateFormattingGuidelines()` in `mary-persona.ts:715-723` never tells Mary she can write ` ```mermaid ` blocks. Without the prompt instruction, Mary generating diagrams is accidental, not intentional.

Found by: Agent-native reviewer

## Context

- No separate `generate_diagram` tool needed. Mermaid-in-markdown is already a primitive pattern.
- This is a one-line prompt addition, not a code change.
- Highest ROI change since it unlocks a new output modality that's already supported.

## Acceptance Criteria

- [ ] `generateFormattingGuidelines()` in `mary-persona.ts` includes Mermaid instruction
- [ ] Mary proactively creates flowcharts, decision trees, competitive landscapes when relevant
- [ ] Mermaid blocks render correctly in the chat via artifact parser

## References

- `lib/ai/mary-persona.ts:715-723`
- `lib/artifact/artifact-parser.ts`
