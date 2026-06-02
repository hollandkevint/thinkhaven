import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import MonitoringPage from '@/app/monitoring/page'
import { checkBetaAccess } from '@/lib/auth/beta-access'
import { redirect } from 'next/navigation'

vi.mock('@/lib/auth/beta-access', () => ({
  checkBetaAccess: vi.fn(),
}))

vi.mock('@/app/components/monitoring/AuthMetricsDashboard', () => ({
  default: () => <div>Metrics dashboard</div>,
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

describe('MonitoringPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a branded recovery state when auth access is unavailable', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      isAdmin: false,
      error: 'Authentication service unavailable',
    })

    const result = await MonitoringPage()
    const html = renderToStaticMarkup(result)

    expect(html).toContain('Monitoring is unavailable')
    expect(html).toContain('Monitoring data remains unavailable until access can be verified')
    expect(html).not.toContain('Metrics dashboard')
  })

  it('redirects unauthenticated visitors to login with the monitoring return path', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      isAdmin: false,
      error: 'No authenticated user',
    })

    await expect(MonitoringPage()).rejects.toThrow(
      'redirect:/login?redirect=%2Fmonitoring'
    )
    expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fmonitoring')
  })

  it('redirects non-admin authenticated users away from monitoring', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: { id: 'user-1', email: 'tester@example.com' },
      betaApproved: true,
      status: 'approved',
      isAdmin: false,
      error: null,
    })

    await expect(MonitoringPage()).rejects.toThrow('redirect:/app')
    expect(redirect).toHaveBeenCalledWith('/app')
  })

  it('renders monitoring for admin users', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: { id: 'admin-1', email: 'kholland7@gmail.com' },
      betaApproved: true,
      status: 'admin',
      isAdmin: true,
      error: null,
    })

    const result = await MonitoringPage()
    const html = renderToStaticMarkup(result)

    expect(html).toContain('Authentication Monitoring')
    expect(html).toContain('Metrics dashboard')
  })
})
