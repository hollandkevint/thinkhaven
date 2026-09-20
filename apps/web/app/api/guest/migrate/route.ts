import { NextRequest, NextResponse } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import {
  migrateGuestSession,
  normalizeGuestMigrationInput,
} from '@/lib/db/repositories/guest-session-repository'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const railwaySession = await getRailwaySession(request)
    const user = railwaySession?.user
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const input = normalizeGuestMigrationInput(
      body && typeof body === 'object' && !Array.isArray(body) && 'session' in body
        ? (body as { session?: unknown }).session
        : body,
    )
    if (!input) return NextResponse.json({ error: 'Invalid guest session' }, { status: 400 })

    const migrated = await migrateGuestSession(user.id, input)
    if (!migrated) {
      return NextResponse.json({
        success: true,
        migratedMessages: 0,
      })
    }

    return NextResponse.json({
      success: true,
      sessionId: migrated.id,
      workspaceId: user.id,
      migratedMessages: migrated.messageCount,
    })
  } catch (error) {
    console.error('[Guest Migration] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({
      success: false,
      error: 'Failed to save migrated session',
    }, { status: 500 })
  }
}
