# Beta Access Ops Runbook

## Before Inviting

- Open `/app/admin/beta`.
- Confirm Supabase readiness is not failing.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is available in the target environment.
- Confirm the custom access-token hook is enabled in Supabase Dashboard.

## Approve And Invite

1. Search for the beta request by email or source.
2. Approve the row.
3. Select `Invite` to copy the `/try?beta_invite=...` link.
4. Send the link manually.
5. Refresh the row after the user signs in and verify first or last access timestamps.

## Revoke Or Restore

1. Search for the account.
2. Use `Revoke` to pause current beta access.
3. Use `Restore` to re-approve a revoked account.
4. Ask the user to sign out and back in if a stale browser session keeps showing the old state.

## Debug Stuck Users

- No row: send the user to `/waitlist` or add them through the normal waitlist flow.
- Pending: approve the row or tell the user their request is still queued.
- Invited but pending: the invite was copied, but access has not been approved.
- Revoked: restore access only if revocation was accidental.
- Approved but stuck on `/waitlist`: ask the user to refresh sign-in; the server guard also falls back to the table when the JWT claim is stale.
- Guest conversion saved but blocked: `/waitlist` shows saved message count while the user waits for approval.

## Telemetry

Use `beta_auth_events` for sanitized support context:

- `invite_arrived`
- `guest_migration_attempted`
- `beta_gate_pending`
- `beta_gate_approved`
- `beta_gate_revoked`
- `first_app_access`
- `support_requested`

Do not add raw emails, tokens, passwords, session payloads, or guest conversation text to event metadata.
