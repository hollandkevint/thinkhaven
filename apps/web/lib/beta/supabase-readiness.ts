import 'next/dist/compiled/server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ReadinessStatus = 'pass' | 'warn' | 'fail';

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface SupabaseReadinessReport {
  status: ReadinessStatus;
  checkedAt: string;
  checks: ReadinessCheck[];
}

function aggregateStatus(checks: ReadinessCheck[]): ReadinessStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

export async function checkSupabaseReadiness(): Promise<SupabaseReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const hasPublicUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  checks.push({
    id: 'public-env',
    label: 'Public Supabase env',
    status: hasPublicUrl && hasAnonKey ? 'pass' : 'fail',
    detail: hasPublicUrl && hasAnonKey
      ? 'Public URL and anon key are configured.'
      : 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.',
  });

  checks.push({
    id: 'service-role-env',
    label: 'Service-role env',
    status: hasServiceRole ? 'pass' : 'fail',
    detail: hasServiceRole
      ? 'Service-role key is available to server-only modules.'
      : 'SUPABASE_SERVICE_ROLE_KEY is required for beta admin operations.',
  });

  const serverClient = await createClient();
  checks.push({
    id: 'server-client',
    label: 'SSR server client',
    status: serverClient ? 'pass' : 'fail',
    detail: serverClient
      ? 'Cookie-backed Supabase server client can be constructed.'
      : 'Server client is unavailable; protected routes will fail closed.',
  });

  const adminClient = createAdminClient();
  checks.push({
    id: 'admin-client',
    label: 'Admin service client',
    status: adminClient ? 'pass' : 'fail',
    detail: adminClient
      ? 'Service-role Supabase client can be constructed lazily.'
      : 'Admin operations cannot run until service-role env is available.',
  });

  if (adminClient) {
    const betaShape = await adminClient
      .from('beta_access')
      .select('id, user_id, email, approved_at, revoked_at, invite_count, first_access_at')
      .limit(1);

    checks.push({
      id: 'beta-table-shape',
      label: 'Beta table shape',
      status: betaShape.error ? 'fail' : 'pass',
      detail: betaShape.error
        ? 'beta_access is missing expected operations columns or cannot be queried.'
        : 'beta_access exposes approval, revocation, invite, and first-access fields.',
    });

    const eventShape = await adminClient
      .from('beta_auth_events')
      .select('id, event_type, metadata, created_at')
      .limit(1);

    checks.push({
      id: 'event-table-shape',
      label: 'Durable event table',
      status: eventShape.error ? 'fail' : 'pass',
      detail: eventShape.error
        ? 'beta_auth_events is unavailable; durable beta telemetry will be absent.'
        : 'beta_auth_events is queryable for admin monitoring.',
    });
  }

  checks.push({
    id: 'custom-token-hook',
    label: 'Custom access-token hook',
    status: 'warn',
    detail: 'Verify the custom access-token hook is enabled in Supabase Dashboard; server guard table fallback remains active.',
  });

  return {
    status: aggregateStatus(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
