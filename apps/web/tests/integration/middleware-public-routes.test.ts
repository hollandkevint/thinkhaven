import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServerClient } from '@supabase/ssr'
import { middleware } from '../../middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

const nextResponse = {
  status: 200,
  cookies: {
    set: vi.fn(),
  },
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => nextResponse),
  },
}))

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
type MiddlewareRequest = Parameters<typeof middleware>[0]
type SupabaseClient = ReturnType<typeof createServerClient>

function requestFor(path: string) {
  return {
    cookies: {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    },
    nextUrl: new URL(path, 'http://localhost:3000'),
  } as unknown as MiddlewareRequest
}

describe('root middleware public-route resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextResponse.cookies.set.mockClear()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
  })

  it.each(['/', '/try', '/login', '/signup'])('does not create a Supabase client without env for %s', async (path) => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const response = await middleware(requestFor(path))

    expect(response.status).toBe(200)
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('refreshes the Supabase session when env is present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser },
    } as unknown as SupabaseClient)

    const response = await middleware(requestFor('/try'))

    expect(response.status).toBe(200)
    expect(createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    )
    expect(getUser).toHaveBeenCalled()
  })
})
