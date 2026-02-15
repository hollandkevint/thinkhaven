# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- Components: PascalCase (`BmadInterface.tsx`, `PathwaySelector.tsx`)
- Libraries/utilities: kebab-case (`claude-client.ts`, `workspace-context.ts`)
- Tests: Match source file name + `.test.ts` or `.test.tsx`
- Types: kebab-case for files (`types.ts`), PascalCase for interfaces/types

**Functions:**
- camelCase for all functions (`handlePathwaySelected`, `createSession`, `analyzeRevenueOptimization`)
- React components: PascalCase (`BmadInterface`, `ErrorBoundary`)
- Factory functions: `create` prefix (`createNewIdeaPathway`, `createServerClient`)

**Variables:**
- camelCase for all variables (`currentSession`, `mockElicitationData`, `isLoading`)
- SCREAMING_SNAKE_CASE for constants (`STRIPE_WEBHOOK_SECRET`, `NEW_IDEA_PHASES`)

**Types:**
- PascalCase for interfaces and types (`BmadTemplate`, `PathwayType`, `ElicitationConfig`)
- Enum values: SCREAMING_SNAKE_CASE (`PathwayType.NEW_IDEA`, `ElicitationType.NUMBERED_OPTIONS`)

## Code Style

**Formatting:**
- Tool: Prettier (inferred from code style, no `.prettierrc` present)
- Indent: 2 spaces
- Quotes: Single quotes for strings, double quotes for JSX attributes
- Semicolons: Present
- Trailing commas: Yes

**Linting:**
- Tool: ESLint
- Config: `eslint.config.mjs`
- Extends: `next/core-web-vitals`, `next/typescript`
- Ignores: `node_modules`, `.next`, `out`, `build`, `next-env.d.ts`

## Import Organization

**Order:**
1. External libraries (`react`, `@anthropic-ai/sdk`, `@supabase/ssr`)
2. Next.js specific (`next/navigation`, `next/headers`)
3. Absolute imports via path aliases (`@/lib/bmad/types`, `@/app/components/bmad/BmadInterface`)
4. Relative imports (`./PathwaySelector`, `../../lib/bmad/types`)

**Path Aliases:**
- `@/*` → Root of app (`apps/web`)
- `~/*` → Root of app (test alias)
- `@ideally/shared` → `packages/shared/index.ts`
- `@ideally/ui` → `packages/ui/index.ts`
- `@ideally/bmad-engine` → `packages/bmad-engine/index.ts`
- `@ideally/canvas-engine` → `packages/canvas-engine/index.ts`

## TypeScript Conventions

**Type Definitions:**
- Prefer interfaces for object shapes that may be extended
- Use type aliases for unions, intersections, mapped types
- Enum values use SCREAMING_SNAKE_CASE
- Export types from centralized type files (`lib/bmad/types.ts`, `lib/bmad/types/index.ts`)

**Type Safety:**
- `strict: true` in tsconfig
- No implicit any
- Use explicit return types for public APIs
- Type imports: `import type { CoachingContext } from '@/lib/ai/mary-persona'`

**Patterns:**
```typescript
// Barrel exports with both class and instance
export { PricingModelAnalyzer, pricingModelAnalyzer } from './pricing-model-analyzer';

// Optional parameters with defaults
export async function runGrowthStrategyPlanning(
  businessData: any,
  currentMetrics?: any,
  timeframe: '1-year' | '2-year' | '3-year' | '5-year' = '1-year',
  aggressiveness: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
)

// Const enums for runtime values
export enum PathwayType {
  NEW_IDEA = 'new-idea',
  BUSINESS_MODEL = 'business-model',
}
```

## Error Handling

**Patterns:**
- Try/catch blocks with `console.error()` for logging
- Error boundaries wrap React components
- Fallback UI for error states
- Graceful degradation (return partial results on non-critical failures)

**Example from `BmadInterface.tsx`:**
```typescript
try {
  await createSession(workspaceId, pathway, userInput, recommendation)
  setCurrentStep('session-active')
  generateMockElicitationData()

  if (onInputConsumed) {
    onInputConsumed()
  }
} catch (error) {
  console.error('Error creating session:', error)
  // Error handling is done in the hook
}
```

**Example from analysis engines:**
```typescript
if (!segment || !revenueStream) {
  throw new Error('Business data must include at least one customer segment and revenue stream');
}

// Handle partial failures gracefully
if (competitorData?.length > 0) {
  competitive = await competitivePricingAnalyzer.analyzeCompetitivePricing({...});
}
```

## React Patterns

**Component Structure:**
- Use `'use client'` directive for client components
- Functional components with hooks
- Props interfaces defined inline or imported
- State management: Local `useState`, global Zustand stores

**Hooks Usage:**
- Custom hooks prefixed with `use` (`useBmadSession`, `useCanvasSync`)
- `useCallback` for functions passed as props
- `useEffect` for side effects and lifecycle

**Component Patterns:**
```typescript
interface BmadInterfaceProps {
  workspaceId: string
  className?: string
  preservedInput?: string
  onInputConsumed?: () => void
}

export default function BmadInterface({
  workspaceId,
  className = '',
  preservedInput,
  onInputConsumed
}: BmadInterfaceProps) {
  // Component implementation
}
```

## State Management

**Local State:**
- `useState` for component-specific state
- `useRef` for mutable refs that don't trigger re-renders

**Global State:**
- Zustand stores (`dualPaneStore.ts`)
- Custom selectors exported (`useChatMessages`, `useCanvasElements`)

**Pattern:**
```typescript
export const useDualPaneStore = create<DualPaneState & DualPaneActions>((set, get) => ({
  // State and actions
}))

// Selector hooks
export const useChatMessages = () => useDualPaneStore(state => state.chat.messages)
```

## Logging

**Framework:** console (built-in)

**Patterns:**
- `console.error()` for errors in catch blocks
- `console.log()` for debugging (should be removed before commit)
- No structured logging library detected

## Comments

**When to Comment:**
- File-level JSDoc for module purpose
- Complex business logic requiring explanation
- TODOs for incomplete features

**JSDoc/TSDoc:**
- Used for public APIs and exported functions
- Inline comments for complex logic

**Example:**
```typescript
/**
 * BMad Analysis Engines - Consolidated Exports
 *
 * This file provides a single entry point for all BMad analysis engines,
 * making it easy to import and use the complete Monetization Strategy Engine suite.
 *
 * Usage:
 *   import { pricingModelAnalyzer, revenueOptimizationEngine } from '@/lib/bmad/analysis';
 */
```

## Function Design

**Size:**
- Keep functions focused and single-purpose
- Extract complex logic into helper functions
- Large components use helper functions for rendering subsections

**Parameters:**
- Use objects for functions with >3 parameters
- Optional parameters come last
- Provide defaults where appropriate

**Return Values:**
- Explicit return types for exported functions
- Use type inference for internal functions
- Return early for error conditions

**Example:**
```typescript
export async function runCompleteMonetizationAnalysis(
  businessData: any,
  competitorData?: any[],
  historicalData?: any[],
  clvData?: any,
  cacData?: any
) {
  const segment = businessData.customerSegments?.[0];
  const revenueStream = businessData.revenueStreams?.[0];

  if (!segment || !revenueStream) {
    throw new Error('Business data must include at least one customer segment and revenue stream');
  }

  // Implementation
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports (except for Next.js page components)
- Barrel exports in `index.ts` files
- Export both class and singleton instance for analysis engines

**Pattern:**
```typescript
// In pricing-model-analyzer.ts
export class PricingModelAnalyzer { /* ... */ }
export const pricingModelAnalyzer = new PricingModelAnalyzer();

// In index.ts
export { PricingModelAnalyzer, pricingModelAnalyzer } from './pricing-model-analyzer';
export type { PricingModelAnalysis, PricingModel } from './pricing-model-analyzer';
```

**Barrel Files:**
- Used extensively for re-exports (`lib/bmad/analysis/index.ts`)
- Group related types and implementations

## Async Patterns

**Promises:**
- Use `async/await` syntax (no raw `.then()` chains)
- Try/catch for error handling
- Parallel operations when independent

**Example:**
```typescript
const handlePathwaySelected = async (
  pathway: PathwayType,
  userInput?: string,
  recommendation?: {...}
) => {
  try {
    await createSession(workspaceId, pathway, userInput, recommendation)
    setCurrentStep('session-active')
    generateMockElicitationData()

    if (onInputConsumed) {
      onInputConsumed()
    }
  } catch (error) {
    console.error('Error creating session:', error)
  }
}
```

## Next.js Conventions

**File Structure:**
- App Router: `app/` directory
- API routes: `app/api/[route]/route.ts`
- Pages: `app/[route]/page.tsx`
- Layouts: `app/[route]/layout.tsx`

**Server vs Client:**
- Mark client components with `'use client'`
- Server components by default
- Middleware: `middleware.ts` at root

**Data Fetching:**
- Server components: Direct database access
- Client components: API routes via `fetch()`

---

*Convention analysis: 2026-02-14*
