# Coding Conventions

**Analysis Date:** 2026-02-20

## Naming Patterns

**Files:**
- React page components: `page.tsx` (Next.js App Router convention)
- React layout components: `layout.tsx`
- React components: `PascalCase.tsx` (e.g., `StreamingMessage.tsx`, `ErrorBoundary.tsx`)
- Service/utility modules: `kebab-case.ts` (e.g., `session-primitives.ts`, `credit-manager.ts`, `rate-limiter.ts`)
- Type definition files: `kebab-case-types.ts` or `types.ts` (e.g., `board-types.ts`)
- API route files: `route.ts` (Next.js App Router convention)

**Functions:**
- Standalone utility functions: `camelCase` (e.g., `isAdminEmail`, `getPhaseOrder`, `calculateProgress`)
- Async service functions: `camelCase` with descriptive verb-noun pattern (e.g., `createSessionRecord`, `getCreditBalance`, `loadSessionState`)
- React components: `PascalCase` (e.g., `DashboardSkeleton`, `StreamingText`, `ErrorBoundary`)
- Class methods: `camelCase` (e.g., `checkRateLimit`, `getInstance`, `captureError`)

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants (e.g., `MAX_TOOL_ROUNDS`, `PHASE_ORDER`, `MARY_TOOLS`, `ADMIN_EMAILS`)
- Local variables: `camelCase`
- Object property keys: `camelCase` in TypeScript interfaces/types; `snake_case` when mirroring database column names

**Types:**
- Interfaces: `PascalCase` with descriptive noun (e.g., `SessionRecord`, `CreditBalance`, `BoardMember`, `RateLimitConfig`)
- Type aliases: `PascalCase` (e.g., `BoardMemberId`, `PathwayType`, `ToolName`, `Disposition`)
- Union string literals used for enums (e.g., `'mary' | 'victoria' | 'casey'`)
- `as const` used on objects for readonly literal types (e.g., `TOOL_NAMES`)

## Code Style

**Formatting:**
- No Prettier config detected — formatting is enforced via ESLint only
- Semicolons: inconsistent. API route files use semicolons; component files often omit them (both patterns exist)
- Quotes: single quotes in most files; follow the pattern of the file you're editing
- Trailing commas: present in most multi-line structures

**Linting:**
- ESLint flat config at `apps/web/eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`
- 714 pre-existing violations (341 errors, 373 warnings) — do not add new violations
- TypeScript strict mode: app code compiles clean; test files have known errors

## Import Organization

**Pattern in component files (no enforced order, observed convention):**
1. React and Next.js framework imports (`'react'`, `'next/navigation'`, `'next/server'`)
2. Internal `@/lib/*` imports (auth, supabase, AI, business logic)
3. Internal `@/components/*` or `@/app/components/*` imports
4. Named imports grouped by source

**Path Aliases:**
- `@/` resolves to `apps/web/` (configured in `tsconfig.json` and `vitest.config.ts`)
- `~/` also resolves to `apps/web/` (Vitest alias, mirrors `@/`)
- Prefer `@/` in all source code

**Import style:**
- Use `import type` for type-only imports (e.g., `import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages'`)
- Named exports preferred over default exports in lib modules
- Default exports used for React page/component files (Next.js convention)

## React / Next.js Patterns

**Client vs Server Components:**
- `'use client'` directive at top of file — 90+ client component files
- No `'use server'` directives — server-side logic lives in API routes (`app/api/`) and lib modules
- Middleware is disabled (`middleware.ts.disabled`) — auth handled exclusively via API routes

**Null safety for Supabase:**
- `createClient()` (from `lib/supabase/server.ts`) returns `null` when env vars are missing
- All callers must null-check before using the client
- Pattern: `const supabase = await createClient(); if (!supabase) return ...`

**State management:**
- Zustand for complex client state (dependency present: `zustand ^5.0.8`)
- React `useState`/`useRef`/`useCallback`/`useMemo` for component-local state
- `useRef` for mutable values that should not trigger re-renders (stale closure prevention)

## Error Handling

**API Routes:**
- Return `NextResponse.json({ error: '...' }, { status: NNN })` for HTTP errors
- Log errors with `console.error('[Component/Module] message:', error)` before returning
- Prefix console logs with bracketed context tag (e.g., `[Claude Client]`, `PGRST205 Schema Error:`)

**Service layer (`lib/`):**
- Functions return structured result objects with `{ success: boolean, error?: string }` pattern
- Supabase errors surfaced via `{ data, error }` destructuring; check `error` before using `data`
- Throw `new Error('descriptive message')` for unrecoverable conditions; callers expected to catch
- `BmadMethodError` custom error type used in `lib/bmad/` for domain-specific failures

**UI Layer:**
- `ErrorBoundary` class component in `app/components/ui/ErrorBoundary.tsx` wraps subtrees
- Retry logic built into `ErrorBoundary` (max 3 retries)
- Development-only error stack traces shown via `process.env.NODE_ENV === 'development'`
- Database errors (`PGRST*`) and network errors detected and shown with tailored messages

## Logging

**Framework:** `console.*` — no structured logging library

**Patterns:**
- `console.error('Label:', errorObj)` for errors (lib and API routes)
- `console.warn('Label:', context)` for recoverable degradation
- `console.log('[Module] message', { debugObject })` for debug info in development
- Prefixed labels used consistently in AI/client code: `[Claude Client]`, `[BMad]`
- `console.error` in `componentDidCatch` for React error boundaries
- Production logging via `ErrorMonitor` singleton (`lib/bmad/error-monitor.ts`) which wraps console and can forward to external services

## Comments

**When to Comment:**
- File-level JSDoc block at top of lib modules describing purpose and phase (e.g., "Phase 4 of Agent-Native Evolution")
- Section dividers using `// =============================================================================` for large files with multiple logical sections
- Inline comments explaining non-obvious behavior (e.g., `// Return null during build when env vars not available`)
- `/** JSDoc */` on exported functions in service modules

**JSDoc/TSDoc:**
- Used on exported functions in `lib/` modules
- Describes purpose, not just parameter types
- Example from `lib/bmad/session-primitives.ts`:
  ```typescript
  /**
   * Create a new session record in the database.
   * This is an atomic operation that does NOT bundle credit checks or template loading.
   */
  export async function createSessionRecord(
  ```

## Function Design

**Size:** Functions kept small and focused; large orchestration functions broken into private helpers

**Parameters:** Prefer a single options object for functions with 3+ parameters (e.g., `CreateSessionOptions` interface)

**Return Values:**
- Async functions return `Promise<ResultType | null>` or structured `{ success, data?, error? }` objects
- Never return raw thrown errors from service functions — catch and return error objects
- `null` returned when record not found or env vars missing (not thrown)

## Module Design

**Exports:**
- Named exports for all lib utilities (no default exports in `lib/`)
- Default export for React components (Next.js page convention)
- Constants exported as `const` objects with `as const` for type narrowing

**Barrel Files:**
- Used selectively: `lib/ai/tools/index.ts`, `lib/bmad/analysis/index.ts`, `lib/artifact/index.ts`
- Not used universally — most modules imported directly by path
- `TOOL_NAMES` constant + `ToolName` type pattern (object with `as const` + `typeof` extraction)

## TypeScript Patterns

**Interfaces vs Types:**
- `interface` for object shapes (especially exported public API shapes)
- `type` for union types, string literal unions, and derived types
- `readonly` modifier on interface fields that should not be mutated (e.g., `BoardMember`)

**`any` usage:**
- Avoided in lib code; used in test mocks where types are complex (e.g., `({ messageId, onBookmark, onCreateBranch }: any)`)
- `Record<string, unknown>` preferred over `Record<string, any>` in production code

---

*Convention analysis: 2026-02-20*
