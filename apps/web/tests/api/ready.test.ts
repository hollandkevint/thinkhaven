import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import { GET } from '@/app/api/ready/route'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

describe('readiness API', () => {
  const query = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
  })

  it('reports ready after a database round trip', async () => {
    query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ready' })
  })

  it('fails closed when the database is unavailable', async () => {
    query.mockRejectedValueOnce(new Error('offline'))

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: 'unavailable' })
  })
})
