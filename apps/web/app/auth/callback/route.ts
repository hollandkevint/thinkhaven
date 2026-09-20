import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authLogger } from '@/lib/monitoring/auth-logger'
import { isSafeRedirectPath } from '@/lib/beta/invite-destinations'

function safeNextPath(requestUrl: URL): string {
  const next = requestUrl.searchParams.get('next')
  return isSafeRedirectPath(next) ? next : '/app'
}

function loginRedirect(requestUrl: URL, error?: string): NextResponse {
  const url = new URL('/login', requestUrl.origin)
  if (error) url.searchParams.set('error', error)

  const next = safeNextPath(requestUrl)
  if (next !== '/app') url.searchParams.set('redirect', next)
  return NextResponse.redirect(url)
}

/**
 * Compatibility endpoint for links created before Better Auth.
 * Better Auth now completes OAuth at /api/auth/callback/:provider.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestUrl = new URL(request.url)
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const code = requestUrl.searchParams.get('code')
  const correlationId = `oauth_callback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  if (error) {
    await authLogger.logAuthFailure(
      'oauth_google',
      'oauth_error',
      errorDescription || error,
      Date.now() - startTime,
      correlationId,
    )
    return loginRedirect(requestUrl, errorDescription || error)
  }

  if (code) {
    await authLogger.logAuthFailure(
      'oauth_google',
      'legacy_callback',
      'Legacy OAuth callback received; restart sign-in through Better Auth.',
      Date.now() - startTime,
      correlationId,
    )
    return loginRedirect(requestUrl, 'Please sign in again to continue.')
  }

  console.warn('[AUTH] Legacy OAuth callback hit without code or error')
  return loginRedirect(requestUrl)
}
