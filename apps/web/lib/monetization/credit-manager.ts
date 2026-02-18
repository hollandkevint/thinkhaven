/**
 * Credit Manager Service
 *
 * Handles all credit-related operations including:
 * - Credit balance queries
 * - Atomic credit deductions (with race condition prevention)
 * - Credit additions (purchases and grants)
 * - Transaction history
 *
 * Uses Supabase RPC functions for atomic operations.
 */

import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin';

// ============================================================================
// TYPES
// ============================================================================

export interface CreditBalance {
  balance: number;
  total_granted: number;
  total_purchased: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'grant' | 'purchase' | 'deduct' | 'refund';
  amount: number;
  balance_after: number;
  session_id: string | null;
  stripe_payment_id: string | null;
  stripe_checkout_session_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DeductCreditResult {
  success: boolean;
  balance: number;
  message: string;
}

export interface AddCreditsResult {
  success: boolean;
  balance: number;
  message: string;
}

// ============================================================================
// CREDIT BALANCE OPERATIONS
// ============================================================================

/**
 * Get user's current credit balance and totals
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_credits')
    .select('balance, total_granted, total_purchased, total_used, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching credit balance:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has sufficient credits
 *
 * Note: In LAUNCH_MODE, credit checks are bypassed to allow unlimited sessions
 * during the initial testing period (target: 100 sessions with message limits).
 */
export async function hasCredits(userId: string, required: number = 1): Promise<boolean> {
  // Bypass credit checks in launch mode (for initial testing period)
  // Use server-only env var (no NEXT_PUBLIC prefix) to prevent client manipulation
  const isLaunchMode = process.env.LAUNCH_MODE === 'true';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Admin bypass for Kevin
  if (isAdminEmail(user?.email)) {
    console.log('[ADMIN] Bypassing credit check');
    return true;
  }

  if (isLaunchMode) {
    console.log('[LAUNCH_MODE] Bypassing credit check for user:', userId);
    return true;
  }

  const balance = await getCreditBalance(userId);
  return balance !== null && balance.balance >= required;
}

// ============================================================================
// CREDIT DEDUCTION (ATOMIC)
// ============================================================================

/**
 * Atomically deduct 1 credit from user's balance
 * Uses database-level locking to prevent race conditions
 *
 * Note: In LAUNCH_MODE, credit deductions are bypassed to allow unlimited sessions
 * during the initial testing period.
 *
 * @param userId - User ID
 * @param sessionId - Optional BMad session ID for tracking
 * @returns Result with success status and new balance
 */
export async function deductCredit(
  userId: string,
  sessionId?: string
): Promise<DeductCreditResult> {
  // Bypass credit deduction in launch mode (for initial testing period)
  // Use server-only env var (no NEXT_PUBLIC prefix) to prevent client manipulation
  const isLaunchMode = process.env.LAUNCH_MODE === 'true';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Admin bypass for Kevin
  if (isAdminEmail(user?.email)) {
    console.log('[ADMIN] Bypassing credit deduction');
    return {
      success: true,
      balance: 9999, // Admin balance
      message: 'Admin: credit deduction bypassed',
    };
  }

  if (isLaunchMode) {
    console.log('[LAUNCH_MODE] Bypassing credit deduction for user:', userId, 'session:', sessionId);
    return {
      success: true,
      balance: 999, // Arbitrary high number for launch mode
      message: 'Launch mode: credit deduction bypassed',
    };
  }

  try {
    const { data, error } = await supabase.rpc('deduct_credit_transaction', {
      p_user_id: userId,
      p_session_id: sessionId || null,
    });

    if (error) {
      console.error('Error deducting credit:', error);
      return {
        success: false,
        balance: 0,
        message: error.message || 'Failed to deduct credit',
      };
    }

    return data as DeductCreditResult;
  } catch (error) {
    console.error('Unexpected error deducting credit:', error);
    return {
      success: false,
      balance: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CREDIT ADDITION
// ============================================================================

/**
 * Add credits to user's account (from purchase or grant)
 *
 * @param userId - User ID
 * @param amount - Number of credits to add (must be positive)
 * @param source - Source of credits: 'purchase' or 'grant'
 * @param stripePaymentId - Stripe payment intent ID (for purchases)
 * @param description - Optional description for transaction log
 * @returns Result with success status and new balance
 */
export async function addCredits(options: {
  userId: string;
  amount: number;
  source: 'purchase' | 'grant';
  stripePaymentId?: string;
  description?: string;
}): Promise<AddCreditsResult> {
  const { userId, amount, source, stripePaymentId, description } = options;

  if (amount <= 0) {
    return {
      success: false,
      balance: 0,
      message: 'Amount must be positive',
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('add_credits_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
      p_stripe_payment_id: stripePaymentId || null,
      p_description: description || null,
    });

    if (error) {
      console.error('Error adding credits:', error);
      return {
        success: false,
        balance: 0,
        message: error.message || 'Failed to add credits',
      };
    }

    return data as AddCreditsResult;
  } catch (error) {
    console.error('Unexpected error adding credits:', error);
    return {
      success: false,
      balance: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRANSACTION HISTORY
// ============================================================================

/**
 * Get user's credit transaction history
 *
 * @param userId - User ID
 * @param limit - Maximum number of transactions to return (default: 50)
 * @returns Array of credit transactions, ordered by most recent first
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get transaction by Stripe payment ID (for idempotency checks)
 */
export async function getTransactionByStripePayment(
  stripePaymentId: string
): Promise<CreditTransaction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('stripe_payment_id', stripePaymentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - this is okay
      return null;
    }
    console.error('Error checking for existing transaction:', error);
    return null;
  }

  return data;
}

// ============================================================================
// CREDIT PACKAGES
// ============================================================================

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  stripe_price_id: string | null;
  description: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
}

/**
 * Get all active credit packages for purchase
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching credit packages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific credit package by ID
 */
export async function getCreditPackage(packageId: string): Promise<CreditPackage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching credit package:', error);
    return null;
  }

  return data;
}

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

export interface PaymentRecord {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  stripe_checkout_session_id: string;
  amount_cents: number;
  credits_purchased: number;
  package_id: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  receipt_url: string | null;
  receipt_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Create a payment record (called when Stripe checkout is created)
 */
export async function createPaymentRecord(options: {
  userId: string;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId: string;
  amountCents: number;
  creditsPurchased: number;
  packageId: string;
  receiptEmail?: string;
}): Promise<PaymentRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_history')
    .insert({
      user_id: options.userId,
      stripe_payment_intent_id: options.stripePaymentIntentId,
      stripe_checkout_session_id: options.stripeCheckoutSessionId,
      amount_cents: options.amountCents,
      credits_purchased: options.creditsPurchased,
      package_id: options.packageId,
      status: 'pending',
      receipt_email: options.receiptEmail || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment record:', error);
    return null;
  }

  return data;
}

/**
 * Update payment record status (called from webhook)
 */
export async function updatePaymentStatus(
  stripeCheckoutSessionId: string,
  status: 'succeeded' | 'failed' | 'refunded',
  receiptUrl?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('payment_history')
    .update({
      status,
      receipt_url: receiptUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId);

  if (error) {
    console.error('Error updating payment status:', error);
    return false;
  }

  return true;
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(
  userId: string,
  limit: number = 20
): Promise<PaymentRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }

  return data || [];
}
