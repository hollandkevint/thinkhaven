import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import { EnvironmentValidator } from '@/lib/security/env-validator'
import { GET } from '@/app/api/ready/route'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

vi.mock('@/lib/security/env-validator', () => ({
  EnvironmentValidator: { validateProduction: vi.fn() },
}))

describe('readiness API', () => {
  const query = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
    vi.mocked(EnvironmentValidator.validateProduction).mockReturnValue({ isValid: true } as never)
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

  it('fails closed before querying when required production configuration is missing', async () => {
    vi.mocked(EnvironmentValidator.validateProduction).mockReturnValue({ isValid: false } as never)

    const response = await GET()

    expect(response.status).toBe(503)
    expect(query).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ status: 'unavailable' })
  })
})
