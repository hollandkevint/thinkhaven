# Architecture Patterns: Next.js 15 + Supabase Auth Without Middleware

**Domain:** Next.js 15 authentication with Supabase
**Researched:** 2026-01-29
**Overall Confidence:** MEDIUM-HIGH (verified against official Supabase docs + community patterns)

## Executive Summary

ThinkHaven's auth issues stem from three architectural problems:
1. **Disabled middleware** leaves no mechanism for session token refresh
2. **Using `getSession()` instead of `getUser()`** in server contexts creates security vulnerabilities
3. **OAuth callback** redirects to `/dashboard` but session cookies may not be set properly

The fix doesn't require re-enabling complex middleware. Instead, implement a **minimal refresh-only middleware** + **route-level protection with `getUser()`** pattern now recommended by Supabase for 2025/2026.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ AuthContext │───▶│ Browser      │───▶│ onAuthStateChange │  │
│  │ (getSession)│    │ Supabase     │    │ listener          │  │
│  └─────────────┘    │ Client       │    └──────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Minimal Middleware                            │
│  - ONLY refreshes tokens via supabase.auth.getUser()            │
│  - NO redirects, NO route protection                            │
│  - Passes refreshed cookies to Server Components                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Route-Level Protection                          │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ API Routes   │    │ Server       │    │ OAuth Callback   │  │
│  │ getUser()    │    │ Components   │    │ Route Handler    │  │
│  │ auth check   │    │ getUser()    │    │ exchangeCode()   │  │
│  └──────────────┘    └──────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                            │
│  - RLS policies enforce security at data layer                  │
│  - JWT validated on every request                               │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Browser Supabase Client | Client-side auth UI, OAuth initiation | Supabase Auth, AuthContext |
| AuthContext | React state for user, loading, signOut | Browser Client, UI components |
| Minimal Middleware | Token refresh ONLY (no redirects) | cookies(), Server Client |
| Server Supabase Client | Server-side auth verification | Supabase Auth, RLS |
| API Route Handlers | Per-route auth guards with `getUser()` | Server Client, Business Logic |
| OAuth Callback Route | Code exchange, cookie setting | Server Client, redirect |
| Email Confirm Route | Token hash verification | Server Client, redirect |

---

## Patterns to Follow

### Pattern 1: Minimal Token-Refresh Middleware

**What:** Middleware that ONLY refreshes tokens, no redirects or route protection.

**When:** Always. Server Components can't write cookies, so middleware handles refresh.

**Example:**
```typescript
// middleware.ts (root of apps/web/)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use getSession() here
  // getUser() validates JWT and refreshes if needed
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip static files, images, favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Why this works:**
- Calls `getUser()` which sends a request to Supabase Auth to validate/refresh
- Sets refreshed cookies in both request (for Server Components) and response (for browser)
- No redirect logic = no redirect loops

---

### Pattern 2: Route-Level Protection with `getUser()`

**What:** Each protected route/API validates auth independently using `getUser()`.

**When:** Every API route and Server Component that needs auth.

**Example (API Route):**
```typescript
// app/api/protected/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // CRITICAL: Use getUser(), NOT getSession()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // User is authenticated, proceed
  return NextResponse.json({ user: user.email })
}
```

**Example (Server Component):**
```typescript
// app/app/session/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <div>Welcome, {user.email}</div>
}
```

---

### Pattern 3: OAuth Callback with Proper Cookie Setting

**What:** Route handler that exchanges auth code and ensures cookies are set before redirect.

**When:** OAuth providers (Google) redirect back to your app.

**Example:**
```typescript
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/app'

  if (code) {
    const cookieStore = await cookies()

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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context, ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to a page WITHOUT prefetch to allow cookies to propagate
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
}
```

**Critical Notes:**
- Redirect to `/app` (protected area), not `/dashboard` (legacy route)
- The `next` parameter allows preserving original destination
- Cookie `setAll` may silently fail in Server Component context - that's OK, middleware handles refresh

---

### Pattern 4: Email Verification Callback

**What:** Route handler for email confirmation links using token_hash.

**When:** User clicks confirmation email link.

**Prerequisite:** Update Supabase email template to use:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

**Example:**
```typescript
// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/app'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
```

---

### Pattern 5: Server Client with Proper Cookie Handling

**What:** Server-side Supabase client factory with async cookies.

**When:** Every server-side auth operation.

**Example:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - OK, middleware handles this
          }
        },
      },
    }
  )
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using `getSession()` on Server

**What:** Calling `supabase.auth.getSession()` in API routes or Server Components.

**Why bad:**
- Only validates JWT format/expiry locally
- Does NOT verify with Supabase Auth server
- Cookies can be spoofed
- Creates security vulnerability

**Instead:** Always use `supabase.auth.getUser()` on server.

---

### Anti-Pattern 2: Middleware with Redirect Logic

**What:** Adding `if (!user) redirect('/login')` in middleware.

**Why bad:**
- Creates redirect loops when auth state is inconsistent
- Race conditions with OAuth callbacks
- Browser prefetch can trigger redirects before cookies set

**Instead:** Route-level redirects only. Middleware for token refresh only.

---

### Anti-Pattern 3: Short Cookie Expiry

**What:** Setting short `Max-Age` or `Expires` on auth cookies.

**Why bad:**
- Doesn't actually end the session (session lives in Supabase Auth)
- Just prevents browser from sending cookies
- Creates "phantom logged out" state

**Instead:** Let Supabase control token validity. Set cookies with far-future expiry.

---

### Anti-Pattern 4: Route Prefetching After Auth

**What:** Using `<Link prefetch={true}>` or `router.push()` immediately after sign-in.

**Why bad:**
- Prefetch requests fire before browser processes auth tokens
- Server sees unauthenticated request, renders wrong content
- Creates flash of unauthenticated UI

**Instead:** Redirect to a single "auth landing" page (like `/app`) with no aggressive prefetch.

---

## Current ThinkHaven Issues & Fixes

### Issue 1: Login Fails
**Root cause:** `AuthContext.tsx` initiates OAuth correctly, but callback may not set cookies properly due to middleware being disabled.

**Fix order:**
1. Implement minimal middleware (Pattern 1)
2. Update OAuth callback route (Pattern 3)
3. Verify redirect target (`/app` not `/dashboard`)

### Issue 2: Sessions Drop
**Root cause:** No middleware means tokens never refresh. Server Components eventually see expired tokens.

**Fix:** Implement minimal middleware (Pattern 1). The `getUser()` call refreshes tokens.

### Issue 3: OAuth Broken
**Root cause:** Current callback at `/auth/callback/route.ts` works, but without middleware to propagate cookies, subsequent requests fail.

**Fix order:**
1. Enable minimal middleware
2. Ensure callback uses `setAll()` for cookies
3. Add `next` parameter support for proper redirect

### Issue 4: Email Verification Fails
**Root cause:** Likely using old confirmation URL format that doesn't work with SSR.

**Fix:**
1. Create `/auth/confirm/route.ts` (Pattern 4)
2. Update Supabase email template to use `token_hash` format
3. Test end-to-end

---

## Suggested Fix Order

| Order | Fix | Why First | Complexity | Files Affected |
|-------|-----|-----------|------------|----------------|
| 1 | Minimal middleware | Unblocks all other auth | Low | `middleware.ts` (new) |
| 2 | Update server client | Proper cookie handling | Low | `lib/supabase/server.ts` |
| 3 | OAuth callback fix | Most critical user flow | Medium | `app/auth/callback/route.ts` |
| 4 | API route auth checks | Security hardening | Medium | All API routes in `app/api/` |
| 5 | Email verification route | Complete auth coverage | Low | `app/auth/confirm/route.ts` (new) |
| 6 | Update Supabase templates | Email flow works | Low | Supabase Dashboard |

---

## Security Considerations

### CVE-2025-29927 (Critical)
**What:** Next.js middleware can be bypassed via `x-middleware-subrequest` header manipulation.

**Affected versions:** Next.js 11.1.4 through 15.2.2

**Mitigation:**
1. Upgrade to Next.js 15.2.3+ (check `package.json`)
2. Never rely solely on middleware for auth - use route-level `getUser()` checks

### RLS as Final Defense
Supabase Row Level Security policies provide database-level protection. Even if auth checks fail at application level, RLS prevents unauthorized data access.

**Verify:** RLS policies are enabled and correct for all tables.

---

## Build Order Implications

1. **Middleware first** - Everything else depends on token refresh working
2. **Server client second** - OAuth callback and routes need correct client
3. **Parallel work possible after #2:**
   - OAuth callback fix
   - API route hardening
   - Email verification route
4. **Supabase dashboard last** - Template changes after code is deployed

---

## Sources

**HIGH Confidence (Official Docs):**
- [Supabase: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase: Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase: User sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase: Advanced SSR Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase: JavaScript API - exchangeCodeForSession](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession)

**MEDIUM Confidence (Community Verified):**
- [GitHub Issue: AuthSessionMissingError in Next.js 14.2+/15](https://github.com/supabase/ssr/issues/107)
- [GitHub Discussion: Route protection with @supabase/ssr](https://github.com/orgs/supabase/discussions/21468)
- [WorkOS: Top Authentication Solutions for Next.js 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Clerk: Complete Authentication Guide for Next.js App Router 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

**LOW Confidence (Needs Validation):**
- Community workaround for AuthSessionMissingError using singleton browser client
- Some Medium articles on cookie-based auth patterns

---

## ThinkHaven Version Audit (from package.json)

| Package | Current Version | Required | Status |
|---------|----------------|----------|--------|
| next | 15.5.7 | 15.2.3+ | OK - CVE-2025-29927 mitigated |
| @supabase/ssr | 0.7.0 | 0.6.x+ | OK - Latest patterns supported |
| @supabase/supabase-js | 2.56.0 | 2.x | OK |
| @supabase/auth-helpers-nextjs | 0.10.0 | DEPRECATED | REMOVE - Causes conflicts |

**CRITICAL:** Remove `@supabase/auth-helpers-nextjs` from dependencies. This package is deprecated and can conflict with `@supabase/ssr`. Both packages try to manage auth cookies, leading to race conditions and dropped sessions.

```bash
npm uninstall @supabase/auth-helpers-nextjs
```

---

## Open Questions (Resolved)

1. **Next.js version:** ThinkHaven is on 15.5.7 - safe from CVE-2025-29927
2. **Supabase SSR version:** 0.7.0 is current and supports all recommended patterns
3. **Deprecated package:** `@supabase/auth-helpers-nextjs` MUST be removed
4. **RLS policies:** Verify in Supabase dashboard
5. **Email templates:** Update in Supabase dashboard to use `token_hash` format
