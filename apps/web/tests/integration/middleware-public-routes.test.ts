import { beforeEach, describe, expect, it, vi } from 'vitest'
import { middleware } from '../../middleware'
import { NextResponse } from 'next/server'

const nextResponse = {
  status: 200,
}

const redirectResponse = {
  status: 307,
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => nextResponse),
    redirect: vi.fn(() => redirectResponse),
  },
}))

type MiddlewareRequest = Parameters<typeof middleware>[0]

function requestFor(path: string, cookies: Array<[string, string]> = []) {
  return {
    headers: new Headers(),
    cookies: {
      getAll: vi.fn(() => cookies.map(([name, value]) => ({ name, value }))),
      set: vi.fn(),
    },
    nextUrl: new URL(path, 'http://localhost:3000'),
  } as unknown as MiddlewareRequest
}

describe('root middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['/', '/try', '/login', '/signup'])('passes public route %s through', (path) => {
    const response = middleware(requestFor(path))

    expect(response.status).toBe(200)
  })

  it('does not authorize legacy Supabase cookies or redirect /app', () => {
    const request = requestFor('/app', [['sb-example-auth-token', 'legacy-session']])
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(request.cookies.getAll).not.toHaveBeenCalled()
    expect(request.cookies.set).not.toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it('forwards the attempted path to app layout redirects', () => {
    middleware(requestFor('/app/admin/beta?tab=invites'))

    const nextOptions = vi.mocked(NextResponse.next).mock.calls[0]?.[0]
    const headers = nextOptions?.request?.headers

    expect(headers).toBeInstanceOf(Headers)
    expect(headers?.get('x-th-pathname')).toBe('/app/admin/beta')
    expect(headers?.get('x-th-search')).toBe('?tab=invites')
  })
})
