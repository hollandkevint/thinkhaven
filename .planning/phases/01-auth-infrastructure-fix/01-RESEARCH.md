# Phase 1: Auth Infrastructure Fix - Research

**Phase:** 01-auth-infrastructure-fix
**Researched:** 2026-01-30
**Source:** Extracted from project research (ARCHITECTURE.md, SUMMARY.md)
**Confidence:** HIGH

## Phase Goal

Users can reliably authenticate with email/password and OAuth

## Requirements to Address

- AUTH-01: Remove deprecated `@supabase/auth-helpers-nextjs` package and migrate to `@supabase/ssr`
- AUTH-02: Create minimal middleware.ts that refreshes Supabase session tokens
- AUTH-03: Replace all `getSession()` calls with `getUser()` in API routes for security
- AUTH-04: Fix OAuth callback route to redirect to `/app` instead of legacy `/dashboard`
- AUTH-05: User can log in with email/password and stay logged in across browser refresh
- AUTH-06: User can log in with Google OAuth and access the app
- AUTH-07: User can log out from any page

## Root Cause Analysis

ThinkHaven's auth issues stem from three architectural problems:

1. **Disabled middleware** leaves no mechanism for session token refresh
2. **Using `getSession()` instead of `getUser()`** in server contexts creates security vulnerabilities
3. **OAuth callback** redirects to `/dashboard` but session cookies may not be set properly
4. **Deprecated package conflict** - `@supabase/auth-helpers-nextjs` conflicts with `@supabase/ssr`

## Implementation Approach

### Pattern 1: Minimal Token-Refresh Middleware

Middleware that ONLY refreshes tokens, no redirects or route protection.

```typescript
// middleware.ts (root of apps/web/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates JWT and refreshes if needed
  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Pattern 2: Route-Level Protection with getUser()

Each protected route/API validates auth independently using `getUser()`.

```typescript
// API Route example
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Pattern 3: OAuth Callback with Proper Cookie Setting

```typescript
// app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/app'  // NOT /dashboard

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
}
```

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Remove `@supabase/auth-helpers-nextjs` | Eliminate deprecated package conflict |
| `middleware.ts` | Create new (rename from .disabled) | Token refresh |
| `lib/supabase/server.ts` | Update | Proper async cookie handling |
| `app/auth/callback/route.ts` | Update | Fix OAuth flow |
| `app/api/chat/stream/route.ts` | Update | getSession → getUser |
| `app/api/bmad/route.ts` | Update | getSession → getUser |
| All other API routes | Audit | getSession → getUser |

## Build Order

1. **Remove deprecated package** - Eliminates interference
2. **Enable minimal middleware** - Unblocks all other auth
3. **Update server client** - Proper cookie handling
4. **Fix OAuth callback** - Most critical user flow
5. **Update API routes** - Security hardening (can be parallelized)
6. **Test end-to-end** - Verify all flows work

## Anti-Patterns to Avoid

- **Using `getSession()` on Server** - Only validates JWT format/expiry locally, doesn't verify with Supabase
- **Middleware with Redirect Logic** - Creates redirect loops when auth state is inconsistent
- **Route Prefetching After Auth** - Prefetch fires before browser processes auth tokens

## Security Notes

- Next.js 15.5.7 is safe from CVE-2025-29927
- `@supabase/ssr` 0.7.0 supports all recommended patterns
- RLS policies remain database-level defense

## Dependencies

- None (first phase)

## Risks

- Removing `@supabase/auth-helpers-nextjs` may break imports (need to find/replace)
- Existing logged-in users may need to re-authenticate after middleware change

---
*Phase research: 2026-01-30*
*Ready for planning: yes*
