import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge Runtime compatible middleware for Supabase session management
 *
 * This implementation avoids Node.js APIs and heavy Supabase client imports
 * that are incompatible with Vercel's Edge Runtime. Instead, it performs
 * lightweight cookie management to maintain auth sessions.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Validate environment variables are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables')
    return response
  }

  try {
    // Get existing auth cookies
    const accessToken = request.cookies.get('sb-access-token')
    const refreshToken = request.cookies.get('sb-refresh-token')

    // If we have tokens, validate they're not expired by checking with Supabase
    // Using a lightweight fetch instead of full Supabase client
    if (accessToken?.value && refreshToken?.value) {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'apikey': supabaseAnonKey,
        },
        // Edge Runtime compatible timeout
        signal: AbortSignal.timeout(5000),
      })

      // If unauthorized, attempt token refresh
      if (authResponse.status === 401 && refreshToken?.value) {
        const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            refresh_token: refreshToken.value,
          }),
          signal: AbortSignal.timeout(5000),
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()

          // Update cookies with new tokens
          response.cookies.set('sb-access-token', data.access_token, {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
          })

          response.cookies.set('sb-refresh-token', data.refresh_token, {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
          })
        } else {
          // Refresh failed, clear invalid tokens
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
        }
      }
    }
  } catch (error) {
    // Fail gracefully - allow request through even if session refresh fails
    console.error('[Middleware] Session update error:', error)
  }

  return response
}
