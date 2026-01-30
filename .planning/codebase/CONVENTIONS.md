# Coding Conventions

**Analysis Date:** 2026-01-29

## Naming Patterns

**Files:**
- Components: `PascalCase.tsx` (e.g., `BmadInterface.tsx`, `StreamingMessage.tsx`)
- Utilities/Services: `camelCase.ts` (e.g., `session-orchestrator.ts`, `claude-client.ts`)
- Tests: `filename.test.ts` or `filename.spec.ts` (e.g., `mary-persona.test.ts`, `health.spec.ts`)
- Directories: `kebab-case` (e.g., `lib/ai/`, `app/components/chat/`)

**Functions:**
- `camelCase` for function names
- Async functions return descriptive names: `async function executeAgenticLoop()`, `async function generateFeatureBriefPDF()`
- Handler functions prefixed with verb: `handleSubmit`, `handleClick`, `checkMessageLimit`
- Factory functions prefixed with `create`: `createAnthropicClient()`, `createSessionRecord()`, `createSubPersonaState()`
- Getter/query functions: `hasCredits()`, `getSession()`, `getLimitReachedMessage()`

**Variables:**
- `camelCase` throughout
- Boolean flags prefixed with `is`, `has`, `can`: `isLoading`, `hasCredits`, `canAdvancePhase`
- Array/collection variables use plural: `toolsExecuted`, `messages`, `pathways`
- Ref objects: `useRef<Type>()` with descriptive names: `intervalRef`, `indexRef`

**Types:**
- `PascalCase` for interfaces and types (e.g., `BmadSession`, `ConversationMessage`, `SubPersonaMode`)
- Union types lowercase: `'inquisitive' | 'devil_advocate' | 'encouraging' | 'realistic'`
- Enum values `UPPERCASE_SNAKE_CASE`: `ElicitationType.NUMBERED_OPTIONS`, `PathwayType.NEW_IDEA`
- Callback/handler types: `OnXxx` (e.g., `onComplete`, `onBookmark`, `onCreateReference`)

## Code Style

**Formatting:**
- Tool: Not enforced at build time (ESLint only)
- No Prettier config found — rely on editor defaults and manual consistency
- 2-space indentation (standard for TypeScript/React projects)
- Line length: No hard limit enforced, but aim for readability

**Linting:**
- Tool: ESLint 9 with `eslint-config-next` + TypeScript support
- Config: `apps/web/eslint.config.mjs` (Flat Config format)
- Extends: `next/core-web-vitals` and `next/typescript`
- Ignored paths: `node_modules`, `.next`, `out`, `build`
- Enforcement: Manual via `npm run lint` (not enforced in CI)

## Import Organization

**Order:**
1. Third-party libraries (`react`, `next/`, `@anthropic-ai/sdk`, etc.)
2. Relative absolute path imports (`@/lib/`, `@/app/`, `@/components/`)
3. Type imports (`import type { }`)

**Example (from `apps/web/app/api/chat/stream/route.ts`):**
```typescript
// External
import { NextRequest } from 'next/server';

// Absolute path imports
import { claudeClient, type ConversationMessage } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';
import { CoachingContext, SubPersonaSessionState } from '@/lib/ai/mary-persona';

// Type imports grouped with others
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages';
```

**Path Aliases:**
- `@/*` → `/` (project root, maps to `apps/web/`)
- Monorepo imports use full paths: `@ideally/shared`, `@ideally/ui`, `@ideally/bmad-engine`
- Always use `@/` for app code, never relative imports like `../../../`

## Error Handling

**Patterns:**
- Custom error class for domain errors: `BmadMethodError`, `SessionStateError`
- Try-catch wraps async operations with meaningful error logging
- Example (`pdf-generator.ts`):
```typescript
try {
  const buffer = await renderToBuffer(doc);
  return { success: true, buffer, fileName };
} catch (error) {
  console.error('PDF generation error:', error);
  return {
    success: false,
    fileName: options.fileName || 'feature-brief.pdf',
    error: error instanceof Error ? error.message : 'Unknown error',
  };
}
```
- Result objects return `{ success: boolean, error?: string }` for graceful degradation
- Validation errors in types: `ValidationRule[]` with `errorMessage` field
- Route handlers return appropriate HTTP status codes and error shapes

## Logging

**Framework:** `console` (no logging library detected)

**Patterns:**
- Structured logging with context: `console.log('[Claude Client] DEBUG: Getting Anthropic client', { ... })`
- Prefix logs with module name in brackets: `[Claude Client]`, `[Agentic Loop]`, `[Tool Executor]`
- Debug logs for initialization and state changes
- Error logs with `console.error()` for exceptions
- Example from `claude-client.ts`:
```typescript
console.log('[Claude Client] DEBUG: Getting Anthropic client', {
  hasRawKey: !!rawApiKey,
  apiKeyLength: apiKey?.length || 0,
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

console.error('[Claude Client] FATAL: ANTHROPIC_API_KEY environment variable is not set');
```

## Comments

**When to Comment:**
- Explain "why" not "what" — code should be self-documenting
- Complex algorithms or non-obvious logic paths
- Constraints or requirements from specifications (reference FR-AC6 style)
- Edge cases and workarounds
- Example from `mary-persona.ts`:
```typescript
/**
 * The four coaching modes that operate in every session
 * FR-AC6: System shall implement four coaching modes
 */
export type SubPersonaMode = 'inquisitive' | 'devil_advocate' | 'encouraging' | 'realistic';
```

**JSDoc/TSDoc:**
- Required for exported functions and types
- Include parameter descriptions and return type
- Add examples for complex functions
- Format: Standard JSDoc with `/**` opening
```typescript
/**
 * Generate PDF buffer from Feature Brief
 * Server-side generation for API endpoints
 */
export async function generateFeatureBriefPDF(
  brief: FeatureBrief,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult>
```

## Function Design

**Size:**
- Keep functions < 50 lines where possible
- Classes like `SessionOrchestrator` can be larger (100+ lines) if cohesive
- Use helper functions to break down complex logic

**Parameters:**
- Max 3-4 parameters; use object/interface for more
- Example from `pdf-generator.ts`:
```typescript
export async function generateFeatureBriefPDF(
  brief: FeatureBrief,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult>
```
- Destructure options interface rather than spreading parameters

**Return Values:**
- Use `Result<T, E>` pattern for operations that can fail
- Return interfaces for complex objects: `PDFGenerationResult { success, buffer?, error? }`
- Async functions always return `Promise<T>`
- Use nullable returns sparingly; prefer empty collections or error objects

## Module Design

**Exports:**
- Named exports for functions and types (not default)
- Factory functions for creating instances: `createMarketPositioningAnalyzer()`
- Singleton instances exported as named constants: `export const maryPersona = MaryPersona.getInstance()`
- Example from `mary-persona.ts`:
```typescript
export const maryPersona = new MaryPersona();
export type SubPersonaMode = 'inquisitive' | 'devil_advocate' | ...;
export const PATHWAY_WEIGHTS: Record<string, PathwayWeights> = { ... };
```

**Barrel Files:**
- `index.ts` used to aggregate exports from sibling modules
- Example from `lib/ai/tools/index.ts`:
```typescript
export const MARY_TOOLS: Tool[] = [
  discoveryTools.discover_pathways,
  discoveryTools.discover_phase_actions,
  // ... other tools
];
```
- Single barrel file per directory, not nested

**File Organization:**
- One primary export per file (class, major function, or types group)
- Related utilities in same module (e.g., `session-orchestrator.ts` exports `SessionOrchestrator` + `SessionConfiguration`)
- Helper/internal functions stay in the same file unless used by 3+ consumers

## Async Patterns

**Async Functions:**
- Use `async/await` throughout (no `.then()` chains)
- Wrap in try-catch at call sites, not within helpers
- Mark functions as `async` when they use `await` internally
- Example from `session-orchestrator.ts`:
```typescript
async createSession(config: SessionConfiguration): Promise<BmadSession> {
  try {
    const userHasCredits = await hasCredits(config.userId, 1);
    if (!userHasCredits) {
      throw new BmadMethodError(...);
    }
    // ... more awaits
  } catch (error) {
    // handle
  }
}
```

**Streaming:**
- Use `AsyncIterable<string>` for streaming responses
- Example from `claude-client.ts`:
```typescript
export interface StreamingResponse {
  id: string;
  content: AsyncIterable<string>;
  usage?: TokenUsage;
}
```

## TypeScript Patterns

**Strict Mode:** Enabled (`"strict": true`)

**Type Safety:**
- Always type function parameters and return values
- Use `Record<string, Type>` for object maps
- Use `Array<T>` or `T[]` — both acceptable, use `T[]` for consistency
- Union types for variants: `'success' | 'error'` or `Literal | Literal`

**Generics:**
- Use for reusable data structures and functions
- Example from `session-orchestrator.ts`:
```typescript
private activeSessions = new Map<string, BmadSession>();
```

**Narrowing:**
- Use `instanceof` for error type checking
- Example from `pdf-generator.ts`:
```typescript
error: error instanceof Error ? error.message : 'Unknown error'
```

---

*Convention analysis: 2026-01-29*
