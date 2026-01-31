import { createClient } from '@/lib/supabase/server';
import { verifyJwt } from './jwt-verify';

export interface BetaAccessResult {
  user: { id: string; email?: string } | null;
  betaApproved: boolean;
  error: string | null;
}

export async function checkBetaAccess(): Promise<BetaAccessResult> {
  const supabase = await createClient();

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

  return {
    user: { id: payload.sub, email: payload.email },
    betaApproved: payload.beta_approved === true,
    error: null
  };
}
