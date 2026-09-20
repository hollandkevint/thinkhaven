import { describe, expect, it, vi } from 'vitest'
import {
  migrateGuestSession,
  normalizeGuestMigrationInput,
} from '@/lib/db/repositories/guest-session-repository'

describe('guest session repository', () => {
  it('normalizes only the migration fields at the request boundary', () => {
    expect(normalizeGuestMigrationInput({
      sessionId: 'guest-1',
      pathway: 'plan-grill',
      messages: [],
      userId: 'attacker',
    })).toEqual({
      sessionId: 'guest-1',
      pathway: 'plan-grill',
      messages: [],
      utm: undefined,
    })
    expect(normalizeGuestMigrationInput({ sessionId: '', messages: [] })).toBeNull()
  })

  it('inserts sanitized messages for the actor with parameterized SQL', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ id: 'session-1' }] })
    const db = { query } as never

    await expect(migrateGuestSession('user-1', {
      sessionId: 'guest-1',
      pathway: 'plan-grill',
      messages: [
        { id: 'message-1', role: 'user', content: 'A'.repeat(5000), timestamp: 'now' },
        { id: 'message-2', role: 'assistant', content: 'Answer', timestamp: 'later' },
        { id: 'ignored', role: 'system', content: 'Nope' },
      ],
      utm: { utm_source: 'share', ref: 'must-not-persist' },
    }, db)).resolves.toEqual({ id: 'session-1', messageCount: 2 })

    expect(query).toHaveBeenCalledOnce()
    const [sql, params] = query.mock.calls[0]
    expect(sql).toMatch(/insert into public\.bmad_sessions/i)
    expect(sql).toMatch(/on conflict \(id\) do nothing/i)
    expect(sql).toMatch(/md5\(\$2 \|\| ':' \|\| \$1\)::uuid/i)
    expect(params[0]).toBe('guest-1')
    expect(params[1]).toBe('user-1')
    expect(JSON.parse(params[7])).toEqual([
      expect.objectContaining({ id: 'message-1', role: 'user', content: 'A'.repeat(4000) }),
      expect.objectContaining({ id: 'message-2', role: 'assistant' }),
    ])
    expect(JSON.parse(params[8])).toEqual({ utm_source: 'share' })
  })

  it('returns the actor-owned deterministic row on a retry', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'session-1' }] })
    const db = { query } as never

    await expect(migrateGuestSession('user-1', {
      sessionId: 'guest-1',
      messages: [{ role: 'user', content: 'Retry me' }],
    }, db)).resolves.toEqual({ id: 'session-1', messageCount: 1 })
    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[1][1]).toEqual(['user-1', 'guest-1'])
  })
})
