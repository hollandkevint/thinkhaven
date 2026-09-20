import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getOwnedDocumentSession,
  getOwnedSessionInsights,
  insertOwnedGeneratedDocument,
  updateOwnedLeanCanvas,
} from '@/lib/db/repositories/ai-artifact-repository'

const query = vi.fn()
const pool = { query } as never

describe('AI artifact repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads document session state only for the authenticated owner', async () => {
    query.mockResolvedValueOnce({ rows: [{ pathway: 'explore', current_phase: 'discovery' }] })

    await expect(getOwnedDocumentSession('session-1', 'user-1', pool)).resolves.toEqual({
      pathway: 'explore',
      current_phase: 'discovery',
    })
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where id = \$1\s+and user_id = \$2/),
      ['session-1', 'user-1'],
    )
  })

  it('scopes insight reads to the authenticated owner', async () => {
    query.mockResolvedValueOnce({ rows: [] })

    await expect(getOwnedSessionInsights('session-1', 'user-2', pool)).resolves.toEqual([])
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/inner join public\.bmad_sessions/),
      ['session-1', 'user-2'],
    )
  })

  it('uses an ownership-guarded parameterized document insert', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'document-1' }] })

    await expect(insertOwnedGeneratedDocument(
      'session-1',
      'user-1',
      { name: 'Plan', type: 'decision_record', content: '# Plan' },
      pool,
    )).resolves.toBe('document-1')

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where exists \(/),
      ['session-1', 'Plan', 'decision_record', '# Plan', 'user-1'],
    )
    expect(query.mock.calls[0][0]).not.toContain('session-1')
    expect(query.mock.calls[0][0]).not.toContain('user-1')
  })

  it('merges the owned lean canvas with a parameterized JSON value', async () => {
    query.mockResolvedValueOnce({ rows: [{ lean_canvas: { problem: 'Pain' } }] })

    await expect(updateOwnedLeanCanvas(
      'session-1',
      'user-1',
      { problem: 'Pain' },
      pool,
    )).resolves.toEqual({ problem: 'Pain' })

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where id = \$2\s+and user_id = \$3/),
      [JSON.stringify({ problem: 'Pain' }), 'session-1', 'user-1'],
    )
  })
})
