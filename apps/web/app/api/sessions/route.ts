import { NextRequest, NextResponse } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import { listSessions } from '@/lib/db/repositories/session-repository'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const railwaySession = await getRailwaySession(request)
    const user = railwaySession?.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(await listSessions(user.id))
  } catch (error) {
    console.error('Error listing sessions:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
