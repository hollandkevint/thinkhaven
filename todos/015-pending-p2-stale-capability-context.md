---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, agent-native, prompt]
---

# buildCapabilityContext lists 4 tools but 8 exist — context drift

## Problem Statement

`buildCapabilityContext()` in `lib/ai/context-builder.ts:199-267` hardcodes 4 tools in the "Available Capabilities" section: `complete_phase`, `switch_persona_mode`, `recommend_action`, `generate_document`. The actual tool set has 8 tools, missing: `read_session_state`, `switch_speaker`, `update_lean_canvas`, `update_session_context`.

The tools still work (passed to Anthropic API as tool definitions), but the system prompt creates a conflicting signal that may reduce how often Mary reaches for undocumented tools.

Found by: Agent-native reviewer

## Context

- Tools are defined in `MARY_TOOLS` array in `lib/ai/tools/index.ts`
- Dynamic generation from `MARY_TOOLS` would prevent future drift

## Acceptance Criteria

- [ ] `buildCapabilityContext()` lists all 8 tools, or generates the list from `MARY_TOOLS`
- [ ] No hardcoded tool names that can drift from the actual tool definitions

## References

- `lib/ai/context-builder.ts:199-267`
- `lib/ai/tools/index.ts` (MARY_TOOLS)
