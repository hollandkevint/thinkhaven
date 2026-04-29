export type BetaLifecycleStatus = 'pending' | 'approved' | 'revoked';

export interface BetaAccessRecord {
  id: string;
  user_id: string | null;
  email: string;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  source: string;
  revoked_at: string | null;
  revoked_by: string | null;
  last_invited_at: string | null;
  invite_copied_at: string | null;
  invite_count: number;
  last_gate_at: string | null;
  last_gate_status: string | null;
  first_access_at: string | null;
}

export interface BetaAccessSummary extends BetaAccessRecord {
  status: BetaLifecycleStatus;
  signedUp: boolean;
  invited: boolean;
}
