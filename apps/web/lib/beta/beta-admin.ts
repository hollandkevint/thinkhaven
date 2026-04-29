import 'next/dist/compiled/server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  BetaAccessRecord,
  BetaAccessSummary,
  BetaLifecycleStatus,
} from './beta-access-types';
import { buildBetaInviteUrl as buildBetaInviteDestination } from './invite-destinations';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';

export type {
  BetaAccessRecord,
  BetaAccessSummary,
  BetaLifecycleStatus,
} from './beta-access-types';

export interface BetaAdminActor {
  id: string;
  email?: string;
}

export interface BetaInviteResult {
  record: BetaAccessSummary;
  inviteUrl: string;
}

type BetaAccessUpdate = Partial<
  Pick<
    BetaAccessRecord,
    | 'approved_at'
    | 'approved_by'
    | 'revoked_at'
    | 'revoked_by'
    | 'last_invited_at'
    | 'invite_copied_at'
    | 'invite_count'
  >
>;

const BETA_RECORD_COLUMNS = [
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
].join(', ');

export class BetaAdminUnavailableError extends Error {
  constructor() {
    super('Supabase admin client unavailable');
    this.name = 'BetaAdminUnavailableError';
  }
}

export class BetaAccessNotFoundError extends Error {
  constructor(id: string) {
    super(`Beta access record not found: ${id}`);
    this.name = 'BetaAccessNotFoundError';
  }
}

function getRequiredAdminClient() {
  const supabase = createAdminClient();

  if (!supabase) {
    throw new BetaAdminUnavailableError();
  }

  return supabase;
}

function summarizeRecord(record: BetaAccessRecord): BetaAccessSummary {
  const status: BetaLifecycleStatus = record.revoked_at
    ? 'revoked'
    : record.approved_at
      ? 'approved'
      : 'pending';

  return {
    ...record,
    status,
    signedUp: Boolean(record.user_id),
    invited: Boolean(record.last_invited_at || record.invite_copied_at),
  };
}

function getAppOrigin(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export function buildBetaInviteUrl(record: Pick<BetaAccessRecord, 'id'>): string {
  return buildBetaInviteDestination(record.id, getAppOrigin());
}

export async function listBetaAccessRecords(): Promise<BetaAccessSummary[]> {
  const supabase = getRequiredAdminClient();
  const { data, error } = await supabase
    .from('beta_access')
    .select(BETA_RECORD_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as BetaAccessRecord[]).map(summarizeRecord);
}

async function fetchBetaAccessRecord(id: string): Promise<BetaAccessRecord> {
  const supabase = getRequiredAdminClient();
  const { data, error } = await supabase
    .from('beta_access')
    .select(BETA_RECORD_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new BetaAccessNotFoundError(id);
  }

  return data as unknown as BetaAccessRecord;
}

async function updateBetaAccessRecord(
  id: string,
  update: BetaAccessUpdate
): Promise<BetaAccessRecord> {
  const supabase = getRequiredAdminClient();
  const { data, error } = await supabase
    .from('beta_access')
    .update(update)
    .eq('id', id)
    .select(BETA_RECORD_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new BetaAccessNotFoundError(id);
  }

  return data as unknown as BetaAccessRecord;
}

export async function approveBetaAccessRecord(
  id: string,
  actor: BetaAdminActor
): Promise<BetaAccessSummary> {
  const now = new Date().toISOString();
  const record = await updateBetaAccessRecord(id, {
    approved_at: now,
    approved_by: actor.email || actor.id,
    revoked_at: null,
    revoked_by: null,
  });

  await logBetaEvent({
    eventType: 'beta_approved',
    actorUserId: actor.id,
    targetUserId: record.user_id,
    betaAccessId: record.id,
    targetEmail: record.email,
    metadata: { status: 'approved' },
  });

  return summarizeRecord(record);
}

export async function revokeBetaAccessRecord(
  id: string,
  actor: BetaAdminActor
): Promise<BetaAccessSummary> {
  const now = new Date().toISOString();
  const record = await updateBetaAccessRecord(id, {
    revoked_at: now,
    revoked_by: actor.email || actor.id,
  });

  await logBetaEvent({
    eventType: 'beta_revoked',
    actorUserId: actor.id,
    targetUserId: record.user_id,
    betaAccessId: record.id,
    targetEmail: record.email,
    metadata: { status: 'revoked' },
  });

  return summarizeRecord(record);
}

export async function createBetaInvite(
  id: string,
  actor: BetaAdminActor
): Promise<BetaInviteResult> {
  const existing = await fetchBetaAccessRecord(id);
  const now = new Date().toISOString();
  const record = await updateBetaAccessRecord(id, {
    last_invited_at: now,
    invite_copied_at: now,
    invite_count: existing.invite_count + 1,
  });
  const inviteUrl = buildBetaInviteUrl(record);

  await logBetaEvent({
    eventType: 'invite_copied',
    actorUserId: actor.id,
    targetUserId: record.user_id,
    betaAccessId: record.id,
    targetEmail: record.email,
    metadata: { destination: '/try', inviteCount: record.invite_count },
  });

  return {
    record: summarizeRecord(record),
    inviteUrl,
  };
}
