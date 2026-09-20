import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import {
  appendSessionMessage,
  deleteSession,
  getSession,
  listSessions,
  renameSession,
} from '@/lib/db/repositories/session-repository'
import { GET as listGET } from '@/app/api/sessions/route'
import {
  DELETE,
  GET,
  PATCH,
  POST,
} from '@/app/api/sessions/[id]/route'

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: vi.fn(),
}))

vi.mock('@/lib/db/repositories/session-repository', () => ({
  appendSessionMessage: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
  listSessions: vi.fn(),
  renameSession: vi.fn(),
}))

const user = { id: 'user-1', email: 'person@example.com' }
const session = {
  id: 'session-1',
  user_id: 'user-1',
  pathway: 'explore',
  title: 'A session',
  current_phase: 'explore',
  message_count: 0,
  message_limit: 10,
  status: 'active',
  created_at: '2026-09-19T00:00:00.000Z',
  updated_at: '2026-09-19T00:00:00.000Z',
  chat_context: [],
  sub_persona_state: null,
  lean_canvas: {},
}

function request(method = 'GET', body?: unknown) {
  return new Request('http://test.local/api/sessions/session-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest
}

function context() {
  return { params: Promise.resolve({ id: 'session-1' }) }
}

describe('session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRailwaySession).mockResolvedValue({ user } as never)
  })

  it('lists the authenticated user sessions', async () => {
    vi.mocked(listSessions).mockResolvedValue([session])

    const response = await listGET(request())

    await expect(response.json()).resolves.toEqual([session])
    expect(listSessions).toHaveBeenCalledWith('user-1')
  })

  it('reads, renames, and deletes through actor-scoped repository calls', async () => {
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(renameSession).mockResolvedValue(session)
    vi.mocked(deleteSession).mockResolvedValue(true)

    const readResponse = await GET(request(), context())
    await expect(readResponse.json()).resolves.toEqual(session)
    expect(getSession).toHaveBeenCalledWith('session-1', 'user-1')

    const renameResponse = await PATCH(request('PATCH', { title: 'Renamed', userId: 'attacker' }), context())
    await expect(renameResponse.json()).resolves.toEqual(session)
    expect(renameSession).toHaveBeenCalledWith('session-1', 'user-1', 'Renamed')

    const deleteResponse = await DELETE(request('DELETE', { userId: 'attacker' }), context())
    await expect(deleteResponse.json()).resolves.toEqual({ success: true })
    expect(deleteSession).toHaveBeenCalledWith('session-1', 'user-1')
  })

  it('appends a validated message using authenticated ownership', async () => {
    vi.mocked(appendSessionMessage).mockResolvedValue('appended')
    const message = {
      id: 'message-1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: '2026-09-19T12:00:00.000Z',
    }

    const response = await POST(request('POST', { message, userId: 'attacker' }), context())

    await expect(response.json()).resolves.toEqual({ success: true, duplicate: false })
    expect(appendSessionMessage).toHaveBeenCalledWith('session-1', 'user-1', message)
  })

  it('rejects malformed messages before touching the database', async () => {
    const response = await POST(request('POST', {
      message: { id: '', role: 'owner', content: 'bad', timestamp: 'never' },
    }), context())

    expect(response.status).toBe(400)
    expect(appendSessionMessage).not.toHaveBeenCalled()
  })

  it('returns not found for a session the actor does not own', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(renameSession).mockResolvedValue(null)
    vi.mocked(deleteSession).mockResolvedValue(false)

    const readResponse = await GET(request(), context())
    expect(readResponse.status).toBe(404)
    const renameResponse = await PATCH(request('PATCH', { title: 'Nope' }), context())
    expect(renameResponse.status).toBe(404)
    const deleteResponse = await DELETE(request(), context())
    expect(deleteResponse.status).toBe(404)
  })
})
