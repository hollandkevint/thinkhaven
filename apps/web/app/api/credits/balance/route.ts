/**
 * Credit Balance API
 *
 * GET /api/credits/balance
 * Returns the authenticated user's credit balance and totals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance, getCreditHistory } from '@/lib/monetization/credit-manager';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to view credit balance',
        },
        { status: 401 }
      );
    }

    // Get credit balance
    const balance = await getCreditBalance(user.id);

    if (!balance) {
      // User doesn't have a credit record yet - return zero balance
      return NextResponse.json({
        balance: 0,
        total_granted: 0,
        total_purchased: 0,
        total_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Optionally include recent transactions if requested
    const includeHistory = request.nextUrl.searchParams.get('include_history') === 'true';

    if (includeHistory) {
      const history = await getCreditHistory(user.id, 10);
      return NextResponse.json({
        ...balance,
        recent_transactions: history,
      });
    }

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error in GET /api/credits/balance:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
