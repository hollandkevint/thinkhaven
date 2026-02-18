import { createClient } from '@/lib/supabase/server';
import { verifyJwt } from './jwt-verify';
import { isAdminEmail } from './admin';

export interface BetaAccessResult {
  user: { id: string; email?: string } | null;
  betaApproved: boolean;
  error: string | null;
}

export async function checkBetaAccess(): Promise<BetaAccessResult> {
  const supabase = await createClient();

  if (!supabase) {
    return { user: null, betaApproved: false, error: 'No Supabase client' };
  }

  // Get session which contains the access_token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { user: null, betaApproved: false, error: 'No session' };
  }

  // Verify JWT and extract claims
  const payload = await verifyJwt(session.access_token);

  if (!payload) {
    return { user: null, betaApproved: false, error: 'Invalid token' };
  }

  // Check JWT claim first
  if (payload.beta_approved === true) {
    return {
      user: { id: payload.sub, email: payload.email },
      betaApproved: true,
      error: null
    };
  }

  // Admin emails always bypass beta gate
  if (isAdminEmail(payload.email)) {
    return {
      user: { id: payload.sub, email: payload.email },
      betaApproved: true,
      error: null
    };
  }

  // Fallback: check beta_access table directly (handles cases where
  // the JWT hook isn't firing or token was issued before approval)
  const { data: betaRecord } = await supabase
    .from('beta_access')
    .select('approved_at')
    .eq('user_id', payload.sub)
    .single();

  const approvedInDb = betaRecord?.approved_at != null;

  return {
    user: { id: payload.sub, email: payload.email },
    betaApproved: approvedInDb,
    error: null
  };
}
