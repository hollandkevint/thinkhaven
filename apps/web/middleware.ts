import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isProtectedAppPath } from './lib/auth/app-redirect'

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-th-pathname', request.nextUrl.pathname)
  requestHeaders.set('x-th-search', request.nextUrl.search)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
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
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates JWT and refreshes if needed
  // Do NOT use getSession() - it only validates locally
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtectedAppPath(request.nextUrl.pathname)) {
    const url = new URL(request.nextUrl.toString())
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set(
      'redirect',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
