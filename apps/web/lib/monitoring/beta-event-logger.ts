import 'next/dist/compiled/server-only';

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  assertBetaEventType,
  type BetaEventType,
  sanitizeBetaEventMetadata,
} from '@/lib/beta/beta-events';

export interface BetaEventInput {
  eventType: BetaEventType;
  actorUserId?: string | null;
  targetUserId?: string | null;
  betaAccessId?: string | null;
  targetEmail?: string | null;
  requestPath?: string | null;
  metadata?: Record<string, unknown>;
}

export type BetaEventCounts = Partial<Record<BetaEventType, number>>;

export type BetaGateEventStatus = 'approved' | 'pending' | 'revoked';

export interface BetaGateEvaluationInput {
  userId: string;
  email?: string;
  status: BetaGateEventStatus;
}

function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export async function logBetaEvent(input: BetaEventInput): Promise<boolean> {
  assertBetaEventType(input.eventType);

  const supabase = createAdminClient();
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('beta_auth_events').insert({
    event_type: input.eventType,
    actor_user_id: input.actorUserId || null,
    target_user_id: input.targetUserId || null,
    beta_access_id: input.betaAccessId || null,
    target_email_hash: hashEmail(input.targetEmail),
    request_path: input.requestPath || null,
    metadata: sanitizeBetaEventMetadata(input.metadata),
  });

  if (error) {
    console.warn('Failed to persist beta event:', {
      eventType: input.eventType,
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return true;
}

export async function getBetaEventCounts(windowMs: number): Promise<BetaEventCounts | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  const since = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .from('beta_auth_events')
    .select('event_type')
    .gte('created_at', since);

  if (error) {
    console.warn('Failed to read beta event counts:', {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return (data ?? []).reduce<BetaEventCounts>((counts, row: { event_type: BetaEventType }) => {
    counts[row.event_type] = (counts[row.event_type] || 0) + 1;
    return counts;
  }, {});
}

export async function recordBetaGateEvaluation(
  input: BetaGateEvaluationInput
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data: record, error: lookupError } = await supabase
      .from('beta_access')
      .select('id, email, first_access_at')
      .eq('user_id', input.userId)
      .maybeSingle();

    if (lookupError) {
      console.warn('Failed to read beta gate record:', {
        code: lookupError.code,
        message: lookupError.message,
      });
      return false;
    }

    const now = new Date().toISOString();
    const update: Record<string, string> = {
      last_gate_at: now,
      last_gate_status: input.status,
    };
    const isFirstApprovedAccess = input.status === 'approved' && record && !record.first_access_at;

    if (isFirstApprovedAccess) {
      update.first_access_at = now;
    }

    if (record) {
      const { error: updateError } = await supabase
        .from('beta_access')
        .update(update)
        .eq('id', record.id);

      if (updateError) {
        console.warn('Failed to update beta gate record:', {
          code: updateError.code,
          message: updateError.message,
        });
        return false;
      }
    }

    const gateEventType: BetaEventType =
      input.status === 'approved'
        ? 'beta_gate_approved'
        : input.status === 'revoked'
          ? 'beta_gate_revoked'
          : 'beta_gate_pending';

    await logBetaEvent({
      eventType: gateEventType,
      targetUserId: input.userId,
      betaAccessId: record?.id,
      targetEmail: record?.email || input.email,
      requestPath: '/app',
      metadata: { status: input.status },
    });

    if (isFirstApprovedAccess) {
      await logBetaEvent({
        eventType: 'first_app_access',
        targetUserId: input.userId,
        betaAccessId: record.id,
        targetEmail: record.email || input.email,
        requestPath: '/app',
        metadata: { status: input.status },
      });
    }

    return true;
  } catch (error) {
    console.warn('Failed to persist beta gate evaluation:', error);
    return false;
  }
}
