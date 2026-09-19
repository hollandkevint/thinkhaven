import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRailwayAuth } from '@/lib/auth/railway-auth'
import {
  getRailwaySession,
  RailwayAuthRequiredError,
  requireRailwaySession,
} from '@/lib/auth/railway-session'

vi.mock('@/lib/auth/railway-auth', () => ({
  getRailwayAuth: vi.fn(),
}))

const getSession = vi.fn()

describe('Railway session guard', () => {
  const request = new Request('http://localhost/api/example', {
    headers: {
      cookie: 'better-auth.session_token=session-token',
      host: 'localhost',
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRailwayAuth).mockReturnValue({ api: { getSession } } as never)
  })

  it('fails closed with a typed 401 when no session is present', async () => {
    getSession.mockResolvedValue(null)

    await expect(requireRailwaySession(request)).rejects.toBeInstanceOf(RailwayAuthRequiredError)
    await expect(requireRailwaySession(request)).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required',
      status: 401,
    })
  })

  it('returns the injected Better Auth user and session without a database call', async () => {
    const authenticated = {
      user: { id: 'user-1', email: 'user@example.com', name: 'User' },
      session: { id: 'session-1', userId: 'user-1' },
    }
    getSession.mockResolvedValue(authenticated)

    await expect(getRailwaySession(request)).resolves.toBe(authenticated)
    expect(getSession).toHaveBeenCalledWith({ headers: request.headers })
  })
})
