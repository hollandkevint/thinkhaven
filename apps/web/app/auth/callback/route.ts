import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authLogger } from '@/lib/monitoring/auth-logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Generate correlation ID for this authentication attempt
  const correlationId = `oauth_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log('OAuth Callback: Received request with params:', {
    hasCode: !!code,
    hasError: !!error,
    correlationId
  })

  // Handle OAuth errors
  if (error) {
    const latencyMs = Date.now() - startTime

    await authLogger.logAuthFailure(
      'oauth_google',
      'oauth_error',
      error_description || error,
      latencyMs,
      correlationId
    )

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()

    // Create Supabase client with standard cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies in callback:', error)
            }
          }
        }
      }
    )

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        const latencyMs = Date.now() - startTime

        await authLogger.logAuthFailure(
          'oauth_google',
          'code_exchange_error',
          exchangeError.message,
          latencyMs,
          correlationId
        )

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Verify session was created successfully
      if (!data?.session || !data?.user) {
        const latencyMs = Date.now() - startTime

        await authLogger.logAuthFailure(
          'oauth_google',
          'session_creation_failed',
          'Session created but no user data received',
          latencyMs,
          correlationId
        )

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication session creation failed')}`
        )
      }

      // Successful authentication
      const latencyMs = Date.now() - startTime
      await authLogger.logAuthSuccess(
        'oauth_google',
        data.user.id,
        data.user.email || '',
        latencyMs,
        correlationId,
        data.session.access_token.substring(0, 10) + '...',
        data.user.app_metadata?.provider
      )

      console.log('OAuth callback: Redirecting to app')
      return NextResponse.redirect(`${requestUrl.origin}/app`)

    } catch (err) {
      const latencyMs = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'oauth_google',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId
      )

      console.error('Unexpected error during code exchange:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      )
    }
  }

  // No code or error, redirect to login
  console.log('OAuth callback: No code or error parameter, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}