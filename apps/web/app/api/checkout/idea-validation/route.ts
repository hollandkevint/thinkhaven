/**
 * Idea Validation Checkout API
 *
 * POST /api/checkout/idea-validation
 * Creates a Stripe checkout session for the $99 idea validation product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRailwaySession } from '@/lib/auth/railway-session';
import { createIdeaValidationCheckout } from '@/lib/monetization/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const railwaySession = await getRailwaySession(request);
    const user = railwaySession?.user;

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to purchase',
        },
        { status: 401 }
      );
    }

    const session = await createIdeaValidationCheckout(user.id, user.email ?? undefined);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: 'Checkout Failed',
        message: error instanceof Error ? error.message : 'Could not create checkout session',
      },
      { status: 500 }
    );
  }
}
