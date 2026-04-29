# Beta Access Operations

## Readiness

Before sharing invites, open `/admin/beta` and check Supabase readiness.

- `pass`: invites and admin operations can proceed.
- `warn`: review the warning before inviting. The custom access-token hook warning means the server guard table fallback still protects access, but Supabase Dashboard should be checked.
- `fail`: do not invite beta users until the failed item is fixed.

Required runtime configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Approve And Invite

1. Open `/admin/beta`.
2. Find the pending beta row by email or source.
3. Select `Approve`.
4. Select `Invite` to copy the branded `/try?beta_invite=...` link.
5. Share the copied link with the beta user.

The invite path starts at `/try`. Signup and login preserve the invite context, but approval still controls `/app` access.

## Revoke Or Restore

Use `Revoke` on an approved row to remove current beta access while preserving approval history. Use `Restore` on a revoked row to re-approve access.

Revocation is current state: a row with both `approved_at` and `revoked_at` is not currently approved.

## Telemetry

Durable beta events are stored in `beta_auth_events` without raw email addresses. The monitoring dashboard reads beta-funnel counts when service-role access is available.

Useful event sequence:

- `invite_copied`
- `invite_arrived`
- `signup_from_invite`
- `beta_gate_pending`
- `beta_approved`
- `first_app_access`

Telemetry failures should not block signup, approval, invite copy, or app access. Treat missing events as an operational visibility issue, not as proof that the primary flow failed.
