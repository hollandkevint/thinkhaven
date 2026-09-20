/**
 * Feedback API
 *
 * POST /api/feedback
 * Collects in-app feedback with type categorization (praise/bug/feature_request).
 * Validates via Zod, IDOR-checks session ownership, inserts to feedback table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import { getDatabasePool } from '@/lib/db/pool'
import {
  hasOwnedSession,
  insertFeedback,
} from '@/lib/db/repositories/feedback-repository'
import { FeedbackSchema } from '@/lib/feedback/feedback-schema'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    let pool: ReturnType<typeof getDatabasePool>
    try {
      pool = getDatabasePool()
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const railwaySession = await getRailwaySession(request)
    const user = railwaySession?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = FeedbackSchema.safeParse(body)

    if (!parsed.success) {
      console.warn('Feedback validation failed:', parsed.error.issues)
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      )
    }

    const { feedback_type, free_text, session_id, source, would_recommend, disappear_alternative } = parsed.data

    // IDOR check: verify user owns the referenced session
    if (session_id) {
      if (!await hasOwnedSession(session_id, user.id, pool)) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    }

    // Insert — always use authenticated user.id, never from request body
    try {
      await insertFeedback({
        userId: user.id,
        sessionId: session_id ?? null,
        feedbackType: feedback_type,
        freeText: free_text,
        source,
        wouldRecommend: would_recommend ?? null,
        disappearAlternative: disappear_alternative ?? null,
      }, pool)
    } catch (error) {
      // UNIQUE violation = already submitted for this session
      if (getDatabaseErrorCode(error) === '23505') {
        return NextResponse.json(
          { error: 'Feedback already submitted for this session' },
          { status: 409 }
        )
      }
      console.error('Feedback insert failed:', getDatabaseErrorCode(error))
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function getDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}
