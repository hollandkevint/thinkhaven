import 'next/dist/compiled/server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BetaAccessRecord } from './beta-access-types';

const BETA_STATUS_COLUMNS = [
  'id',
  'user_id',
  'email',
  'created_at',
  'approved_at',
  'approved_by',
  'source',
  'revoked_at',
  'revoked_by',
  'last_invited_at',
  'invite_copied_at',
  'invite_count',
  'last_gate_at',
  'last_gate_status',
  'first_access_at',
  'last_access_at',
].join(', ');

export type UserBetaStatus =
  | 'pending'
  | 'invited'
  | 'approved'
  | 'revoked'
  | 'missing';

export interface UserBetaAccessStatus {
  status: UserBetaStatus;
  record: BetaAccessRecord | null;
  unavailable: boolean;
}

export interface BetaStatusUser {
  id: string;
  email?: string;
}

function deriveStatus(record: BetaAccessRecord | null): UserBetaStatus {
  if (!record) return 'missing';
  if (record.revoked_at) return 'revoked';
  if (record.approved_at) return 'approved';
  if (record.last_invited_at || record.invite_copied_at) return 'invited';
  return 'pending';
}

async function fetchWithUserClient(userId: string): Promise<BetaAccessRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('beta_access')
    .select(BETA_STATUS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as unknown as BetaAccessRecord | null) ?? null;
}

async function fetchWithAdminClient(
  user: BetaStatusUser
): Promise<BetaAccessRecord | null> {
  const supabase = createAdminClient();
  if (!supabase) return fetchWithUserClient(user.id);

  const byUserId = await supabase
    .from('beta_access')
    .select(BETA_STATUS_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle();

  if (byUserId.error) {
    throw byUserId.error;
  }

  if (byUserId.data) {
    return byUserId.data as unknown as BetaAccessRecord;
  }

  if (!user.email) {
    return null;
  }

  const byEmail = await supabase
    .from('beta_access')
    .select(BETA_STATUS_COLUMNS)
    .eq('email', user.email.trim().toLowerCase())
    .maybeSingle();

  if (byEmail.error) {
    throw byEmail.error;
  }

  return (byEmail.data as unknown as BetaAccessRecord | null) ?? null;
}

export async function getUserBetaAccessStatus(
  user: BetaStatusUser
): Promise<UserBetaAccessStatus> {
  try {
    const record = await fetchWithAdminClient(user);
    return {
      status: deriveStatus(record),
      record,
      unavailable: false,
    };
  } catch {
    const fallbackRecord = await fetchWithUserClient(user.id);

    return {
      status: deriveStatus(fallbackRecord),
      record: fallbackRecord,
      unavailable: !fallbackRecord,
    };
  }
}
