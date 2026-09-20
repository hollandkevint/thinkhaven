import 'next/dist/compiled/server-only';

import { getDatabasePool } from '@/lib/db/pool';

export type ReadinessStatus = 'pass' | 'warn' | 'fail';

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface RailwayReadinessReport {
  status: ReadinessStatus;
  checkedAt: string;
  checks: ReadinessCheck[];
}

function aggregateStatus(checks: ReadinessCheck[]): ReadinessStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

function addDatabaseShapeCheck(
  checks: ReadinessCheck[],
  check: { id: string; label: string; query: string; success: string; failure: string },
  pool: ReturnType<typeof getDatabasePool> | null,
) {
  if (!pool) {
    checks.push({
      id: check.id,
      label: check.label,
      status: 'fail',
      detail: 'Railway PostgreSQL is unavailable; the table shape could not be checked.',
    });
    return;
  }

  return pool.query(check.query).then(
    () => {
      checks.push({
        id: check.id,
        label: check.label,
        status: 'pass',
        detail: check.success,
      });
    },
    () => {
      checks.push({
        id: check.id,
        label: check.label,
        status: 'fail',
        detail: check.failure,
      });
    },
  );
}

export async function checkRailwayReadiness(): Promise<RailwayReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  checks.push({
    id: 'database-env',
    label: 'Railway database env',
    status: hasDatabaseUrl ? 'pass' : 'fail',
    detail: hasDatabaseUrl
      ? 'DATABASE_URL is configured for server-only PostgreSQL access.'
      : 'DATABASE_URL is required for Railway PostgreSQL access.',
  });

  let pool: ReturnType<typeof getDatabasePool> | null = null;
  if (hasDatabaseUrl) {
    try {
      const candidate = getDatabasePool();
      await candidate.query('select 1');
      pool = candidate;
      checks.push({
        id: 'database-connection',
        label: 'Railway database connection',
        status: 'pass',
        detail: 'Railway PostgreSQL accepted a server-side health query.',
      });
    } catch {
      checks.push({
        id: 'database-connection',
        label: 'Railway database connection',
        status: 'fail',
        detail: 'Railway PostgreSQL could not complete a server-side health query.',
      });
    }
  } else {
    checks.push({
      id: 'database-connection',
      label: 'Railway database connection',
      status: 'fail',
      detail: 'Railway PostgreSQL is unavailable until DATABASE_URL is configured.',
    });
  }

  await addDatabaseShapeCheck(checks, {
    id: 'beta-table-shape',
    label: 'Beta table shape',
    query: `
      select "id", "user_id", "email", "approved_at", "revoked_at",
        "invite_count", "first_access_at", "last_access_at"
      from "public"."beta_access"
      limit 1
    `,
    success: 'beta_access exposes approval, revocation, invite, and access fields.',
    failure: 'beta_access is missing expected operations columns or cannot be queried.',
  }, pool);
  await addDatabaseShapeCheck(checks, {
    id: 'event-table-shape',
    label: 'Durable event table',
    query: `
      select "id", "event_type", "metadata", "created_at"
      from "public"."beta_auth_events"
      limit 1
    `,
    success: 'beta_auth_events is queryable for admin monitoring.',
    failure: 'beta_auth_events is unavailable; durable beta telemetry will be absent.',
  }, pool);

  return {
    status: aggregateStatus(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
