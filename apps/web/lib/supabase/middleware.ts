import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Special handling for auth callback route - don't interfere with OAuth flow
  if (request.nextUrl.pathname === '/auth/callback') {
    return NextResponse.next({
      request,
    })
  }

  // Special handling for post-OAuth app access - bypass session check on OAuth success
  if (request.nextUrl.pathname === '/app' && request.nextUrl.searchParams.get('auth_success') === 'true') {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // Validate environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Environment variables not available, allow request through without auth check
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Ensure consistent cookie settings
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // DISABLED: Complex manual auth cookie checking - simplified for Story 0.1
  // const accessToken = request.cookies.get('sb-access-token')?.value
  // let user = null
  
  // if (accessToken) {
  //   try {
  //     const { data, error } = await supabase.auth.getUser(accessToken)
  //     if (!error && data.user) {
  //       user = data.user
  //     }
  //   } catch (_err) {
  //     // Auth cookie verification failed, fallback to default method
  //   }
  // }
  
  // Simplified: Use default getUser only
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // SECURITY FIX: Remove dangerous development mode bypass
  // This was allowing unauthorized access in production if NODE_ENV wasn't set correctly
  // Instead, handle protected routes properly with proper auth checks


  // Define route security policies
  const publicRoutes = ['/', '/login', '/signup', '/resend-confirmation', '/.well-known', '/auth/callback']
  const testOnlyRoutes = ['/test-dual-pane', '/test-bmad-buttons'] // Restrict these in production
  const staticAssets = ['.css', '.js', '.map', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  const isTestRoute = testOnlyRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  const isStaticAsset = staticAssets.some(ext =>
    request.nextUrl.pathname.includes(ext)
  )

  // SECURITY: In production, restrict access to test routes
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction && isTestRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow API access from test pages only in development or for authenticated users
  const referer = request.headers.get('referer') || '';
  const isTestApiRequest = request.nextUrl.pathname.startsWith('/api/bmad') && referer.includes('/test-bmad-buttons');

  if (isTestApiRequest && isProduction && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const shouldSkipAuth = isPublicRoute || isStaticAsset || (isTestRoute && !isProduction) || isTestApiRequest

  // SECURITY: Proper auth enforcement for protected routes
  if (!user && !shouldSkipAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Store the attempted URL to redirect after login (avoid redirect loops)
    if (request.nextUrl.pathname !== '/login' && request.nextUrl.pathname !== '/') {
      url.searchParams.set('redirect', request.nextUrl.pathname)
    }
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (but allow landing page)
  const authPages = ['/login', '/signup']
  if (user && authPages.includes(request.nextUrl.pathname)) {
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    const url = request.nextUrl.clone()
    url.pathname = redirectParam || '/app'
    url.search = '' // Clear search params to avoid redirect loops
    return NextResponse.redirect(url)
  }

  // SECURITY: Add production security headers
  if (isProduction) {
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('X-Frame-Options', 'DENY')
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // Content Security Policy for production
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://accounts.google.com",
      "frame-src https://accounts.google.com"
    ]
    supabaseResponse.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object if needed, but avoid changing the
  //    cookies!

  return supabaseResponse
}