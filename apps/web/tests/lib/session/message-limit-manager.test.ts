import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import {
  checkMessageLimit,
  incrementMessageCount,
} from '@/lib/session/message-limit-manager'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

const query = vi.fn()

describe('message limit manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MESSAGE_LIMIT_ENABLED = 'true'
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('checks and increments only an actor-owned session', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ current_count: 14, message_limit: 20 }] })
      .mockResolvedValueOnce({ rows: [{ new_count: 15, message_limit: 20, limit_reached: false }] })

    await expect(checkMessageLimit('session-1', 'user-1')).resolves.toMatchObject({
      currentCount: 14,
      remaining: 6,
      limitReached: false,
    })
    await expect(incrementMessageCount('session-1', 'user-1')).resolves.toEqual({
      newCount: 15,
      messageLimit: 20,
      limitReached: false,
    })

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/WHERE id = \$1 AND user_id = \$2/),
      ['session-1', 'user-1'],
    )
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/WHERE id = \$1 AND user_id = \$2/),
      ['session-1', 'user-1'],
    )
  })

  it('fails closed when the actor does not own the session', async () => {
    query.mockResolvedValue({ rows: [] })

    await expect(incrementMessageCount('session-1', 'user-2')).resolves.toBeNull()
  })
})
