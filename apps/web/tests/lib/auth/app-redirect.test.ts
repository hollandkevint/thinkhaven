import { describe, expect, it } from 'vitest'
import {
  getProtectedAppRedirectTarget,
  isProtectedAppPath,
} from '@/lib/auth/app-redirect'

describe('getProtectedAppRedirectTarget', () => {
  it('preserves nested app routes and query strings', () => {
    expect(
      getProtectedAppRedirectTarget('/app/admin/beta', '?tab=invites')
    ).toBe('/app/admin/beta?tab=invites')
  })

  it('keeps the app dashboard as a valid target', () => {
    expect(getProtectedAppRedirectTarget('/app', '')).toBe('/app')
  })

  it('falls back to app dashboard for non-app paths', () => {
    expect(getProtectedAppRedirectTarget('/login', '?redirect=/evil')).toBe('/app')
  })

  it('does not treat app-like public paths as protected app routes', () => {
    expect(isProtectedAppPath('/apple')).toBe(false)
    expect(isProtectedAppPath('/appetite')).toBe(false)
  })
})
