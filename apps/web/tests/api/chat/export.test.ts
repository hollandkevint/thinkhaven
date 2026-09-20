import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/export/route'
import { getRailwaySession } from '@/lib/auth/railway-session'
import { getSession } from '@/lib/db/repositories/session-repository'
import {
  exportChatToJSON,
  exportChatToMarkdown,
  validateMessages,
} from '@/lib/export/chat-export'

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: vi.fn(),
}))

vi.mock('@/lib/db/repositories/session-repository', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/export/chat-export', () => ({
  exportChatToJSON: vi.fn(),
  exportChatToMarkdown: vi.fn(),
  exportChatToText: vi.fn(),
  validateMessages: vi.fn(),
}))

const user = { id: 'user-1', email: 'person@example.com' }
const session = {
  id: 'session-1',
  title: 'A session',
  chat_context: [{ id: 'message-1', role: 'user', content: 'Hello', timestamp: '2026-09-19T00:00:00.000Z' }],
}

function request(body: unknown) {
  return new NextRequest('http://test.local/api/chat/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRailwaySession).mockResolvedValue({ user } as never)
    vi.mocked(getSession).mockResolvedValue(session as never)
    vi.mocked(validateMessages).mockReturnValue({ valid: true })
    vi.mocked(exportChatToMarkdown).mockReturnValue({
      success: true,
      content: '# A session',
      fileName: 'a-session.md',
      format: 'markdown',
    })
  })

  it('exports only the authenticated user session', async () => {
    const response = await POST(request({ sessionId: 'session-1', format: 'markdown', userId: 'attacker' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      content: '# A session',
      fileName: 'a-session.md',
    })
    expect(getSession).toHaveBeenCalledWith('session-1', 'user-1')
    expect(exportChatToMarkdown).toHaveBeenCalledWith(session.chat_context, {
      workspaceName: 'A session',
      includeMetadata: true,
      includeTimestamps: true,
    })
  })

  it('rejects unauthenticated exports before reading the database', async () => {
    vi.mocked(getRailwaySession).mockResolvedValue(null)

    const response = await POST(request({ sessionId: 'session-1' }))

    expect(response.status).toBe(401)
    expect(getSession).not.toHaveBeenCalled()
  })

  it('returns not found for a session the actor does not own', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const response = await POST(request({ sessionId: 'session-1', format: 'json' }))

    expect(response.status).toBe(404)
    expect(exportChatToJSON).not.toHaveBeenCalled()
  })

  it('rejects invalid messages before exporting', async () => {
    vi.mocked(validateMessages).mockReturnValue({ valid: false, error: 'Invalid messages' })

    const response = await POST(request({ sessionId: 'session-1' }))

    expect(response.status).toBe(400)
    expect(exportChatToMarkdown).not.toHaveBeenCalled()
  })
})
