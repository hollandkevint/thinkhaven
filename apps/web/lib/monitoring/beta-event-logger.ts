import 'next/dist/compiled/server-only'

import { createHash } from 'node:crypto'
import { getDatabasePool } from '@/lib/db/pool'
import {
  assertBetaEventType,
  type BetaEventType,
  sanitizeBetaEventMetadata,
} from '@/lib/beta/beta-events'

export interface BetaEventInput {
  eventType: BetaEventType
  actorUserId?: string | null
  targetUserId?: string | null
  betaAccessId?: string | null
  targetEmail?: string | null
  requestPath?: string | null
  metadata?: Record<string, unknown>
}

export type BetaEventCounts = Partial<Record<BetaEventType, number>>

export type BetaGateEventStatus = 'approved' | 'pending' | 'revoked'

export interface BetaGateEvaluationInput {
  userId: string
  email?: string
  status: BetaGateEventStatus
  requestPath?: string
}

interface BetaGateRecord {
  id: string
  email: string
  first_access_at: string | null
}

function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

export async function logBetaEvent(input: BetaEventInput): Promise<boolean> {
  assertBetaEventType(input.eventType)

  try {
    await getDatabasePool().query(
      `
        insert into "public"."beta_auth_events" (
          "event_type",
          "actor_user_id",
          "target_user_id",
          "beta_access_id",
          "target_email_hash",
          "request_path",
          "metadata"
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        input.eventType,
        input.actorUserId || null,
        input.targetUserId || null,
        input.betaAccessId || null,
        hashEmail(input.targetEmail),
        input.requestPath || null,
        sanitizeBetaEventMetadata(input.metadata),
      ],
    )
    return true
  } catch (error) {
    console.warn('Failed to persist beta event:', {
      eventType: input.eventType,
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    return false
  }
}

export async function getBetaEventCounts(windowMs: number): Promise<BetaEventCounts | null> {
  const since = new Date(Date.now() - windowMs).toISOString()

  try {
    const { rows } = await getDatabasePool().query<{ event_type: BetaEventType }>(
      `
        select "event_type"
        from "public"."beta_auth_events"
        where "created_at" >= $1
      `,
      [since],
    )

    return rows.reduce<BetaEventCounts>((counts, row) => {
      counts[row.event_type] = (counts[row.event_type] || 0) + 1
      return counts
    }, {})
  } catch (error) {
    console.warn('Failed to read beta event counts:', {
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    return null
  }
}

export async function recordBetaGateEvaluation(
  input: BetaGateEvaluationInput,
): Promise<boolean> {
  try {
    const pool = getDatabasePool()
    const { rows } = await pool.query<BetaGateRecord>(
      `
        select "id", "email", "first_access_at"
        from "public"."beta_access"
        where "user_id" = $1
        limit 1
      `,
      [input.userId],
    )
    const record = rows[0]
    const now = new Date().toISOString()

    if (record) {
      const assignments = ['"last_gate_at" = $1', '"last_gate_status" = $2']
      const values: unknown[] = [now, input.status]

      if (input.status === 'approved' && !record.first_access_at) {
        assignments.push(`"first_access_at" = $${values.length + 1}`)
        values.push(now)
      }

      if (input.status === 'approved') {
        assignments.push(`"last_access_at" = $${values.length + 1}`)
        values.push(now)
      }

      values.push(record.id)
      await pool.query(
        `
          update "public"."beta_access"
          set ${assignments.join(', ')}
          where "id" = $${values.length}
        `,
        values,
      )
    }

    const gateEventType: BetaEventType =
      input.status === 'approved'
        ? 'beta_gate_approved'
        : input.status === 'revoked'
          ? 'beta_gate_revoked'
          : 'beta_gate_pending'

    await logBetaEvent({
      eventType: gateEventType,
      targetUserId: input.userId,
      betaAccessId: record?.id,
      targetEmail: record?.email || input.email,
      requestPath: input.requestPath || '/app',
      metadata: { status: input.status },
    })

    if (input.status === 'approved' && record && !record.first_access_at) {
      await logBetaEvent({
        eventType: 'first_app_access',
        targetUserId: input.userId,
        betaAccessId: record.id,
        targetEmail: record.email || input.email,
        requestPath: input.requestPath || '/app',
        metadata: { status: input.status },
      })
    }

    return true
  } catch (error) {
    console.warn('Failed to persist beta gate evaluation:', {
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    return false
  }
}
