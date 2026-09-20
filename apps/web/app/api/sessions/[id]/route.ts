import { NextRequest, NextResponse } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import {
  appendSessionMessage,
  deleteSession,
  getSession,
  renameSession,
} from '@/lib/db/repositories/session-repository'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

const MESSAGE_ROLES = new Set(['user', 'assistant', 'system'])

function validMessage(raw: unknown): raw is {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const message = raw as Record<string, unknown>
  return (
    typeof message.id === 'string' && message.id.length > 0 && message.id.length <= 100 &&
    typeof message.role === 'string' && MESSAGE_ROLES.has(message.role) &&
    typeof message.content === 'string' && message.content.length <= 100_000 &&
    typeof message.timestamp === 'string' && !Number.isNaN(Date.parse(message.timestamp)) &&
    (message.metadata === undefined || (
      typeof message.metadata === 'object' && message.metadata !== null && !Array.isArray(message.metadata)
    ))
  )
}

async function authenticatedUser(request: NextRequest) {
  const railwaySession = await getRailwaySession(request)
  return railwaySession?.user ?? null
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const session = await getSession(id, user.id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error reading session:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''

    if (!title || title.length > 100) {
      return NextResponse.json({ error: 'Session title must be 1-100 characters' }, { status: 400 })
    }

    const session = await renameSession(id, user.id, title)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error renaming session:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!validMessage(body?.message)) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const { id } = await context.params
    const result = await appendSessionMessage(id, user.id, body.message)
    if (result === 'not-found') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, duplicate: result === 'duplicate' })
  } catch (error) {
    console.error('Error appending session message:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await authenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const deleted = await deleteSession(id, user.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
