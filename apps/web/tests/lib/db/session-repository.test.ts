import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  renameSession,
} from '@/lib/db/repositories/session-repository'

const query = vi.fn()
const pool = { query } as never

describe('session repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists only the actor-owned sessions', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'session-1', user_id: 'user-1' }] })

    await expect(listSessions('user-1', pool)).resolves.toEqual([
      { id: 'session-1', user_id: 'user-1' },
    ])
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where user_id = \$1/),
      ['user-1'],
    )
  })

  it('reads an owned session and denies a cross-user read', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'session-1', user_id: 'user-1' }] })
    await expect(getSession('session-1', 'user-1', pool)).resolves.toMatchObject({
      id: 'session-1',
    })
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/where id = \$1\s+and user_id = \$2/),
      ['session-1', 'user-1'],
    )

    query.mockResolvedValueOnce({ rows: [] })
    await expect(getSession('session-1', 'user-2', pool)).resolves.toBeNull()
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/where id = \$1\s+and user_id = \$2/),
      ['session-1', 'user-2'],
    )
  })

  it('renames an owned session', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'session-1', title: 'Renamed' }] })

    await expect(renameSession('session-1', 'user-1', 'Renamed', pool)).resolves.toMatchObject({
      id: 'session-1',
      title: 'Renamed',
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where id = \$2\s+and user_id = \$3/),
      ['Renamed', 'session-1', 'user-1'],
    )
  })

  it('deletes only an owned session', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 })
    await expect(deleteSession('session-1', 'user-1', pool)).resolves.toBe(true)

    query.mockResolvedValueOnce({ rowCount: 0 })
    await expect(deleteSession('session-1', 'user-2', pool)).resolves.toBe(false)
    expect(query).toHaveBeenLastCalledWith(
      expect.stringMatching(/where id = \$1\s+and user_id = \$2/),
      ['session-1', 'user-2'],
    )
  })

  it('creates and charges a session in one transaction', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ balance: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'session-1' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    }
    const transactionPool = { connect: vi.fn().mockResolvedValue(client) } as never

    await expect(createSession({
      userId: 'user-1',
      pathway: 'explore',
      title: 'New Session',
      currentPhase: 'discovery',
      messageLimit: 20,
      chargeCredit: true,
    }, transactionPool)).resolves.toEqual({ status: 'created', id: 'session-1' })

    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/for update/),
      ['user-1'],
    )
    expect(client.query).toHaveBeenNthCalledWith(
      5,
      expect.stringMatching(/credit_transactions/),
      ['user-1', 1, 'session-1'],
    )
    expect(client.query).toHaveBeenLastCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('rolls back without creating a session when credits are insufficient', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ balance: 0 }] })
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    }
    const transactionPool = { connect: vi.fn().mockResolvedValue(client) } as never

    await expect(createSession({
      userId: 'user-1',
      pathway: 'explore',
      title: 'New Session',
      currentPhase: 'discovery',
      messageLimit: 20,
      chargeCredit: true,
    }, transactionPool)).resolves.toEqual({ status: 'insufficient-credits' })

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })
})
