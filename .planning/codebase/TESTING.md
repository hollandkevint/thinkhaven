# Testing Patterns

**Analysis Date:** 2026-02-20

## Test Framework

**Unit/Integration Runner:**
- Vitest `^3.2.4`
- Config: `apps/web/vitest.config.ts`
- Environment: jsdom (browser-like DOM simulation)
- Globals enabled (`globals: true`) — no need to import `describe`/`it`/`expect` in test files

**E2E Runner:**
- Playwright `^1.55.0`
- Config: `apps/web/playwright.config.ts` (local dev) and `apps/web/playwright.prod.config.ts` (production)

**Assertion Library:**
- Vitest built-in assertions (`expect`)
- `@testing-library/jest-dom ^6.8.0` — DOM matchers (`.toBeInTheDocument()`, `.toHaveClass()`, `.toHaveAttribute()`, etc.)

**Component Testing:**
- `@testing-library/react ^16.3.0`
- `render`, `screen`, `fireEvent`, `waitFor`, `act` from `@testing-library/react`

**Run Commands:**
```bash
# From apps/web/
npm test                  # Unit tests (Vitest, watch mode)
npm run test:run          # Unit tests (single run, CI-safe)
npm run test:e2e          # All E2E tests (requires local dev server)
npm run test:smoke        # E2E smoke tests only (tests/e2e/smoke/)
npm run test:prod         # Smoke tests against https://thinkhaven.co (no local server)
```

## Test File Organization

**Two separate test roots exist:**

1. `apps/web/tests/` — primary test location (58 files)
   - `tests/setup.ts` — global Vitest setup file
   - `tests/config/global-setup.ts` — Playwright global setup
   - `tests/helpers/routes.ts` — shared route constants for E2E tests
   - `tests/utils/` — test utilities and metadata helpers
   - `tests/e2e/smoke/` — Playwright smoke specs

2. `apps/web/__tests__/` — secondary location (12+ files, older analysis tests)
   - `__tests__/bmad/analysis/` — analysis engine tests
   - `__tests__/lib/` — lib unit tests
   - `__tests__/integration/` — integration tests

**Subdirectory structure in `tests/`:**
```
tests/
├── setup.ts                          # Vitest global setup
├── config/
│   ├── global-setup.ts               # Playwright server readiness check
│   └── test-env.ts
├── helpers/
│   └── routes.ts                     # Route constants (ROUTES, PUBLIC_ROUTES, etc.)
├── utils/
│   ├── results-aggregator.ts
│   └── test-metadata.ts
├── e2e/
│   └── smoke/
│       ├── health.spec.ts            # 7 public route smoke tests (CI passing)
│       ├── auth-session.spec.ts      # Full login+session flow (requires TEST_ADMIN_*)
│       └── beta-checklist.spec.ts    # Production verification tests
├── bmad/                             # BMad-specific feature tests
├── components/                       # Component render tests
│   ├── auth/
│   ├── bmad/
│   ├── chat/
│   └── ui/
├── integration/                      # Integration tests (mock Supabase)
├── lib/                              # lib module unit tests
│   ├── auth/
│   └── bmad/
├── canvas/                           # Canvas-specific tests
├── coaching-effectiveness.test.ts
└── error-scenarios/
```

**Naming:**
- Unit/integration test files: `*.test.ts` or `*.test.tsx`
- E2E Playwright files: `*.spec.ts`
- Vitest picks up `*.test.{ts,tsx}`; Playwright picks up `*.spec.ts` (separated by config `testMatch`)

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [behavior] when [condition]', () => {
      // arrange
      // act
      // assert
    })
  })
})
```

**Patterns:**
- Nested `describe` blocks for grouping related behavior (feature → scenario → case)
- `beforeEach(() => { vi.clearAllMocks() })` — standard reset before each test
- `afterEach(() => { vi.restoreAllMocks() })` — restore spied functions after each test
- `it` used (not `test`) in most files — both are valid in Vitest

**Component test structure:**
```typescript
describe('ComponentName', () => {
  const defaultProps = { /* ... */ }

  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn() // DOM method stubbing
  })

  describe('Basic Rendering', () => {
    it('should render X correctly', () => {
      render(<Component {...defaultProps} />)
      expect(screen.getByText('...')).toBeInTheDocument()
    })
  })

  describe('Behavior Group', () => {
    it('should handle Y', async () => {
      render(<Component {...defaultProps} onEvent={vi.fn()} />)
      fireEvent.click(screen.getByTestId('btn'))
      await waitFor(() => expect(mockFn).toHaveBeenCalled())
    })
  })
})
```

## Mocking

**Framework:** Vitest (`vi`)

**Module mocking — Supabase (most common pattern):**
```typescript
const mockSupabaseClient = {
  from: vi.fn(),
  auth: { getUser: vi.fn() }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}))

// In test: configure return values per test
mockSupabaseClient.from.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
    })
  })
})
```

**Module mocking — Next.js (in `tests/setup.ts`, applied globally):**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn() }),
}))
```

**Component dependency mocking:**
```typescript
vi.mock('@/app/components/chat/MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  )
}))
```

**Spy pattern for console:**
```typescript
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
// ... test ...
consoleSpy.mockRestore()
```

**What to mock:**
- `@/lib/supabase/server` — always mock; real DB not available in unit tests
- `@/lib/supabase/client` — mock when testing components that call it
- `next/navigation` — mocked globally in `tests/setup.ts`
- `next/headers` — mocked globally in `tests/setup.ts`
- Child components — mock with `data-testid` stubs when testing parent behavior in isolation
- `@anthropic-ai/sdk` — mock in integration tests that don't need real AI responses

**What NOT to mock:**
- Pure utility functions (e.g., `getPhaseOrder`, `calculateProgress`) — test them directly
- `lib/bmad/session-primitives.ts` pure functions — tested without mocking the functions themselves
- Component logic that is the actual subject of the test

## Fixtures and Factories

**Test Data — inline objects (no shared factory files):**
```typescript
const mockCoachingContext: CoachingContext = {
  userProfile: {
    experienceLevel: 'intermediate',
    industry: 'technology',
    role: 'product_manager'
  },
  currentBmadSession: {
    sessionId: 'session-123',
    pathway: 'strategic_analysis',
    phase: 'diagnosis'
  },
  previousInsights: [
    { insight: 'Market opportunity identified', confidence: 0.8 }
  ]
}

const defaultProps = {
  id: 'msg-123',
  role: 'assistant' as const,
  content: 'This is a test message',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  onBookmark: vi.fn(),
  onCreateBranch: vi.fn()
}
```

**Location:** Fixtures defined at the top of each test file — no shared fixtures directory.

**Supabase mock IDs:** Use readable IDs like `'test-user-123'`, `'session-123'`, `'workspace-123'` rather than UUIDs.

## Coverage

**Requirements:** No coverage thresholds enforced (no `coverage` config in `vitest.config.ts`)

**Known test state:**
- 45 of 71 unit test files fail — pre-existing failures, not regressions
- `tests/lib/bmad/` (mary-persona group): 67/67 tests pass
- `__tests__/` directory has additional passing tests for analysis engines

**View Coverage:**
```bash
# No coverage script configured — run manually
npx vitest run --coverage
```

## Test Types

**Unit Tests (`*.test.ts`):**
- Pure functions tested directly (phase order, credit calculations, progress calculations)
- Classes tested with mocked dependencies
- Located in `tests/lib/`, `tests/components/`, `__tests__/lib/`

**Integration Tests (`*.test.ts` in `tests/integration/`):**
- Test service interactions with mocked Supabase
- Verify error handling scenarios (PGRST205, auth failures, schema mismatches)
- Test database query patterns by configuring mock return values
- No real network calls or database connections

**E2E Tests (`*.spec.ts` in `tests/e2e/smoke/`):**
- `health.spec.ts` — 7 public route smoke tests, loops over `PUBLIC_ROUTES` array
- `beta-checklist.spec.ts` — 9 production verification tests (forms, redirects, mobile viewports)
- `auth-session.spec.ts` — full authenticated flow (skipped when `TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD` not set)

## Common Patterns

**Async Testing:**
```typescript
it('should resolve async operation', async () => {
  const result = await someAsyncFunction('input')
  expect(result).toBe('expected')
})

// React state update
await waitFor(() => {
  expect(onComplete).toHaveBeenCalled()
})
```

**Error Testing:**
```typescript
it('should handle missing field gracefully', () => {
  const error = { message: errorObj.message || 'Unknown error occurred' }
  expect(error.message).toBe('Unknown error occurred')
})

// Testing console.error is called
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
// ... action ...
expect(consoleSpy).toHaveBeenCalledWith('Label:', expectedObject)
consoleSpy.mockRestore()
```

**Testing type safety (export existence checks):**
```typescript
it('should export required functions', async () => {
  const { createSessionRecord, loadSessionState } =
    await import('@/lib/bmad/session-primitives')
  expect(typeof createSessionRecord).toBe('function')
  expect(typeof loadSessionState).toBe('function')
})
```

**E2E Route Constants:**
Use `ROUTES` and `PUBLIC_ROUTES` from `tests/helpers/routes.ts` instead of hardcoded strings:
```typescript
import { PUBLIC_ROUTES, ROUTES, ROUTE_PATTERNS } from '../../helpers/routes'

await page.goto(ROUTES.login)
await page.waitForURL(ROUTE_PATTERNS.appSession, { timeout: 30000 })
```

**Playwright selector priority:**
- `page.getByRole('button', { name: /text/i })` — preferred (accessible)
- `page.locator('button', { hasText: 'Text' })` — for partial text matches
- `page.locator('[data-testid="..."]')` — for test-specific hooks
- CSS class selectors (`.flex.justify-start`) — used sparingly, fragile

**E2E test skip pattern:**
```typescript
test.skip(!EMAIL || !PASSWORD, 'TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars required')
```

## Global Test Setup

**Vitest setup (`tests/setup.ts`):**
- Imports `@testing-library/jest-dom` for DOM matchers
- Sets `global.React = React`
- Stubs `window.crypto.randomUUID`
- Mocks `next/navigation` and `next/headers` globally

**Playwright global setup (`tests/config/global-setup.ts`):**
- Loads `.env.test` then `.env.local` (later overrides earlier)
- Validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Polls `/login` up to 30 seconds waiting for dev server readiness
- Fails fast (`process.exit(1)`) on missing env or server unavailable

**Production E2E (`playwright.prod.config.ts`):**
- No `globalSetup`, no `webServer` block
- `baseURL: 'https://thinkhaven.co'`
- Run with `npm run test:prod`

---

*Testing analysis: 2026-02-20*
