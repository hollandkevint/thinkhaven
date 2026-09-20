import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from '@/app/api/artifact/share/route'
import { getDatabasePool } from '@/lib/db/pool'
import { getRailwaySession } from '@/lib/auth/railway-session'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: vi.fn(),
}))

const query = vi.fn()

function request(body: unknown) {
  return new Request('http://test.local/api/artifact/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('artifact share API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never)
    vi.mocked(getRailwaySession).mockResolvedValue(null)
    query.mockReset()
  })

  it('rejects an empty artifact', async () => {
    const response = await POST(request({ title: 'X', content: '   ', source: 'guest' }))
    expect(response.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('rejects an oversized artifact', async () => {
    const response = await POST(request({ content: 'a'.repeat(50001), source: 'guest' }))
    expect(response.status).toBe(413)
    expect(query).not.toHaveBeenCalled()
  })

  it('returns 503 when the database is unavailable', async () => {
    vi.mocked(getDatabasePool).mockImplementation(() => {
      throw new Error('DATABASE_URL is missing')
    })

    const response = await POST(request({ content: '# Decision\n- ok', source: 'guest' }))
    expect(response.status).toBe(503)
  })

  it('creates a public artifact and returns a /share token URL', async () => {
    query.mockResolvedValueOnce({ rows: [] })

    const response = await POST(request({
      title: 'Pivot to mid-market',
      content: '# Pivot\n\n## Resolved Decisions\n- Focus mid-market',
      pathway: 'plan-grill',
      source: 'guest',
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toMatch(/^\/share\/[A-Za-z0-9_-]+$/)
    expect(body.absoluteUrl).toMatch(/^https?:\/\/.+\/share\/.+$/)
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(10)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "public"."public_artifacts"'),
      expect.arrayContaining(['Pivot to mid-market', '# Pivot\n\n## Resolved Decisions\n- Focus mid-market', 'plan-grill', 'guest']),
    )
  })

  it('coerces an unknown source to guest', async () => {
    query.mockResolvedValueOnce({ rows: [] })

    await POST(request({ content: '# D', source: 'totally-made-up' }))

    expect(query.mock.calls[0][1]).toEqual(expect.arrayContaining(['guest']))
  })

  it('preserves the insert failure response shape', async () => {
    query.mockRejectedValueOnce(new Error('insert failed'))

    const response = await POST(request({ content: '# D', source: 'guest' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Could not create share link' })
  })

  it('reuses an existing token without inserting a new artifact row', async () => {
    const token = 'a'.repeat(22)
    const response = await POST(request({ content: '# D', source: 'guest', token }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ token, url: `/share/${token}` })
    expect(query).not.toHaveBeenCalled()
  })

  it('captures a lead idempotently with a parameterized beta insert', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })

    await POST(request({ content: '# D', source: 'guest', email: 'person@example.com' }))

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ON CONFLICT ("email") DO NOTHING'),
      ['person@example.com', 'plan_grill_artifact'],
    )
  })

  it('requires the authenticated caller to own a session-linked artifact', async () => {
    vi.mocked(getRailwaySession).mockResolvedValue({ user: { id: 'owner-1' } } as never)
    query.mockResolvedValueOnce({ rows: [] })

    const response = await POST(request({
      content: '# D',
      source: 'session',
      sessionId: 'session-1',
    }))

    expect(response.status).toBe(404)
    expect(query).toHaveBeenCalledWith(expect.stringContaining('"user_id" = $2'), ['session-1', 'owner-1'])
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('parameterizes the ownership and artifact inserts for an owned session', async () => {
    vi.mocked(getRailwaySession).mockResolvedValue({ user: { id: 'owner-1' } } as never)
    query.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] }).mockResolvedValueOnce({ rows: [] })

    const response = await POST(request({
      title: 'Owned',
      content: '# D',
      source: 'session',
      sessionId: 'session-1',
    }))

    expect(response.status).toBe(200)
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('VALUES ($1, $2, $3, $4, $5, $6, $7)'),
      expect.arrayContaining(['session-1']),
    )
    expect(query.mock.calls[1][0]).not.toContain('session-1')
  })
})
