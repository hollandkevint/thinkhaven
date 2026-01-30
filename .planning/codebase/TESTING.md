# Testing Patterns

**Analysis Date:** 2026-01-29

## Test Framework

**Runner:**
- Vitest 3.2.4 (unit tests)
- Playwright 1.55.0 (E2E tests)
- Config: `apps/web/vitest.config.ts` and `apps/web/playwright.config.ts`

**Assertion Library:**
- Vitest's built-in expect API (Jest-compatible)
- `@testing-library/react` for component testing
- `@testing-library/jest-dom` for extended matchers (e.g., `toBeVisible()`)

**Run Commands:**
```bash
npm test              # Run unit tests in watch mode
npm run test:run      # Run unit tests once (CI mode)
npm run test:e2e      # Run E2E tests (Playwright)
npm run test:e2e:ui   # Run E2E tests with Playwright UI
npm run test:smoke    # Run smoke tests only
npm run test:drift    # Analyze test drift from codebase changes
```

## Test File Organization

**Location:**
- Unit tests (Vitest): Co-located with source code or in `tests/` directory
- E2E tests (Playwright): `tests/e2e/` directory
- Smoke tests: `tests/e2e/smoke/`
- Setup files: `tests/setup.ts` and `tests/config/`

**Naming:**
- Unit tests: `filename.test.ts` or `filename.test.tsx` (Vitest looks for `**/*.test.{ts,tsx}`)
- E2E tests: `filename.spec.ts` (Playwright looks for `**/*.spec.ts`)
- Test suites in `tests/lib/`, `tests/components/`, `tests/integration/` mirror source structure

**Structure:**
```
tests/
├── setup.ts                          # Global test setup
├── config/
│   ├── test-env.ts                   # Test environment variables
│   └── global-setup.ts               # Playwright global setup
├── e2e/
│   ├── smoke/
│   │   └── health.spec.ts            # Public route smoke tests
│   └── helpers/
│       ├── selectors.ts              # Centralized UI selectors
│       └── routes.ts                 # Route constants
├── lib/
│   ├── ai/
│   │   └── mary-persona.test.ts      # Persona logic tests
│   └── ...
├── components/
│   ├── bmad/
│   │   ├── BmadInterface.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   └── LoadingIndicator.test.tsx
│   └── chat/
│       └── StreamingMessage.test.tsx
├── integration/
│   ├── new-idea-pathway.test.ts
│   ├── conversation-flow.test.ts
│   ├── workspace-database.test.ts
│   └── ...
└── utils/
    ├── results-aggregator.ts
    └── test-metadata.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MaryPersona', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MaryPersona.getInstance();
      const instance2 = MaryPersona.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate basic system prompt without context', () => {
      const prompt = maryPersona.generateSystemPrompt();
      expect(prompt).toContain('Mary');
      expect(prompt).toContain('AI Business Strategist');
    });
  });
});
```

**Patterns:**
- Use `describe()` blocks to group related tests by feature/method
- Use nested `describe()` for logical organization (e.g., method name → behavior)
- Each `it()` tests one specific behavior
- Use `beforeEach()` for setup, `afterEach()` for cleanup
- Clear test names that read like documentation: `should return singleton instance`

## Mocking

**Framework:** Vitest's `vi` module (Jest-compatible)

**Patterns:**
```typescript
// Mock modules
vi.mock('@/lib/bmad/database', () => ({
  BmadDatabase: {
    createSession: vi.fn().mockResolvedValue('test-session-id'),
    getSession: vi.fn(),
    updateSessionProgress: vi.fn(),
  }
}));

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock headers/cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

// In tests, spy or mock specific functions
const mockFunction = vi.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockResolvedValue(Promise.resolve('async-value'));
mockFunction.mockImplementation((arg) => arg * 2);
```

**What to Mock:**
- External APIs (Supabase, Anthropic, Stripe)
- Next.js router and navigation hooks
- Database operations (use fixtures for data)
- Large dependencies that are already tested elsewhere
- Environment-dependent code

**What NOT to Mock:**
- Utility functions you're testing
- Calculation/transformation logic
- Error handling paths (test real errors)
- Type definitions or enums
- Simple helper functions

## Fixtures and Factories

**Test Data:**
```typescript
const mockSessionConfig = {
  userId: 'test-user-id',
  workspaceId: 'test-workspace-id',
  pathway: PathwayType.NEW_IDEA
};

const beginnerContext: CoachingContext = {
  userProfile: { experienceLevel: 'beginner' },
};

const defaultSessionHookReturn = {
  currentSession: null,
  isLoading: false,
  error: null,
  createSession: vi.fn(),
  advanceSession: vi.fn(),
  getSession: vi.fn(),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  exitSession: vi.fn(),
};
```

**Location:**
- Inline in test files for simple data
- Shared in `tests/utils/` or `tests/fixtures/` for complex/reused data
- Use `beforeEach()` to reset factory instances between tests

**Factories:**
```typescript
// Use functions to generate repeatable test objects
function createSessionConfig(overrides?: Partial<SessionConfiguration>): SessionConfiguration {
  return {
    userId: 'test-user-id',
    workspaceId: 'test-workspace-id',
    pathway: PathwayType.NEW_IDEA,
    ...overrides,
  };
}
```

## Coverage

**Requirements:** Not enforced (no coverage thresholds in config)

**View Coverage:**
```bash
# Vitest doesn't have built-in coverage command in this config
# To add coverage, install: npm install -D vitest @vitest/coverage-v8
# Then run: npm test -- --coverage
```

**Current State:**
- 67 unit tests for `mary-persona.ts` (comprehensive persona logic coverage)
- Component error boundary tests (`BmadInterface.test.tsx`, `ErrorBoundary.test.tsx`)
- Integration tests for pathways and API endpoints
- 7 E2E smoke tests for public routes
- No strict coverage gates, but critical business logic has tests

## Test Types

**Unit Tests:**
- Scope: Single function or method in isolation
- Approach: Vitest with mocked dependencies
- Location: `tests/lib/`, `tests/utils/`, `tests/components/`
- Example: `mary-persona.test.ts` tests persona methods with mocked pathway data
```typescript
it('should adapt persona based on user experience level', () => {
  const beginnerContext: CoachingContext = {
    userProfile: { experienceLevel: 'beginner' },
  };
  const beginnerPrompt = maryPersona.generateSystemPrompt(beginnerContext);
  expect(beginnerPrompt).toContain('confidence');
});
```

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Vitest with mocked external services (DB, APIs)
- Location: `tests/integration/`
- Example: `new-idea-pathway.test.ts` tests session creation → template loading → phase advancement
```typescript
describe('New Idea Pathway Integration', () => {
  const mockSessionConfig = {
    userId: 'test-user-id',
    workspaceId: 'test-workspace-id',
    pathway: PathwayType.NEW_IDEA
  };

  // Mocks for database and router
  // Tests flow: sessionOrchestrator.createSession() → template engine → phase manager
});
```

**E2E Tests:**
- Scope: Full user workflows from browser
- Approach: Playwright with real running app
- Location: `tests/e2e/smoke/` and other subdirs
- Example: `health.spec.ts` verifies public routes render
```typescript
test.describe('Smoke Tests - Public Routes Render', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} page (${route.path}) renders`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
```

## Common Patterns

**Async Testing (Vitest):**
```typescript
it('should create a session successfully', async () => {
  const session = await sessionOrchestrator.createSession(mockSessionConfig);
  expect(session).toBeDefined();
  expect(session.id).toBeTruthy();
});

// Or with waitFor
await expect(async () => {
  const result = await someAsyncOperation();
  expect(result).toEqual(expected);
}).resolves.not.toThrow();
```

**Error Testing:**
```typescript
it('should throw BmadMethodError when insufficient credits', async () => {
  vi.mocked(hasCredits).mockResolvedValue(false);

  await expect(
    sessionOrchestrator.createSession(mockSessionConfig)
  ).rejects.toThrow(BmadMethodError);
});
```

**Component Testing (React + Testing Library):**
```typescript
it('catches errors in PathwaySelector with error boundary', async () => {
  (window as any).__THROW_PATHWAY_ERROR__ = true;

  render(<BmadInterface workspaceId="test-workspace" />);

  await expect(
    screen.findByText(/something went wrong/i)
  ).resolves.toBeInTheDocument();
});
```

**E2E Testing (Playwright):**
```typescript
test('navigate to landing page and verify content', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBeLessThan(400);

  await expect(page.locator('h1')).toContainText('ThinkHaven');

  const button = page.locator('button:has-text("Get Started")');
  await expect(button).toBeVisible();
});
```

## Playwright Configuration

**Config File:** `apps/web/playwright.config.ts`

**Key Settings:**
- `testDir`: `./tests/e2e` (only searches E2E tests)
- `testMatch`: `**/*.spec.ts` (E2E convention)
- `baseURL`: `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- `fullyParallel`: `true` (tests run in parallel)
- `forbidOnly`: Enabled in CI (prevents `.only` tests from running)
- `retries`: 2 in CI, 0 locally
- `workers`: 1 in CI, unlimited locally
- `trace`: `'on-first-retry'` (capture trace on failures)
- `screenshot`: `'only-on-failure'` (visual debugging)
- `video`: `'off'` (disabled by default)

**Projects:**
- `chromium` (Desktop Chrome)
- `Mobile Chrome` (Pixel 5 emulation)

**Web Server:**
- Runs `npm run dev` automatically
- Reuses existing server if already running
- Timeout: 120 seconds

## Vitest Configuration

**Config File:** `apps/web/vitest.config.ts`

**Key Settings:**
- `environment`: `jsdom` (browser-like environment)
- `setupFiles`: `['./tests/setup.ts']` (runs before all tests)
- `include`: `['**/*.test.{ts,tsx}']`
- `globals`: `true` (vi is available without import)
- `css`: `false` (CSS modules not tested)

**Setup File (`tests/setup.ts`):**
```typescript
import '@testing-library/jest-dom'  // Extended matchers
import React from 'react'

global.React = React  // Make React globally available

// Mock window.crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  },
  writable: true
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn() }),
}))
```

## Current Test State

**Unit Tests:**
- `tests/lib/ai/mary-persona.test.ts` - 67 tests for persona logic (comprehensive)
- `tests/components/bmad/` - Error boundary and loading indicator tests
- `tests/components/chat/StreamingMessage.test.tsx` - Streaming UI tests
- `tests/canvas/` - Canvas export and context sync tests
- Other scattered component and integration tests

**E2E Tests:**
- `tests/e2e/smoke/health.spec.ts` - 7 public route smoke tests (all passing)
- Smoke tests verify: `/`, `/login`, `/signup`, `/try`, `/assessment`, `/demo`, `/resend-confirmation`

**CI Status:** All E2E tests passing in GitHub Actions

**Coverage Gaps:**
- API endpoint integration tests (partially covered)
- Chat/streaming flow tests (limited)
- Canvas workspace E2E tests (not implemented)
- Error scenario tests (some component tests exist)

## Best Practices

**Do:**
- Name tests as complete sentences: `should create session when user has sufficient credits`
- Use `beforeEach()` to reset mocks and state
- Keep tests focused on one behavior per test
- Use descriptive variable names in test data
- Group related tests in nested `describe()` blocks
- Mock external dependencies, not internal logic

**Don't:**
- Use `.only` or `.skip` in committed code
- Test implementation details (how it works), test behavior (what happens)
- Create interdependent tests that require execution order
- Mock code you're trying to test
- Use generic variable names like `result`, `data`, `output`

---

*Testing analysis: 2026-01-29*
