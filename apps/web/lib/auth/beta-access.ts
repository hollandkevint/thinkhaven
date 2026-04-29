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

interface ValidatedAuthUser {
  id: string;
  email?: string;
  betaApprovedClaim: boolean;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getValidatedAuthUser(
  supabase: NonNullable<SupabaseServerClient>
): Promise<ValidatedAuthUser | null> {
  if (typeof supabase.auth.getClaims === 'function') {
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (claims?.sub) {
      return {
        id: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        betaApprovedClaim: claims.beta_approved === true,
      };
    }
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    betaApprovedClaim: data.user.app_metadata?.beta_approved === true,
  };
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

export async function checkBetaAccess(): Promise<BetaAccessResult> {
  const supabase = await createClient();

  if (!supabase) {
    return betaResult({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      error: 'No Supabase client',
    });
  }

  const authUser = await getValidatedAuthUser(supabase);

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

  await recordBetaGateEvaluation({
    userId: authUser.id,
    email: authUser.email,
    status,
  });

  return betaResult({
    user,
    betaApproved,
    status,
  });
}
