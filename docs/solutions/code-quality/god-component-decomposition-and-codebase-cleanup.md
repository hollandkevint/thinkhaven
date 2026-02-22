---
title: God component decomposition, dead code removal, and codebase-wide cleanup
date: 2026-02-21
category: code-quality
severity: P2
tags: [refactoring, dead-code-removal, component-extraction, querySelector-antipattern, console-log-cleanup, ui-consistency, security-hardening, idor-fix]
affected_files:
  - apps/web/app/app/session/[id]/page.tsx
  - apps/web/app/app/session/[id]/useStreamingChat.ts
  - apps/web/app/api/bmad/route.ts
  - apps/web/app/components/bmad/BmadInterface.tsx
  - apps/web/app/components/bmad/useBmadSession.ts
  - apps/web/app/components/bmad/ErrorBoundary.tsx
  - apps/web/app/components/bmad/PathwaySelector.tsx
  - apps/web/components/canvas/CanvasContextSync.tsx
  - apps/web/app/api/chat/stream/route.ts
  - apps/web/app/api/chat/guest/route.ts
  - apps/web/app/auth/callback/route.ts
symptoms:
  - page.tsx at 1025 lines mixing streaming, state, and UI logic
  - 1200 lines of error monitoring code with zero consumers
  - document.querySelector calls in React components targeting wrong element types
  - 42+ debug console.logs in production code paths
  - Hand-rolled error UIs diverging from shared ErrorState component
  - Skeleton loader CSS not matching real dual-pane layout
  - BMAD API endpoints missing ownership verification (IDOR)
root_cause: Organic feature accumulation without extraction discipline. Error monitoring infrastructure built speculatively and abandoned. DOM access patterns carried over from non-React habits. No lint rules enforcing console.log or querySelector restrictions.
resolution: Extracted useStreamingChat hook (325 lines), deleted 4 dead files (~1200 lines), replaced querySelector with refs/callbacks, cleaned 42 console.logs, unified error UI with ErrorState, fixed skeleton CSS, added IDOR checks to 7 endpoints. Net ~2000 lines deleted, 0 regressions.
---

# God Component Decomposition and Codebase Cleanup

## Problem

The session workspace (`apps/web/app/app/session/[id]/page.tsx`) had grown to ~1,025 lines, mixing SSE streaming logic, board member speaker handoffs, Supabase persistence, and UI rendering in a single file. Surrounding code had accumulated ~1,200 lines of dead error monitoring infrastructure, 42 debug console.logs, querySelector anti-patterns, and divergent error UIs.

## Investigation

Import graph analysis on the error monitoring files (`error-handler.ts`, `error-monitor.ts`, `ErrorMonitorDashboard.tsx`) showed zero consumers. The monitoring system used in-memory storage with no persistence layer connected.

Four suggestion click handlers in page.tsx used `document.querySelector('input[type="text"]')` but the actual element was a `<textarea>`, causing focus calls to silently fail.

BmadInterface had two hand-rolled inline error UIs instead of using the shared `ErrorState` component, and the skeleton loader used different CSS classes than the real layout.

## Solution

### 1. Hook Extraction: useStreamingChat (page.tsx 1025 -> 707 lines)

Extracted all streaming and message state into a dedicated hook:

```typescript
// apps/web/app/app/session/[id]/useStreamingChat.ts (325 lines)
export function useStreamingChat(initialWorkspace: Workspace | null): UseStreamingChatReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [boardState, setBoardState] = useState<BoardState | null>(null)
  const workspaceRef = useRef<Workspace | null>(initialWorkspace)

  // workspaceRef prevents stale closures in streaming callbacks
  useEffect(() => { workspaceRef.current = workspace }, [workspace])

  // Contains: addChatMessage, updateStreamingMessage, finalizeAssistantMessage,
  //           streamClaudeResponse (SSE parsing + speaker handoffs), handleSendMessage
}
```

page.tsx now delegates to the hook:

```typescript
const { workspace, messageInput, setMessageInput, sendingMessage, handleSendMessage } =
  useStreamingChat(fetchedWorkspace)
```

### 2. Dead Code Removal (~1,200 lines deleted)

Files deleted after confirming zero imports in codebase:

| File | Lines | Purpose |
|------|-------|---------|
| `lib/bmad/error-handler.ts` | 355 | Error formatting/categorization |
| `lib/bmad/error-monitor.ts` | 338 | In-memory event tracking, no persistence |
| `app/components/bmad/ErrorMonitorDashboard.tsx` | 221 | Dashboard UI, never mounted |
| `tests/lib/bmad/error-monitor.test.ts` | 287 | Tests for dead code |

Removed all `BmadErrorHandler`/`BmadErrorMonitor` imports from `useBmadSession.ts`, `ErrorBoundary.tsx`, `PathwaySelector.tsx`. Simplified catch blocks from `BmadErrorHandler.handleError()` + re-throw to `setError(message)` + `console.error`.

### 3. querySelector Replacement

**CanvasContextSync**: Replaced `document.querySelector('[data-canvas-container]')` + scrollIntoView + CustomEvent with a callback prop:

```typescript
interface CanvasContextSyncProps {
  onScrollToCanvas?: (suggestionId: string) => void
}
// Called as: onScrollToCanvas?.(activeSuggestion.id)
```

**Suggestion focus**: Replaced 4 `document.querySelector('input[type="text"]')` calls (targeting wrong element) with `useRef<HTMLTextAreaElement>`:

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null)
// In click handler:
textareaRef.current?.focus()
```

### 4. Console.log Cleanup (42 statements)

Removed all debug console.logs. Preserved console.error/console.warn. Converted a few important logs to tagged format:
- `[AUTH] OAuth login complete`
- `[LIMIT] Message limit reached`

### 5. UI Consistency

Replaced 2 inline error UIs in BmadInterface with shared component:

```typescript
// Before: hand-rolled <div className="p-4 bg-red-50...">
// After:
{error && <ErrorState error={error} />}
```

Fixed skeleton loader to use `dual-pane-container canvas-closed` classes matching real component layout.

### 6. Security Hardening (BMAD API)

Added ownership verification to 7 endpoints. See `docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md` for the full security solution pattern.

## Prevention Strategies

### God Component Growth
- Enforce a ~300-line guideline on page.tsx files
- Extract hooks when state management + side effects exceed ~100 lines
- Split page.tsx into: layout (page.tsx), hooks (useX.ts), subcomponents (components/)

### Dead Code Accumulation
- Run `ts-prune` or grep for unused exports periodically
- Rule: any speculative infrastructure must have at least one consumer before merging
- Quarterly dead code audit

### querySelector in React
- ESLint `no-restricted-syntax` rule on `document.querySelector`, `document.getElementById`
- Always use `useRef<SpecificElement>` with correct HTML element type
- For cross-component DOM access, use callback props or React context

### Console.log Proliferation
- Consider ESLint `no-console` rule (warn in dev, error in prod)
- Use tagged format for logs that should survive: `[MODULE] message`

### UI Component Divergence
- Code review: search PR diffs for hand-coded error/loading UIs
- Maintain shared components: `ErrorState`, `LoadingState`, `EmptyState`

## Result

- ~2,000 lines deleted across the session
- 0 regressions (build passes, existing tests unaffected)
- 5 commits pushed to main
- Vercel auto-deployed

## Related Documentation

- [Security hardening](../security-issues/multi-agent-review-security-correctness-hardening.md) - IDOR, credentials, PII logging fixes
- [Dashboard hydration fix](../runtime-errors/dashboard-hydration-undefined-property.md) - E2E test patterns, session schema
- [Board of Directors architecture](../architecture-patterns/personal-board-of-directors-multi-perspective-ai.md) - Speaker switching, streaming patterns
- [Design system retheme](../design-system-refactoring/wes-anderson-palette-retheme-comprehensive.md) - UI consistency patterns
- [Landing page SSR fix](../logic-errors/landing-page-data-duplication-and-ssr.md) - Board member data canonicalization

## Commits

```
6990827 refactor: decompose god component, eliminate querySelector, clean logs
4a0d4c5 fix: broken indentation from mock elicitation removal, drop unused var
56e171b refactor: remove dead error monitoring infrastructure
d6bcd85 fix: broken suggestion focus, remove dead code, strip console.log noise
1238d00 fix: harden bmad API security and clean up session workspace UI
```
