import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import { getRailwaySession } from '@/lib/auth/railway-session'
import { checkBetaAccess } from '@/lib/auth/beta-access'
import { recordBetaGateEvaluation } from '@/lib/monitoring/beta-event-logger'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: vi.fn(),
}))

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  recordBetaGateEvaluation: vi.fn().mockResolvedValue(true),
}))

const query = vi.fn()

function session(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-1',
      email: 'person@example.com',
      name: 'Person',
      ...overrides,
    },
  }
}

describe('checkBetaAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
    vi.mocked(getRailwaySession).mockResolvedValue(session() as never)
    query.mockResolvedValue({ rows: [] })
  })

  it('uses the Better Auth session identity and parameterized beta lookup', async () => {
    query.mockResolvedValue({
      rows: [{ approved_at: '2026-09-19T12:00:00.000Z', revoked_at: null }],
    })

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-1', email: 'person@example.com' },
      betaApproved: true,
      status: 'approved',
      isAdmin: false,
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('where "user_id" = $1'),
      ['user-1'],
    )
    expect(recordBetaGateEvaluation).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'person@example.com',
      status: 'approved',
      requestPath: undefined,
    })
  })

  it('fails closed for revoked access and infrastructure errors', async () => {
    query.mockResolvedValue({
      rows: [{ approved_at: '2026-09-19T12:00:00.000Z', revoked_at: '2026-09-19T13:00:00.000Z' }],
    })
    await expect(checkBetaAccess()).resolves.toMatchObject({
      betaApproved: false,
      status: 'revoked',
    })

    query.mockRejectedValue(new Error('database unavailable'))
    await expect(checkBetaAccess()).resolves.toMatchObject({
      betaApproved: false,
      status: 'unavailable',
      error: 'Beta access lookup failed',
    })
  })

  it('does not query beta state for admins or unauthenticated callers', async () => {
    vi.mocked(getRailwaySession).mockResolvedValue(
      session({ email: 'kholland7@gmail.com' }) as never,
    )
    await expect(checkBetaAccess()).resolves.toMatchObject({
      betaApproved: true,
      status: 'admin',
      isAdmin: true,
    })
    expect(query).not.toHaveBeenCalled()

    vi.mocked(getRailwaySession).mockResolvedValue(null)
    await expect(checkBetaAccess()).resolves.toMatchObject({
      betaApproved: false,
      status: 'unauthenticated',
    })
    expect(query).not.toHaveBeenCalled()
  })
})
