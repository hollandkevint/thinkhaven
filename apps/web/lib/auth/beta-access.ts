import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from './admin';
import { recordBetaGateEvaluation } from '@/lib/monitoring/beta-event-logger';

export type BetaAccessStatus =
  | 'approved'
  | 'admin'
  | 'pending'
  | 'revoked'
  | 'unauthenticated'
  | 'unavailable';

export interface BetaAccessResult {
  user: { id: string; email?: string } | null;
  betaApproved: boolean;
  status: BetaAccessStatus;
  isAdmin: boolean;
  error: string | null;
}

export interface CheckBetaAccessOptions {
  recordGate?: boolean;
  requestPath?: string;
}

interface ValidatedAuthUser {
  id: string;
  email?: string;
  betaApprovedClaim: boolean;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface AuthValidationResult {
  user: ValidatedAuthUser | null;
  unavailable: boolean;
}

function getErrorField(error: unknown, field: 'code' | 'message'): string | null {
  if (!error || typeof error !== 'object') return null;

  const value = (error as Record<string, unknown>)[field];
  return typeof value === 'string' ? value.toLowerCase() : null;
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const value = (error as Record<string, unknown>).status;
  return typeof value === 'number' ? value : null;
}

function isUnavailableAuthError(error: unknown): boolean {
  const status = getErrorStatus(error);
  const code = getErrorField(error, 'code');
  const message = getErrorField(error, 'message');

  if (status && (status >= 500 || status === 429)) return true;
  if (status === 401 || status === 403) return false;

  if (code) {
    if (
      code.includes('invalid') ||
      code.includes('expired') ||
      code.includes('session_not_found') ||
      code.includes('refresh_token_not_found')
    ) {
      return false;
    }

    if (
      code.includes('timeout') ||
      code.includes('unavailable') ||
      code.includes('rate_limit')
    ) {
      return true;
    }
  }

  if (!message) return false;

  if (
    message.includes('invalid token') ||
    message.includes('jwt expired') ||
    message.includes('session not found') ||
    message.includes('not authenticated')
  ) {
    return false;
  }

  return (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('temporarily unavailable') ||
    message.includes('service unavailable') ||
    message.includes('database unavailable') ||
    message.includes('connection')
  );
}

async function getValidatedAuthUser(
  supabase: NonNullable<SupabaseServerClient>
): Promise<AuthValidationResult> {
  if (typeof supabase.auth.getClaims === 'function') {
    try {
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims;

      if (claims?.sub) {
        return {
          user: {
            id: claims.sub,
            email: typeof claims.email === 'string' ? claims.email : undefined,
            betaApprovedClaim: claims.beta_approved === true,
          },
          unavailable: false,
        };
      }
    } catch {
      // Fall back to getUser; if auth is truly unavailable it will fail there too.
    }
  }

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return {
        user: null,
        unavailable: Boolean(error && isUnavailableAuthError(error)),
      };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        betaApprovedClaim: data.user.app_metadata?.beta_approved === true,
      },
      unavailable: false,
    };
  } catch {
    return { user: null, unavailable: true };
  }
}

function betaResult({
  user,
  betaApproved,
  status,
  error = null,
}: {
  user: BetaAccessResult['user'];
  betaApproved: boolean;
  status: BetaAccessStatus;
  error?: string | null;
}): BetaAccessResult {
  return {
    user,
    betaApproved,
    status,
    isAdmin: status === 'admin',
    error,
  };
}

export async function checkBetaAccess(
  options: CheckBetaAccessOptions = {}
): Promise<BetaAccessResult> {
  const supabase = await createClient();

  if (!supabase) {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      error: 'No Supabase client',
    });
  }

  const authValidation = await getValidatedAuthUser(supabase);

  if (authValidation.unavailable) {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      error: 'Authentication service unavailable',
    });
  }

  const authUser = authValidation.user;

  if (!authUser) {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      error: 'No authenticated user',
    });
  }

  const user = { id: authUser.id, email: authUser.email };

  // Admin emails always bypass beta gate
  if (isAdminEmail(authUser.email)) {
    return betaResult({
      user,
      betaApproved: true,
      status: 'admin',
    });
  }

  // Check beta_access for current revocation first. A positive claim can be
  // stale after an admin revokes access, so revoked_at must override it.
  const { data: betaRecord, error: betaLookupError } = await supabase
    .from('beta_access')
    .select('approved_at, revoked_at')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (betaLookupError) {
    return betaResult({
      user,
      betaApproved: false,
      status: 'unavailable',
      error: 'Beta access lookup failed',
    });
  }

  const revokedInDb = betaRecord?.revoked_at != null;
  const approvedInDb = betaRecord?.approved_at != null;
  const betaApproved = !revokedInDb && (approvedInDb || authUser.betaApprovedClaim);
  const status = betaApproved ? 'approved' : revokedInDb ? 'revoked' : 'pending';

  if (options.recordGate !== false) {
    await recordBetaGateEvaluation({
      userId: authUser.id,
      email: authUser.email,
      status,
      requestPath: options.requestPath,
    });
  }

  return betaResult({
    user,
    betaApproved,
    status,
  });
}
