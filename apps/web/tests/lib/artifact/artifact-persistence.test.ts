import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import { loadArtifacts, saveArtifact, saveArtifacts } from '@/lib/artifact/artifact-persistence'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

const query = vi.fn()

const artifact = {
  id: 'artifact-1',
  sessionId: 'session-1',
  type: 'decision-record' as const,
  title: 'Decision',
  content: '# Decision',
  metadata: { source: 'test' },
  viewMode: 'inline' as const,
  renderMode: 'rendered' as const,
  createdAt: new Date('2026-09-19T12:00:00.000Z'),
  updatedAt: new Date('2026-09-19T12:00:00.000Z'),
}

describe('artifact persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.mockReset()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('uses parameterized SQL for an upsert', async () => {
    query.mockResolvedValueOnce({ rows: [] })

    await saveArtifact(artifact, 'session-1')

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("id") DO UPDATE'),
      expect.arrayContaining(['artifact-1', 'session-1', 'Decision', '# Decision']),
    )
    expect(query.mock.calls[0][0]).not.toContain('artifact-1')
    expect(query.mock.calls[0][0]).not.toContain('session-1')
  })

  it('scopes reads to one session and rejects an absent verified table', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    await expect(loadArtifacts('session-1')).resolves.toEqual([])
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE "session_id" = $1'), ['session-1'])

    query.mockRejectedValueOnce({ code: '42P01' })
    await expect(loadArtifacts('session-1')).rejects.toThrow('session_artifacts is not present')
  })

  it('does not query for an empty batch', async () => {
    await saveArtifacts([], 'session-1')
    expect(query).not.toHaveBeenCalled()
  })
})
