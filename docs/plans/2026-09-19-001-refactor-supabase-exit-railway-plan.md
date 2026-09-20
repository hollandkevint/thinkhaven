---
title: ThinkHaven Supabase Exit to Railway
type: refactor-plan
status: active
date: 2026-09-19
owner: Kevin Holland
branch: codex/thinkhaven-supabase-exit
---

# ThinkHaven Supabase Exit to Railway

## Outcome

Run ThinkHaven without Supabase. The target is one Railway project containing the Next.js service and one private PostgreSQL service. Authentication, sessions, authorization, and data access become application-owned. Stripe, Anthropic, Google OAuth, and Resend remain external integrations.

This is not a self-hosted Supabase migration. It removes Supabase Auth, PostgREST, RLS as the application boundary, Supabase client packages, and Supabase operational dependencies after a verified cutover.

## Current live evidence

- Supabase project: `thinkhaven` (`lbnhfsocxbwhbvnfpjdw`), PostgreSQL 17, `us-east-2`.
- Users: 9 total; 6 email/password and 3 Google.
- Non-zero application records: 11 sessions, 13 phase outputs, 9 workspaces, 9 credit balances, 10 credit transactions, 14 beta-access rows, and 3 beta-auth events.
- No Supabase Storage buckets and no deployed Edge Functions.
- Application source does not use Supabase Realtime or cron.
- `assessment_submissions` and `session_artifacts` are referenced by code but absent from the live Data API.
- Verified temporary backups:
  - `/private/tmp/thinkhaven-native-backup-20260919.nDvxp0/public.dump`
  - `/private/tmp/thinkhaven-native-backup-20260919.nDvxp0/auth.dump`

The backups are PostgreSQL custom-format archives with restricted file permissions. They remain temporary until Kevin chooses a durable encrypted location and retention period.

## Decisions

1. Preserve every existing Supabase user UUID so owned rows keep their relationships.
2. Do not migrate active Supabase sessions. All users reauthenticate after cutover.
3. Email/password users reset their passwords. Google users sign in again.
4. Use Better Auth with PostgreSQL for email/password, Google OAuth, verification, reset, and database sessions.
5. Use the `pg` driver and a small server-only repository layer. Do not add an ORM, Redis, queue, or worker.
6. Move browser database calls behind authenticated Next.js routes or server actions.
7. Replace `auth.uid()` and service-role authorization with explicit server-side ownership checks and transactional SQL.
8. Keep Supabase available during the rollback window. Delete it only after Railway production verification succeeds.
9. Do not rebuild incomplete Stripe billing behavior during the core data migration. Preserve the tables; activate webhook work only when monetization is confirmed live.

## Phases and gates

### Phase 0: inventory and recoverability

- [x] Verify personal Railway account and workspace.
- [x] Verify ThinkHaven Supabase project identity and region.
- [x] Inventory users, providers, table counts, Storage, and Edge Functions.
- [x] Create and validate public/Auth database archives.
- [ ] Move archives to a durable encrypted location.
- [x] Record Railway spending approval.
- [ ] Record backup retention and recovery targets.

Gate: a restorable source backup and an explicit rollback window exist before target writes begin.

### Phase 1: additive application foundation

- [x] Add PostgreSQL pool and transaction helpers.
- [x] Add Better Auth server/client configuration for email/password and Google.
- [x] Create app-owned auth schema and import-safe UUID identifiers.
- [x] Add Better Auth route without switching existing production routes.
- [x] Add `/api/health` and `/api/ready`.
- [x] Add focused tests for configuration failures, session resolution, readiness, beta access, and beta event persistence. Live browser flows still require the deployed target.

Gate: the new foundation builds and tests without changing current Supabase production behavior.

### Phase 2: canonical Railway schema

- [x] Restore the source snapshot into the empty Railway PostgreSQL target for rehearsal.
- [ ] Reconcile live schema against repository migrations.
- [ ] Produce one reviewed Railway baseline instead of replaying contradictory migrations blindly.
- [ ] Repoint user foreign keys from `auth.users` to the app-owned user table while preserving UUIDs.
- [ ] Preserve constraints, indexes, and atomic credit/message/canvas behavior.
- [ ] Remove `auth.uid()` and Supabase JWT-hook dependencies.

`apps/web/db/migrations/002_railway_schema_cutover.sql` now contains the minimal
canonical cutover: it preserves delete behavior while repointing all 15 public
foreign keys, removes the 45 obsolete public RLS policies, disables public RLS,
and removes the Supabase-auth triggers and RPCs replaced by actor-scoped server
transactions. It completed successfully on the Railway rehearsal database inside
a forced rollback transaction. Applying it requires Kevin's explicit approval
because it changes the database security boundary.

Gate: schema, IDs, row counts, constraints, and representative JSON match the source snapshot.

### Phase 3: vertical application migration

Migrate in this order:

1. Auth, beta access, waitlist, and admin checks. Better Auth session resolution, browser provider, email/Google sign-in, signup, verification resend, password reset/change, beta gate lookup, beta event persistence, waitlist writes, admin mutations, middleware, and server API identity checks are migrated. Remaining Supabase use in these routes is data-plane only.
2. Dashboard, workspace, sessions, and guest-session migration. Actor-scoped dashboard list/read/rename/delete and session creation now use authenticated Railway API routes and parameterized PostgreSQL. Session creation and an enabled credit deduction commit in one transaction. Workspace and guest migration remain.
3. Streaming chat, message persistence, counters, canvas, artifacts, and AI tools. The authenticated stream boundary, browser messages, canvas merges, document generation, phase completion, insights, model-triggered session tools, context building, and chat exports now use actor-scoped PostgreSQL.
4. Feedback, legacy conversations, monitoring, public sharing, and exports. Feedback and public artifact paths now use parameterized PostgreSQL. Assessment retains its existing local fallback because its source table is absent. The remaining Supabase-linked conversation/bookmark code is dormant and awaits approval for deletion rather than inventing Railway tables for unused features.
5. Credits and verified Stripe webhook processing only if billing is confirmed active. Balance/history and atomic deduct/add operations now use row-locked PostgreSQL transactions; Stripe settlement remains deliberately deferred.

Every browser-side Supabase read or write moves behind an authenticated server boundary. Request bodies never establish the authoritative user ID.

Gate: targeted unit/integration tests pass and cross-user access is denied for every migrated vertical.

### Phase 4: Railway rehearsal

- [x] Create one Railway project in Kevin's personal workspace.
- [x] Add one private PostgreSQL service and one Next.js service.
- [x] Load the production snapshot into the private, non-serving Railway target.
- [ ] Configure secrets by variable reference without printing them.
- [ ] Verify restart persistence, backups, restore, health, and readiness.
- [ ] Run the full application checks and authenticated browser flows.

Gate: Railway deployment reaches `SUCCESS`; health, readiness, login, Google OAuth, password reset, sessions, chat, credits, public sharing, and rollback are verified.

### Phase 5: cutover

- [ ] Announce a short maintenance window to the nine users.
- [ ] Stop writes and scheduled mutations on the source.
- [ ] Take the final export and restore it to Railway.
- [ ] Reconcile counts and IDs.
- [ ] Switch application configuration and domain traffic.
- [ ] Update Google OAuth redirects, email links, Stripe webhook URL if active, and application URL.
- [ ] Reject old Supabase sessions and require reauthentication.

Rollback before Railway receives writes is a traffic/configuration reversal. After Railway receives writes, rollback requires explicit reconciliation; do not run both systems as independent writers.

### Phase 6: burn-in and decommission

- [ ] Observe errors, database metrics, auth events, backups, and user-critical flows through the agreed rollback window.
- [ ] Remove Supabase packages, variables, imports, tests, and operational docs.
- [ ] Take and retain the final approved archive.
- [ ] Delete the ThinkHaven Supabase project only after Kevin explicitly approves the final irreversible deletion.

## Verification contract

The exit is complete only when all of the following pass:

- Existing user UUIDs and owned records are preserved.
- Email signup, verification, login, logout, reset, and password change work.
- Google first-time and returning-user flows work.
- Pending, approved, revoked, and admin beta states work immediately.
- Old Supabase cookies are rejected.
- Anonymous and cross-user access are blocked.
- Caller-supplied user IDs do not grant authority.
- Session creation, chat append, canvas merge, message limits, and credit mutations remain atomic.
- Guest migration is idempotent and clears local state only after commit.
- Public artifacts require exact tokens and never expose captured email through generic listing.
- Duplicate Stripe events cannot double-credit if billing is activated.
- Database backup and restore are rehearsed.
- `npm run lint`, `npm run build`, `npm run test:run`, and relevant browser tests pass.
- Railway deployment reaches `SUCCESS`, and `/api/health` plus `/api/ready` succeed.

## Current blockers

1. The sensitive temporary Auth backup needs a durable encrypted destination and retention period.
2. Password-reset email needs an approved sender/domain.
3. Applying the transaction-tested canonical schema migration requires explicit approval because it drops restored Supabase RLS policies, auth triggers, and obsolete RPCs on the non-serving Railway target.

## Latest rehearsal evidence

- Railway PostgreSQL 18 restore completed with 28 public tables and 27 source Auth tables.
- Live Railway audit confirms 15 public foreign keys still target `auth.users` and 45 public RLS policies remain before canonical cutover. The new migration completed inside a forced rollback, and post-checks confirmed the target remained unchanged at 15/45.
- Counts match the source inventory: 9 users, 11 sessions, 13 phase outputs, 9 credit balances, 10 credit transactions, 14 beta-access rows, and 3 beta-auth events.
- All restored constraints validate; 45 source RLS policies and 3 source signup triggers are present for behavior comparison.
- Better Auth `app_auth` schema contains all 9 user UUIDs and 4 Google identities, with zero UUID mismatches and zero imported sessions.
- Beta access now uses the Better Auth server session plus parameterized PostgreSQL. Beta gate events, counts, and first-access timestamps use PostgreSQL without blocking user access when telemetry fails.
- Beta waitlist and admin approval/revocation/invite operations now use parameterized PostgreSQL. Focused mutation tests cover create, duplicate, unavailable, list, not-found, and approval paths.
- Browser auth now uses Better Auth behind the existing `useAuth()` contract. Login, signup, verification resend, reset, account password change, safe invite redirects, and token-free auth logging are covered by focused tests.
- Middleware now only forwards request path/search context. The Node server layout remains the authoritative `/app` Better Auth and beta gate, and legacy Supabase cookies no longer establish identity.
- Ten API routes now resolve identity from Better Auth sessions. Existing Supabase table calls remain temporarily in place until their data repositories migrate.
- Dashboard session list/read/rename/delete, credit balance/history/deduct/add, beta operations, and public artifact sharing now use parameterized PostgreSQL. Cross-user session access is denied by actor-scoped queries.
- Session creation no longer calls Supabase. The session row, row-locked credit decrement, and credit audit record commit or roll back together; focused tests, lint, and the production build pass.
- All currently exercised ThinkHaven data paths now use Better Auth and PostgreSQL, including context/export and guest migration. The Supabase auth callback is now a compatibility redirect and environment validation targets Railway/Better Auth. Remaining production imports belong to dormant bookmark/history files and their otherwise-unreferenced Supabase helpers; deleting that unused feature code requires Kevin's approval.
- Railway readback: the `Postgres` service is healthy with its restored volume, but `thinkhaven-web` has no deployment, source, domain, or application variables beyond `DATABASE_URL` and Railway metadata. Before deployment it still needs Better Auth, Google OAuth, Resend, application URL, AI-provider, and any active Stripe variables configured securely.
- `session_artifacts` is still absent from the verified source schema. The unused persistence helper now fails closed and is kept server-only instead of inventing a new table during the cutover.
- Focused Railway auth/readiness/beta tests pass, targeted lint is clean, `git diff --check` is clean, and the production Next.js build succeeds.
- The source-only `vector(1536)` column belongs to an empty table and is represented as portable text in the rehearsal. The canonical schema must decide whether to delete the unused column or add pgvector later.
- Temporary TCP proxies used for the import were deleted after verification; the database is private-only again.
