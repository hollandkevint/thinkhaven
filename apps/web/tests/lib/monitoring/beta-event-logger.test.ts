import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import {
  getBetaEventCounts,
  logBetaEvent,
  recordBetaGateEvaluation,
} from '@/lib/monitoring/beta-event-logger'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

const query = vi.fn()

describe('beta event logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.mockResolvedValue({ rows: [], rowCount: 1 })
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('persists sanitized events with parameterized pg values', async () => {
    await expect(
      logBetaEvent({
        eventType: 'invite_copied',
        actorUserId: 'admin-1',
        targetUserId: 'user-1',
        betaAccessId: 'beta-1',
        targetEmail: 'Person@Example.com',
        requestPath: '/api/admin/beta-access/beta-1/invite',
        metadata: {
          destination: '/try',
          accessToken: 'secret',
          nested: { unsafe: true },
        },
      }),
    ).resolves.toBe(true)

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('insert into "public"."beta_auth_events"'),
      [
        'invite_copied',
        'admin-1',
        'user-1',
        'beta-1',
        expect.stringMatching(/^[a-f0-9]{64}$/),
        '/api/admin/beta-access/beta-1/invite',
        { destination: '/try' },
      ],
    )
  })

  it('is non-fatal when the database pool is unavailable', async () => {
    vi.mocked(getDatabasePool).mockImplementation(() => {
      throw new Error('DATABASE_URL is missing')
    })

    await expect(logBetaEvent({ eventType: 'waitlist_joined' })).resolves.toBe(false)
    await expect(getBetaEventCounts(60_000)).resolves.toBeNull()
    await expect(
      recordBetaGateEvaluation({ userId: 'user-1', status: 'pending' }),
    ).resolves.toBe(false)
  })

  it('aggregates event counts with a parameterized time bound', async () => {
    query.mockResolvedValue({
      rows: [
        { event_type: 'invite_copied' },
        { event_type: 'invite_copied' },
        { event_type: 'beta_gate_pending' },
      ],
    })

    await expect(getBetaEventCounts(60_000)).resolves.toEqual({
      invite_copied: 2,
      beta_gate_pending: 1,
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('where "created_at" >= $1'),
      [expect.any(String)],
    )
  })

  it('records gate state and first approved app access', async () => {
    const eventValues: unknown[][] = []
    query.mockImplementation(async (sql: string, values: unknown[]) => {
      if (sql.includes('from "public"."beta_access"')) {
        return {
          rows: [{
            id: 'beta-1',
            email: 'person@example.com',
            first_access_at: null,
          }],
        }
      }

      if (sql.includes('insert into "public"."beta_auth_events"')) {
        eventValues.push(values)
      }

      return { rows: [], rowCount: 1 }
    })

    await expect(
      recordBetaGateEvaluation({
        userId: 'user-1',
        email: 'person@example.com',
        status: 'approved',
      }),
    ).resolves.toBe(true)

    const updateCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('update "public"."beta_access"'),
    )
    expect(updateCall?.[1]).toEqual([
      expect.any(String),
      'approved',
      expect.any(String),
      expect.any(String),
      'beta-1',
    ])
    expect(eventValues).toHaveLength(2)
    expect(eventValues.map(([eventType]) => eventType)).toEqual([
      'beta_gate_approved',
      'first_app_access',
    ])
  })
})
