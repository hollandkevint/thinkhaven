export const APP_REDIRECT_FALLBACK = '/app'

export function isProtectedAppPath(pathname: string) {
  return pathname === '/app' || pathname.startsWith('/app/')
}

export function getProtectedAppRedirectTarget(
  pathname: string | null,
  search: string | null
) {
  const hasSafePathname = pathname != null && isProtectedAppPath(pathname)
  const safePathname = hasSafePathname
    ? pathname
    : APP_REDIRECT_FALLBACK
  const safeSearch = hasSafePathname && search?.startsWith('?') ? search : ''

  return `${safePathname}${safeSearch}`
}
