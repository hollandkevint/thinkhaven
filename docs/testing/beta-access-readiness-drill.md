# Beta Access Readiness Drill

Run this before sending real beta invites.

## Public Entry

1. Open `/try?beta_invite=<approved-row-id>&source=beta_invite`.
2. Confirm the guest experience loads.
3. Send a few guest messages.
4. Open the signup prompt and confirm signup/login links preserve invite context.

## Approval Loop

1. Open `/app/admin/beta` as an admin.
2. Confirm Supabase readiness is not failing.
3. Find a pending beta row.
4. Approve the row.
5. Copy the invite link.
6. Confirm the row shows invite metadata.

## Auth And Redirects

1. Sign in as an approved test user and confirm `/app` loads.
2. Sign in as a pending test user and confirm `/waitlist` shows pending recovery.
3. Sign in as a revoked test user and confirm `/waitlist` shows access-paused recovery.
4. Convert a guest session while pending and confirm `/waitlist` shows saved message count.
5. Convert a guest session while approved and confirm the migrated session opens.

## Recovery

1. Visit `/waitlist` while signed out and confirm the waitlist form renders.
2. Visit `/waitlist` while approved and confirm it redirects to `/app`.
3. Trigger a service-role-unavailable test environment and confirm admin/status surfaces fail closed.

## Automated Coverage

- Unit: `apps/web/tests/lib/auth/beta-access.test.ts`
- API: `apps/web/tests/api/admin/beta-access.test.ts`
- API: `apps/web/tests/api/beta/access-status.test.ts`
- API: `apps/web/tests/api/beta/events.test.ts`
- Component: `apps/web/tests/components/admin/BetaAccessControlCenter.test.tsx`
- Component: `apps/web/tests/components/waitlist-status.test.tsx`
- Smoke: `apps/web/tests/e2e/smoke/beta-checklist.spec.ts`
