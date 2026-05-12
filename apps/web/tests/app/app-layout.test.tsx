import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '@/app/app/layout'
import { checkBetaAccess } from '@/lib/auth/beta-access'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

vi.mock('@/lib/auth/beta-access', () => ({
  checkBetaAccess: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(headers).mockResolvedValue(new Headers() as never)
  })

  it('preserves nested protected app routes in the login redirect', async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([
        ['x-th-pathname', '/app/admin/beta'],
        ['x-th-search', ''],
      ]) as never
    )
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      isAdmin: false,
      error: 'No authenticated user',
    })

    await expect(AppLayout({ children: <div /> })).rejects.toThrow(
      'redirect:/login?redirect=%2Fapp%2Fadmin%2Fbeta'
    )
    expect(redirect).toHaveBeenCalledWith(
      '/login?redirect=%2Fapp%2Fadmin%2Fbeta'
    )
  })
})
