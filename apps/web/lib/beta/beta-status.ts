import 'next/dist/compiled/server-only';

import { getDatabasePool } from '@/lib/db/pool';
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

async function fetchBetaAccessRecord(user: BetaStatusUser): Promise<BetaAccessRecord | null> {
  const pool = getDatabasePool();
  const byUserId = await pool.query<BetaAccessRecord>(
    `
      select ${BETA_STATUS_COLUMNS}
      from "public"."beta_access"
      where "user_id" = $1
      limit 1
    `,
    [user.id],
  );

  if (byUserId.rows[0]) {
    return byUserId.rows[0];
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const byEmail = await pool.query<BetaAccessRecord>(
    `
      select ${BETA_STATUS_COLUMNS}
      from "public"."beta_access"
      where "email" = $1
      limit 1
    `,
    [email],
  );

  return byEmail.rows[0] ?? null;
}

export async function getUserBetaAccessStatus(
  user: BetaStatusUser
): Promise<UserBetaAccessStatus> {
  try {
    const record = await fetchBetaAccessRecord(user);
    return {
      status: deriveStatus(record),
      record,
      unavailable: false,
    };
  } catch {
    return {
      status: 'missing',
      record: null,
      unavailable: true,
    };
  }
}
