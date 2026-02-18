---
title: "Dashboard Crash & E2E Auth Test Failures: Interface Mismatch and Hydration-Unaware Selectors"
date: 2026-02-18
category: runtime-errors
tags: [typescript-interface, supabase-schema, playwright-selectors, react-hydration, e2e-testing]
severity: high
component: dashboard, auth-flow, e2e-tests
resolution_time: ~2 hours
root_cause: "TypeScript interface field name (session_type) didn't match Supabase column name (pathway); Playwright test used anchor selectors for button components and lacked hydration wait points"
---

# Dashboard Crash & E2E Auth Test Failures

Running an authenticated E2E test against production exposed two intertwined problems: a dashboard crash from a TypeScript interface/DB schema mismatch, and brittle Playwright selectors that failed due to wrong element types and missing hydration waits.

## Problem Symptoms

| # | Symptom | Location |
|---|---------|----------|
| 1 | "Application error: a client-side exception has occurred" on `/app` dashboard | `app/app/page.tsx:394` |
| 2 | "New Session button not found" in E2E test | `tests/e2e/smoke/auth-session.spec.ts` |
| 3 | "No chat input found on Mary Chat tab" in E2E test | `tests/e2e/smoke/auth-session.spec.ts` |

## Root Cause Analysis

### Problem 1: Dashboard Crash

The `BmadSession` TypeScript interface in `app/app/page.tsx` defined `session_type: string`, but the actual Supabase `bmad_sessions` table uses a column called `pathway`. The Supabase query `SELECT *` returned rows with `pathway` but no `session_type` field. At line 394, calling `session.session_type.replace(/-/g, ' ')` threw because `session_type` was `undefined`.

This is a classic interface drift problem: the interface was written by hand and never updated when the DB column was renamed (or was written with the wrong name from the start).

### Problem 2: E2E Test Failures

Three distinct issues:

1. **Wrong element selector** -- The test used `a[href*="/app/new"]` to find the "New Session" button, but the actual element is a `<Button>` component with `onClick={handleNewSession}`, not an anchor tag. No `href` exists on the element.

2. **Soft-fail patterns** -- Generic multi-selectors like `textarea, input[type="text"]` with `catch(() => false)` swallowed real errors. The test appeared to pass steps when they actually failed silently.

3. **Hydration timing** -- The test interacted with elements before React hydration completed. `page.textContent('body')` returned Next.js hydration scripts, not rendered content. `waitForLoadState('networkidle')` doesn't guarantee React has finished mounting.

## Solution

### Fix 1: Schema Alignment in Dashboard

**File:** `apps/web/app/app/page.tsx`

```typescript
// Before
interface BmadSession {
  id: string;
  user_id: string;
  session_type: string;  // Wrong column name
  current_step: string;
  session_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Line 394
<span className="capitalize">{session.session_type.replace(/-/g, ' ')}</span>
```

```typescript
// After
interface BmadSession {
  id: string;
  user_id: string;
  pathway: string;  // Matches DB column
  current_step: string;
  session_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Line 394 -- with fallback for null safety
<span className="capitalize">{(session.pathway || 'session').replace(/-/g, ' ')}</span>
```

### Fix 2: E2E Test Rewrite

**File:** `apps/web/tests/e2e/smoke/auth-session.spec.ts`

**Correct element selectors:**

```typescript
// Before: Wrong element type (anchor selector)
const newSessionBtn = page.locator('a[href*="/app/new"]').first();

// After: Role-based selector matching actual Button component
const newSessionBtn = page.getByRole('button', { name: /new session/i }).first();
await expect(newSessionBtn).toBeVisible({ timeout: 10000 });
```

**Hydration-aware waits:**

```typescript
// Before: Generic multi-selector with soft-fail
const chatInput = await page.locator('textarea, input[type="text"]').first();
// ... catch(() => false)

// After: Wait for React-rendered element as hydration proof
const maryChatTab = page.locator('button', { hasText: 'Mary Chat' }).first();
await expect(maryChatTab).toBeVisible({ timeout: 15000 }); // Proves hydration
await maryChatTab.click();

const chatInput = page.locator('textarea[placeholder*="strategic question"]');
await expect(chatInput).toBeVisible({ timeout: 10000 });
```

**Hard assertions for response validation:**

```typescript
// Before: Soft-fail with generic selector
const assistantMsg = await page.locator('.message-bubble').first().catch(() => null);

// After: Specific selector with hard assertion
const assistantMessage = page.locator('.flex.justify-start .rounded-xl').last();
await expect(assistantMessage).toBeVisible({ timeout: 30000 });
```

## Verification

- Dashboard loads without errors on production
- All 16 production tests pass (15 public + 1 authenticated)
- Full authenticated E2E flow completes: login, dashboard, new session, Mary Chat, send message, receive streamed AI response, no message limits

## Prevention Strategies

### Type Safety: Stop Interface Drift

1. **Generate types from Supabase schema** instead of hand-writing interfaces. Run `supabase gen types typescript --linked` in CI to auto-generate types after every migration. Store in `lib/database.types.ts`.

2. **Derive domain types from generated types** rather than defining them independently:
   ```typescript
   type BmadSession = Database['public']['Tables']['bmad_sessions']['Row'];
   ```

3. **Defensive field access** -- Always use fallbacks: `session?.pathway ?? 'default'` instead of bare `session.pathway.method()`.

4. **CI check** -- Diff generated types against committed types, fail if mismatch.

### E2E Test Patterns

1. **Use role-based selectors** (`getByRole`) over CSS selectors. They match semantic meaning, not implementation details. Fall back to `getByTestId` only for custom components without ARIA roles.

2. **Never use soft-fail catch patterns** in tests. `catch(() => false)` hides real failures. Hard assertions with adequate timeouts are always better.

3. **Prove hydration before interacting** -- `waitForLoadState('networkidle')` alone isn't sufficient for SPAs. Wait for a specific React-rendered element to become visible as proof that hydration completed.

4. **Verify interactivity, not just visibility** -- Use `isEnabled()` checks after `isVisible()` for buttons and form elements.

## Cross-References

- [Multi-Agent Code Review Fixes](/docs/solutions/security-issues/multi-agent-review-security-correctness-hardening.md) -- Preceded this work; Fix #6 covers similar TypeScript type safety issues
- [CLAUDE.md Pitfall #9](/CLAUDE.md) -- "Use `session-primitives.ts` functions, not direct Supabase calls"
- [CLAUDE.md Pitfall #12](/CLAUDE.md) -- SSG safety and the no-op Proxy pattern in `lib/supabase/client.ts`
- [Todo #010](/apps/web/todos/010-pending-p2-test-assertions-old-colors.md) -- Test assertions with hard-coded CSS class selectors that break on retheme
- [Migration 001](/apps/web/supabase/migrations/001_bmad_method_schema.sql) -- Source of truth for `bmad_sessions` table with `pathway` column
