import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/artifact/[token]/route'
import { getDatabasePool } from '@/lib/db/pool'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

const query = vi.fn()

describe('artifact reference API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.mockReset()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('looks up one exact token and does not expose a generic listing', async () => {
    query.mockResolvedValueOnce({ rows: [{ title: 'Decision', content: '# Decision' }] })

    const response = await GET(
      new Request('http://test.local/api/artifact/aaaaaaaaaaaaaaaaaaaaaa'),
      { params: Promise.resolve({ token: 'aaaaaaaaaaaaaaaaaaaaaa' }) },
    )

    expect(response.status).toBe(200)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE "token" = $1'),
      ['aaaaaaaaaaaaaaaaaaaaaa'],
    )
    expect(query.mock.calls[0][0]).not.toMatch(/SELECT\s+\*|FROM\s+"public"\."public_artifacts"\s*$/i)
  })

  it('rejects malformed tokens before touching the database', async () => {
    const response = await GET(
      new Request('http://test.local/api/artifact/not-a-token'),
      { params: Promise.resolve({ token: 'not-a-token' }) },
    )

    expect(response.status).toBe(404)
    expect(query).not.toHaveBeenCalled()
  })
})
