/**
 * Credit Manager Service
 *
 * Handles all credit-related operations including:
 * - Credit balance queries
 * - Atomic credit deductions (with race condition prevention)
 * - Credit additions (purchases and grants)
 * - Transaction history
 *
 * Uses the application-owned PostgreSQL pool for parameterized queries.
 */

import type { PoolClient } from 'pg';
import { getDatabasePool } from '@/lib/db/pool';
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

type CreditBalanceRow = Omit<CreditBalance, 'created_at' | 'updated_at'> & {
  created_at: string | Date;
  updated_at: string | Date;
};

type CreditTransactionRow = Omit<CreditTransaction, 'created_at'> & {
  created_at: string | Date;
};

function normalizeTimestamp(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

async function withCreditTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getDatabasePool().connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original failure.
    }
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// CREDIT BALANCE OPERATIONS
// ============================================================================

/**
 * Get user's current credit balance and totals
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  try {
    const { rows } = await getDatabasePool().query<CreditBalanceRow>(
      `
        SELECT
          "balance",
          "total_granted",
          "total_purchased",
          "total_used",
          "created_at",
          "updated_at"
        FROM "public"."user_credits"
        WHERE "user_id" = $1
        LIMIT 1
      `,
      [userId],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      created_at: normalizeTimestamp(row.created_at),
      updated_at: normalizeTimestamp(row.updated_at),
    };
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return null;
  }
}

/**
 * Check if user has sufficient credits
 *
 * When CREDIT_SYSTEM_ENABLED !== 'true', credit checks are bypassed.
 */
export async function hasCredits(userId: string, required: number = 1, userEmail?: string): Promise<boolean> {
  // Skip credit checks when credit system is not enabled
  const creditsDisabled = process.env.CREDIT_SYSTEM_ENABLED !== 'true';

  // Server callers provide the authenticated email for the admin bypass.
  if (isAdminEmail(userEmail)) {
    console.log('[ADMIN] Bypassing credit check');
    return true;
  }

  if (creditsDisabled) {
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
 * When CREDIT_SYSTEM_ENABLED !== 'true', credit deductions are bypassed.
 *
 * @param userId - User ID
 * @param sessionId - Optional BMad session ID for tracking
 * @returns Result with success status and new balance
 */
export async function deductCredit(
  userId: string,
  sessionId?: string,
  userEmail?: string
): Promise<DeductCreditResult> {
  // Skip credit deduction when credit system is not enabled
  const creditsDisabled = process.env.CREDIT_SYSTEM_ENABLED !== 'true';

  // Server callers provide the authenticated email for the admin bypass.
  if (isAdminEmail(userEmail)) {
    console.log('[ADMIN] Bypassing credit deduction');
    return {
      success: true,
      balance: 9999, // Admin balance
      message: 'Admin: credit deduction bypassed',
    };
  }

  if (creditsDisabled) {
    return {
      success: true,
      balance: 999,
      message: 'Credit system not enabled',
    };
  }

  try {
    return await withCreditTransaction(async (client) => {
      const { rows } = await client.query<{ balance: number }>(
        `
          SELECT "balance"
          FROM "public"."user_credits"
          WHERE "user_id" = $1
          FOR UPDATE
        `,
        [userId],
      );

      const balance = rows[0]?.balance;
      if (balance === undefined) {
        return {
          success: false,
          balance: 0,
          message: 'User credits not found',
        };
      }

      if (balance < 1) {
        return {
          success: false,
          balance,
          message: 'Insufficient credits',
        };
      }

      const { rows: updatedRows } = await client.query<{ balance: number }>(
        `
          UPDATE "public"."user_credits"
          SET
            "balance" = "balance" - 1,
            "total_used" = "total_used" + 1,
            "updated_at" = NOW()
          WHERE "user_id" = $1
          RETURNING "balance"
        `,
        [userId],
      );
      const newBalance = updatedRows[0]?.balance;
      if (newBalance === undefined) {
        throw new Error('Credit balance update failed');
      }

      await client.query(
        `
          INSERT INTO "public"."credit_transactions" (
            "user_id",
            "transaction_type",
            "amount",
            "balance_after",
            "session_id",
            "description"
          )
          VALUES ($1, 'deduct', -1, $2, $3, 'Credit deducted for session start')
        `,
        [userId, newBalance, sessionId || null],
      );

      return {
        success: true,
        balance: newBalance,
        message: 'Credit deducted successfully',
      };
    });
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
 * Add credits to a user's account from a trusted server caller.
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

  try {
    return await withCreditTransaction(async (client) => {
      const transactionType = source === 'purchase' ? 'purchase' : 'grant';
      const { rows: insertedRows } = await client.query<{ balance: number }>(
        `
          INSERT INTO "public"."user_credits" (
            "user_id",
            "balance",
            "total_granted",
            "total_purchased"
          )
          VALUES (
            $1,
            $2,
            CASE WHEN $3 = 'grant' THEN $2 ELSE 0 END,
            CASE WHEN $3 = 'purchase' THEN $2 ELSE 0 END
          )
          ON CONFLICT ("user_id") DO NOTHING
          RETURNING "balance"
        `,
        [userId, amount, transactionType],
      );

      let newBalance = insertedRows[0]?.balance;
      if (newBalance === undefined) {
        const { rows } = await client.query<{ balance: number }>(
          `
            SELECT "balance"
            FROM "public"."user_credits"
            WHERE "user_id" = $1
            FOR UPDATE
          `,
          [userId],
        );
        if (rows[0] === undefined) {
          throw new Error('User credits not found');
        }

        const { rows: updatedRows } = await client.query<{ balance: number }>(
          `
            UPDATE "public"."user_credits"
            SET
              "balance" = "balance" + $2,
              "total_granted" = "total_granted" + CASE WHEN $3 = 'grant' THEN $2 ELSE 0 END,
              "total_purchased" = "total_purchased" + CASE WHEN $3 = 'purchase' THEN $2 ELSE 0 END,
              "updated_at" = NOW()
            WHERE "user_id" = $1
            RETURNING "balance"
          `,
          [userId, amount, transactionType],
        );
        newBalance = updatedRows[0]?.balance;
      }

      if (newBalance === undefined) {
        throw new Error('Credit balance update failed');
      }

      const transactionDescription = description || `${amount} credits added`;
      await client.query(
        `
          INSERT INTO "public"."credit_transactions" (
            "user_id",
            "transaction_type",
            "amount",
            "balance_after",
            "stripe_payment_id",
            "description"
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [userId, transactionType, amount, newBalance, stripePaymentId || null, transactionDescription],
      );

      return {
        success: true,
        balance: newBalance,
        message: `${amount} credits added successfully`,
      };
    });
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
  try {
    const { rows } = await getDatabasePool().query<CreditTransactionRow>(
      `
        SELECT
          "id",
          "user_id",
          "transaction_type",
          "amount",
          "balance_after",
          "session_id",
          "stripe_payment_id",
          "stripe_checkout_session_id",
          "description",
          "metadata",
          "created_at"
        FROM "public"."credit_transactions"
        WHERE "user_id" = $1
        ORDER BY "created_at" DESC
        LIMIT $2
      `,
      [userId, limit],
    );

    return rows.map((row) => ({
      ...row,
      created_at: normalizeTimestamp(row.created_at),
    }));
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
}
