---
title: "Fix Anthropic SDK upgrade and tool calling 400 errors"
type: fix
date: 2026-03-25
---

# Fix Anthropic SDK Upgrade and Tool Calling 400 Errors

## Problem

Production users get "The session does not exist or you do not have access" errors when sending messages. The actual error is a **400 from the Claude API** during the agentic tool loop continuation. The first Claude API call succeeds and returns tool_use blocks, but the second call (sending tool results back) fails with 400.

**Root cause:** The agentic loop in `route.ts` manually reconstructs `ContentBlock` objects with `as ContentBlock` casts (lines 117-131). These casts hide type mismatches -- `ContentBlock` is a response type, but the API expects `ContentBlockParam` types for input. The reconstructed objects may have missing or extra fields that the API rejects.

**Secondary issue:** The Anthropic SDK is 18 months outdated (`^0.27.3` vs latest `0.80.0`).

## Proposed Solution

Two changes, in order:

### 1. Fix the content block reconstruction (P0 -- fixes the 400)

In `claude-client.ts`, add `rawContent: ContentBlock[]` to `MessageWithToolUse` and capture it from the API response. In the agentic loop, use `response.rawContent` instead of manually reconstructing content blocks.

**Files:**
- `apps/web/lib/ai/claude-client.ts` -- add `rawContent` field, capture from response
- `apps/web/app/api/chat/stream/route.ts` -- use `response.rawContent` at line 132

### 2. Upgrade @anthropic-ai/sdk to latest (P1 -- maintenance)

Bump from `^0.27.3` to `^0.80.0`. No breaking changes affect our usage. Tool types, `input_schema`, and `messages.create()` API are unchanged.

**Files:**
- `apps/web/package.json` -- version bump

## Acceptance Criteria

- [ ] Messages send successfully without 400 errors
- [ ] Agentic tool loop completes (tools execute, results sent back to Claude)
- [ ] Board of Directors switch_speaker works
- [ ] Lean Canvas update_lean_canvas works
- [ ] `npm run build` passes
- [ ] SDK upgraded to latest stable version

## Technical Details

**Current broken flow:**
```
1. sendMessageWithTools() → Claude returns tool_use blocks ✅
2. Agentic loop manually reconstructs assistant ContentBlock[] ❌
3. continueWithToolResults() sends reconstructed blocks → 400 ❌
```

**Fixed flow:**
```
1. sendMessageWithTools() → returns rawContent from response ✅
2. Agentic loop uses rawContent directly ✅
3. continueWithToolResults() sends original API response blocks → 200 ✅
```

**Key code change in route.ts (lines 117-132):**
```typescript
// BEFORE (broken): manual reconstruction with unsafe casts
const assistantContent: ContentBlock[] = [];
if (response.textContent) {
  assistantContent.push({ type: 'text', text: response.textContent } as ContentBlock);
}
response.toolUses.forEach(tu => {
  assistantContent.push({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input } as ContentBlock);
});
conversation.push({ role: 'assistant', content: assistantContent });

// AFTER (fixed): use raw response content directly
conversation.push({ role: 'assistant', content: response.rawContent });
```

## References

- Anthropic tool use docs: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use
- SDK changelog: https://github.com/anthropics/anthropic-sdk-typescript/releases
- Current SDK: `^0.27.3`, target: `^0.80.0`
- Affected files: `claude-client.ts`, `route.ts`, `package.json`
