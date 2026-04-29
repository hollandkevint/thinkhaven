export const BETA_INVITE_PARAM = 'beta_invite';
export const BETA_INVITE_SOURCE = 'beta_invite';

export interface BetaInviteContext {
  inviteId: string;
  source: string;
  fromGuest: boolean;
}

const STORAGE_KEY = 'thinkhaven_beta_invite';

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\'));
}

function encodePath(path: string, context: BetaInviteContext | null): string {
  const params = new URLSearchParams();

  if (context?.inviteId) {
    params.set(BETA_INVITE_PARAM, context.inviteId);
    params.set('source', context.source || BETA_INVITE_SOURCE);
  }

  if (context?.fromGuest) {
    params.set('from', 'guest');
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildBetaInviteUrl(recordId: string, origin: string): string {
  const url = new URL('/try', origin.replace(/\/$/, ''));
  url.searchParams.set(BETA_INVITE_PARAM, recordId);
  url.searchParams.set('source', BETA_INVITE_SOURCE);
  return url.toString();
}

export function readBetaInviteContext(
  searchParams: URLSearchParams
): BetaInviteContext | null {
  const inviteId = searchParams.get(BETA_INVITE_PARAM);

  if (!inviteId) {
    return null;
  }

  return {
    inviteId,
    source: searchParams.get('source') || BETA_INVITE_SOURCE,
    fromGuest: searchParams.get('from') === 'guest',
  };
}

export function buildSignupPath(context: BetaInviteContext | null): string {
  return encodePath('/signup', context ? { ...context, fromGuest: true } : null);
}

export function buildLoginPath(context: BetaInviteContext | null): string {
  return encodePath('/login', context);
}

export function readSafeRedirectPath(searchParams: URLSearchParams): string | null {
  const redirect = searchParams.get('redirect');
  return isSafeRedirectPath(redirect) ? redirect : null;
}

export function buildPostAuthDestination(
  context: BetaInviteContext | null,
  fallbackPath = '/app'
): string {
  if (!context) {
    return isSafeRedirectPath(fallbackPath) ? fallbackPath : '/app';
  }

  return encodePath('/try', context);
}

export function buildAuthCallbackUrl(
  origin: string,
  context: BetaInviteContext | null,
  fallbackPath = '/app'
): string {
  const url = new URL('/auth/callback', origin);
  const destination = buildPostAuthDestination(context, fallbackPath);

  if (destination !== '/app') {
    url.searchParams.set('next', destination);
  }

  return url.toString();
}

export function storeBetaInviteContext(context: BetaInviteContext | null): void {
  if (!context || typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function getStoredBetaInviteContext(): BetaInviteContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BetaInviteContext>;
    if (!parsed.inviteId) {
      return null;
    }

    return {
      inviteId: parsed.inviteId,
      source: parsed.source || BETA_INVITE_SOURCE,
      fromGuest: parsed.fromGuest === true,
    };
  } catch {
    return null;
  }
}
