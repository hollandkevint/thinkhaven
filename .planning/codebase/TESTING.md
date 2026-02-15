# Testing Patterns

**Analysis Date:** 2026-02-14

## Test Framework

**Runner:**
- Vitest 1.x
- Config: `apps/web/vitest.config.ts`

**Assertion Library:**
- Vitest built-in assertions (Jest-compatible)
- `@testing-library/jest-dom` for DOM assertions

**Run Commands:**
```bash
npm test              # Run all tests in watch mode
npm run test:run      # Run all tests once
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run Playwright with UI
```

**Coverage:**
```bash
vitest --coverage     # Generate coverage report
```

## Test File Organization

**Location:**
- Co-located: `lib/canvas/__tests__/visual-suggestion-parser.test.ts`
- Separate directory: `apps/web/__tests__/` for integration tests
- E2E tests: `apps/web/tests/e2e/` for Playwright specs
- Multiple test directories exist: `__tests__/` and `tests/` used interchangeably

**Naming:**
- Unit/integration tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Structure:**
```
apps/web/
├── __tests__/              # Integration tests
│   ├── bmad/
│   │   ├── analysis/
│   │   ├── generators/
│   │   └── pathways/
│   ├── demo/
│   ├── integration/
│   └── lib/
├── tests/                  # Component & E2E tests
│   ├── api/
│   ├── bmad/
│   ├── components/
│   ├── e2e/
│   ├── integration/
│   └── performance/
└── lib/                    # Co-located tests
    └── canvas/
        └── __tests__/
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Analysis Engine Integration', () => {
  let mockBusinessData: any;
  let mockCompetitorData: any[];

  beforeEach(() => {
    mockBusinessData = {
      sessionType: 'Business Model Analysis',
      customerSegments: [{...}],
      revenueStreams: [{...}]
    };

    mockCompetitorData = [{...}];
  });

  describe('runCompleteMonetizationAnalysis', () => {
    it('should execute full analysis pipeline successfully', async () => {
      const result = await runCompleteMonetizationAnalysis(
        mockBusinessData,
        mockCompetitorData
      );

      expect(result).toHaveProperty('pricing');
      expect(result).toHaveProperty('competitive');
      expect(result.summary.enginesExecuted).toBe(4);
    });

    it('should handle missing competitor data gracefully', async () => {
      const result = await runCompleteMonetizationAnalysis(mockBusinessData);

      expect(result.pricing).toBeDefined();
      expect(result.competitive).toBeUndefined();
      expect(result.summary.enginesExecuted).toBe(3);
    });
  });
});
```

**Patterns:**
- `describe` blocks for grouping related tests
- `it` for individual test cases
- `beforeEach` for test setup
- Nested `describe` blocks for sub-features

## Mocking

**Framework:** Vitest built-in mocking (`vi`)

**Patterns:**

**Mock modules:**
```typescript
import { vi } from 'vitest';

vi.mock('@/app/components/bmad/useBmadSession')
const mockUseBmadSession = useBmadSession as jest.MockedFunction<typeof useBmadSession>
```

**Mock components:**
```typescript
jest.mock('@/app/components/bmad/PathwaySelector', () => {
  return function MockPathwaySelector({ onPathwaySelected }: any) {
    return (
      <div data-testid="pathway-selector">
        <button onClick={() => onPathwaySelected('new-idea', 'test input')}>
          Select Pathway
        </button>
      </div>
    )
  }
})
```

**Mock Next.js:**
```typescript
// In tests/setup.ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}))
```

**Mock global objects:**
```typescript
// In tests/setup.ts
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  },
  writable: true
})
```

**What to Mock:**
- External dependencies (Supabase, Anthropic SDK)
- Next.js router and navigation
- Child components in component tests
- Browser APIs (`window`, `crypto`)

**What NOT to Mock:**
- Business logic under test
- Utility functions
- Type definitions

## Fixtures and Factories

**Test Data:**
```typescript
beforeEach(() => {
  mockBusinessData = {
    sessionType: 'Business Model Analysis',
    customerSegments: [{
      id: 'segment-1',
      name: 'Small Business',
      painPoints: ['High costs', 'Complex processes'],
      jobsToBeDone: ['Reduce overhead', 'Improve efficiency'],
      size: 10000
    }],
    revenueStreams: [{
      id: 'revenue-1',
      name: 'SaaS Subscription',
      description: 'Monthly software subscription',
      pricing: {
        amount: 99,
        currency: 'USD',
        frequency: 'monthly'
      },
      targetSegments: ['segment-1']
    }]
  };
});
```

**Factory patterns:**
```typescript
const defaultSessionHookReturn = {
  currentSession: null,
  isLoading: false,
  error: null,
  createSession: jest.fn(),
  advanceSession: jest.fn(),
  getSession: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  exitSession: jest.fn(),
}

mockUseBmadSession.mockReturnValue(defaultSessionHookReturn)
```

**Location:**
- Defined inline in test files (no separate fixtures directory detected)
- Reused via `beforeEach` blocks

## Coverage

**Requirements:** Not enforced (no coverage thresholds in vitest.config.ts)

**View Coverage:**
```bash
vitest --coverage
```

**Configuration:**
- Environment: `jsdom` for React component tests
- Globals: `true` (enables global test functions)
- CSS: `false` (CSS not processed in tests)

## Test Types

**Unit Tests:**
- Scope: Individual functions, classes, components
- Location: `__tests__/` directories, co-located tests
- Approach: Mock dependencies, test in isolation
- Example: `lib/canvas/__tests__/visual-suggestion-parser.test.ts`

**Integration Tests:**
- Scope: Multiple modules working together
- Location: `__tests__/integration/`, `tests/integration/`
- Approach: Minimal mocking, test real interactions
- Example: `__tests__/bmad/analysis/analysis-integration.test.ts`

**Component Tests:**
- Scope: React components with user interactions
- Location: `tests/components/`
- Framework: Vitest + React Testing Library
- Example: `tests/components/bmad/BmadInterface.test.tsx`

**E2E Tests:**
- Framework: Playwright
- Config: `apps/web/playwright.config.ts`
- Location: `tests/e2e/`
- Test directory: `./tests/e2e`
- File pattern: `**/*.spec.ts`
- Example: `tests/e2e/smoke/health.spec.ts`

**Playwright Configuration:**
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  testMatch: '**/*.spec.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

## Common Patterns

**Async Testing:**
```typescript
it('should execute full analysis pipeline successfully', async () => {
  const result = await runCompleteMonetizationAnalysis(
    mockBusinessData,
    mockCompetitorData
  );

  expect(result).toHaveProperty('pricing');
  expect(result.summary.enginesExecuted).toBe(4);
});
```

**Testing React Components:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

it('catches errors in PathwaySelector with error boundary', async () => {
  (window as any).__THROW_PATHWAY_ERROR__ = true

  render(<BmadInterface workspaceId="test-workspace" />)

  expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
  expect(screen.getByText('Try Again')).toBeInTheDocument()
})
```

**Error Testing:**
```typescript
it('should validate input requirements', async () => {
  const invalidBusinessData = {
    customerSegments: [],
    revenueStreams: []
  };

  await expect(runCompleteMonetizationAnalysis(invalidBusinessData))
    .rejects.toThrow('Business data must include at least one customer segment and revenue stream');
});
```

**Performance Testing:**
```typescript
it('should complete analysis within reasonable time limits', async () => {
  const startTime = Date.now();

  await runCompleteMonetizationAnalysis(
    mockBusinessData,
    mockCompetitorData
  );

  const executionTime = Date.now() - startTime;
  expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
});
```

**Testing with Arrays:**
```typescript
it('should prioritize by revenue potential', () => {
  const result = runQuickRevenueOptimization(mockBusinessData);

  if (result.implementationPriority.length > 1) {
    // Should be sorted by potential revenue (descending)
    for (let i = 1; i < result.implementationPriority.length; i++) {
      expect(result.implementationPriority[i-1].potentialRevenue || 0)
        .toBeGreaterThanOrEqual(result.implementationPriority[i].potentialRevenue || 0);
    }
  }
});
```

**Conditional Logic Testing:**
```typescript
it('should integrate data between engines', async () => {
  const result = await runCompleteMonetizationAnalysis(
    mockBusinessData,
    mockCompetitorData
  );

  // Competitive data should influence revenue optimization
  expect(result.revenue.optimizationOpportunities.some(opp =>
    opp.opportunityId?.includes('comp-') || opp.title?.includes('Competitive')
  )).toBe(true);
});
```

## Test Environment

**Setup File:** `apps/web/tests/setup.ts`

**Global Setup:**
- React made globally available
- Mock `window.crypto`
- Mock Next.js navigation
- Mock Next.js headers
- `@testing-library/jest-dom` imported

**Environment Variables:**
```typescript
// From vitest.config.ts
env: {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'test-client-id',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}
```

## Test Organization Principles

**Test Coverage:**
- 460+ test files across the project
- Heavy focus on business logic (bmad analysis engines)
- Component tests for critical UI paths
- Integration tests for multi-module workflows
- E2E tests for critical user flows

**Test Categories:**
- Business logic: Analysis engines, pathways, generators
- UI components: React components with error boundaries
- API integration: Supabase queries, authentication
- Performance: Load tests for large datasets
- Error scenarios: Graceful degradation, error boundaries

**Test File Patterns:**
```
__tests__/bmad/analysis/analysis-integration.test.ts  # Integration
tests/components/bmad/BmadInterface.test.tsx          # Component
tests/e2e/smoke/health.spec.ts                        # E2E
lib/canvas/__tests__/visual-suggestion-parser.test.ts # Co-located unit
```

## Known Gaps

**From TODO comments:**
- `revenue-optimization-engine.test.ts` - Tests for revenue optimization (TODO)
- `growth-strategy-engine.test.ts` - Tests for growth strategy planning (TODO)
- PNG metadata writing in `canvas-export.ts` (TODO: Implement PNG tEXt chunk writing)
- Additional test scenarios needed per `__tests__/bmad/analysis/README.md`

---

*Testing analysis: 2026-02-14*
