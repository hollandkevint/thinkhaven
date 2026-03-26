---
title: "Fix dashboard session delete + P3 cleanup"
type: fix
date: 2026-03-25
---

# Fix Dashboard Session Delete + P3 Cleanup

## Bug: Dashboard 3-dot menu doesn't open

**Root cause:** The `e.preventDefault()` on the `DropdownMenuTrigger` button prevents Radix's internal click handler from toggling the dropdown open. `e.stopPropagation()` alone is sufficient to prevent the parent Card's onClick from firing.

**Fix:** Remove `e.preventDefault()`, keep only `e.stopPropagation()`.

**File:** `apps/web/app/app/page.tsx:401`

```typescript
// BEFORE (broken):
onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}

// AFTER (fixed):
onClick={(e) => e.stopPropagation()}
```

## P3 Cleanup Items

### 1. Remove debug logging from claude-client.ts

The debug logger in `continueWithToolResults` catch block was causing a `ReferenceError` and is no longer needed now that the root cause (conversation history with tool_use blocks) is fixed.

**File:** `apps/web/lib/ai/claude-client.ts` -- already removed in commit db0c7a2.

### 2. Board state persistence

`board_state` column was removed from queries because it never existed. Board state now lives in `sub_persona_state`. This works but means board state is coupled with sub-persona mode state. Not a problem for now, but if board state grows, consider adding the `board_state` column via migration.

**Status:** Deferred. Current approach works.

### 3. /api/bmad 404 polling

Vercel logs show `POST /api/bmad` returning 404 every 60 seconds. The route was deleted in PR #23. No active code references it. Likely from cached client JS on existing browser sessions. Will resolve naturally as caches expire.

**Status:** No action needed.

### 4. Dead functions in credit-manager.ts (~190 LOC)

6 functions for Stripe Checkout integration that was replaced by Payment Links: `getCreditPackages`, `getCreditPackage`, `createPaymentRecord`, `updatePaymentStatus`, `getPaymentHistory`, `getTransactionByStripePayment`. Zero callers.

**File:** `apps/web/lib/monetization/credit-manager.ts:278-464`
**Action:** Delete the 6 functions + their types (`CreditPackage`, `PaymentRecord`).

## Acceptance Criteria

- [ ] Dashboard 3-dot menu opens on click
- [ ] "Delete" option removes the session and refreshes the list
- [ ] Dead code removed from credit-manager.ts
- [ ] `npm run build` passes
- [ ] E2E tests pass
