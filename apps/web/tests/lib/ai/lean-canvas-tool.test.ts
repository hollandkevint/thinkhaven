import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateLeanCanvas } from '@/lib/ai/tools/lean-canvas-tool'

const mocks = vi.hoisted(() => ({
  getDatabasePool: vi.fn(),
  query: vi.fn(),
}))

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: mocks.getDatabasePool,
}))

describe('updateLeanCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDatabasePool.mockReturnValue({ query: mocks.query })
  })

  it('merges validated fields for the authenticated owner', async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [{ lean_canvas: { problem: 'Pain', solution: 'Fix' } }],
    })

    await expect(updateLeanCanvas('session-1', 'user-1', {
      updates: {
        problem: 'Pain',
        solution: 'Fix',
        ignored: 'not a canvas field',
      } as never,
    })).resolves.toMatchObject({
      success: true,
      data: {
        updated_boxes: ['problem', 'solution'],
        current_canvas: { problem: 'Pain', solution: 'Fix' },
        empty_boxes: expect.arrayContaining(['channels']),
      },
    })

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringMatching(/where id = \$2\s+and user_id = \$3/),
      [JSON.stringify({ problem: 'Pain', solution: 'Fix' }), 'session-1', 'user-1'],
    )
  })

  it('rejects empty or unknown updates without touching the database', async () => {
    await expect(updateLeanCanvas('session-1', 'user-1', {
      updates: { ignored: 'not a canvas field' } as never,
    })).resolves.toEqual({ success: false, error: 'No valid canvas fields in updates' })

    expect(mocks.query).not.toHaveBeenCalled()
  })

  it('fails closed when the session is not owned by the caller', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] })

    await expect(updateLeanCanvas('session-1', 'user-2', {
      updates: { problem: 'Pain' },
    })).resolves.toEqual({ success: false, error: 'Session not found or access denied' })
  })
})
