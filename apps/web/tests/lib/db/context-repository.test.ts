import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countCompletedSessions,
  getLastCompletedSession,
  getOwnedContextInsights,
  getOwnedContextSession,
  getUserWorkspace,
} from '@/lib/db/repositories/context-repository'

const query = vi.fn()
const pool = { query } as never

describe('context repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads session context only for the authenticated owner', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'session-1', pathway: 'explore', current_phase: 'discovery', overall_completion: 25, sub_persona_state: null }],
    })

    await expect(getOwnedContextSession('session-1', 'user-1', pool)).resolves.toMatchObject({
      id: 'session-1',
      pathway: 'explore',
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where id = \$1\s+and user_id = \$2/),
      ['session-1', 'user-1'],
    )
  })

  it('scopes insight reads through the owned session', async () => {
    query.mockResolvedValueOnce({ rows: [{ output_data: { insight: 'Evidence' } }] })

    await expect(getOwnedContextInsights('session-1', 'user-2', pool)).resolves.toEqual([
      { output_data: { insight: 'Evidence' } },
    ])
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/inner join public\.bmad_sessions/),
      ['session-1', 'user-2'],
    )
  })

  it('uses the actor for workspace and completed-session reads', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ workspace_state: { role: 'Product lead' } }] })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ pathway: 'explore', overall_completion: 90 }] })

    await expect(getUserWorkspace('user-1', pool)).resolves.toEqual({
      workspace_state: { role: 'Product lead' },
    })
    await expect(countCompletedSessions('user-1', pool)).resolves.toBe(3)
    await expect(getLastCompletedSession('user-1', pool)).resolves.toEqual({
      pathway: 'explore',
      overall_completion: 90,
    })

    expect(query).toHaveBeenNthCalledWith(1, expect.stringMatching(/where user_id = \$1/), ['user-1'])
    expect(query).toHaveBeenNthCalledWith(2, expect.stringMatching(/status = 'completed'/), ['user-1'])
    expect(query).toHaveBeenNthCalledWith(3, expect.stringMatching(/status = 'completed'/), ['user-1'])
  })
})
