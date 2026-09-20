import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import {
  loadSessionState,
  recordInsight,
} from '@/lib/session/session-primitives'

vi.mock('@/lib/db/pool', () => ({ getDatabasePool: vi.fn() }))

const query = vi.fn()

describe('PostgreSQL session primitives', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('loads only the actor-owned session', async () => {
    query.mockResolvedValueOnce({
      rows: [{
        id: 'session-1',
        user_id: 'user-1',
        workspace_id: 'user-1',
        pathway: 'explore',
        current_phase: 'discovery',
        current_template: 'general',
        status: 'active',
        overall_completion: '25',
        current_step: 'chat',
        next_steps: [],
        start_time: '2026-09-19T12:00:00.000Z',
        end_time: null,
        created_at: '2026-09-19T12:00:00.000Z',
        updated_at: '2026-09-19T12:00:00.000Z',
      }],
    })

    await expect(loadSessionState('session-1', 'user-1')).resolves.toMatchObject({
      id: 'session-1',
      userId: 'user-1',
      overallCompletion: 25,
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE id = \$1 AND user_id = \$2/),
      ['session-1', 'user-1'],
    )
  })

  it('records an insight through an ownership-checked insert', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'output-1' }] })

    await expect(recordInsight(
      'session-1',
      'user-1',
      'Customers need faster answers',
      'market',
    )).resolves.toBe('output-1')

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE s.id = \$1 AND s.user_id = \$2/),
      expect.arrayContaining(['session-1', 'user-1']),
    )
  })
})
