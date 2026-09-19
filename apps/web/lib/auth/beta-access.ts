import 'next/dist/compiled/server-only'

import { getDatabasePool } from '@/lib/db/pool'
import { recordBetaGateEvaluation } from '@/lib/monitoring/beta-event-logger'
import { isAdminEmail } from './admin'
import { getRailwaySession } from './railway-session'

export type BetaAccessStatus =
  | 'approved'
  | 'admin'
  | 'pending'
  | 'revoked'
  | 'unauthenticated'
  | 'unavailable'

export interface BetaAccessResult {
  user: { id: string; email?: string } | null
  betaApproved: boolean
  status: BetaAccessStatus
  isAdmin: boolean
  error: string | null
}

export interface CheckBetaAccessOptions {
  recordGate?: boolean
  requestPath?: string
}

interface BetaAccessRow {
  approved_at: string | null
  revoked_at: string | null
}

function betaResult({
  user,
  betaApproved,
  status,
  error = null,
}: {
  user: BetaAccessResult['user']
  betaApproved: boolean
  status: BetaAccessStatus
  error?: string | null
}): BetaAccessResult {
  return {
    user,
    betaApproved,
    status,
    isAdmin: status === 'admin',
    error,
  }
}

export async function checkBetaAccess(
  options: CheckBetaAccessOptions = {},
): Promise<BetaAccessResult> {
  let session: Awaited<ReturnType<typeof getRailwaySession>>

  try {
    session = await getRailwaySession()
  } catch {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      error: 'Authentication service unavailable',
    })
  }

  if (!session?.user) {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      error: 'No authenticated user',
    })
  }

  const user = { id: session.user.id, email: session.user.email }

  if (isAdminEmail(session.user.email)) {
    return betaResult({
      user,
      betaApproved: true,
      status: 'admin',
    })
  }

  try {
    const { rows } = await getDatabasePool().query<BetaAccessRow>(
      `
        select "approved_at", "revoked_at"
        from "public"."beta_access"
        where "user_id" = $1
        limit 1
      `,
      [session.user.id],
    )
    const record = rows[0]
    const revoked = record?.revoked_at != null
    const approved = !revoked && record?.approved_at != null
    const status: Extract<BetaAccessStatus, 'approved' | 'pending' | 'revoked'> = approved
      ? 'approved'
      : revoked
        ? 'revoked'
        : 'pending'

    if (options.recordGate !== false) {
      await recordBetaGateEvaluation({
        userId: session.user.id,
        email: session.user.email,
        status,
        requestPath: options.requestPath,
      })
    }

    return betaResult({
      user,
      betaApproved: approved,
      status,
    })
  } catch {
    return betaResult({
      user,
      betaApproved: false,
      status: 'unavailable',
      error: 'Beta access lookup failed',
    })
  }
}
