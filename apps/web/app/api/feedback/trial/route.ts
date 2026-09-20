/**
 * Trial Feedback API
 *
 * POST /api/feedback/trial
 * Collects user feedback after completing trial sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRailwaySession } from '@/lib/auth/railway-session';
import { getDatabasePool } from '@/lib/db/pool';
import { insertTrialFeedback } from '@/lib/db/repositories/feedback-repository';

export const runtime = 'nodejs';

interface FeedbackPayload {
  userId: string;
  rating: number;
  wouldPay: boolean;
  feedback: string | null;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    let pool: ReturnType<typeof getDatabasePool>;
    try {
      pool = getDatabasePool();
    } catch {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }
    const railwaySession = await getRailwaySession(request);
    const user = railwaySession?.user;

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to submit feedback',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const payload: FeedbackPayload = await request.json();

    // Validate payload
    if (!payload.rating || payload.wouldPay === undefined) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Rating and wouldPay are required',
        },
        { status: 400 }
      );
    }

    // Store feedback — always use authenticated user.id, never caller-supplied
    try {
      await insertTrialFeedback({
        userId: user.id,
        rating: payload.rating,
        wouldPay: payload.wouldPay,
        feedback: payload.feedback,
        userEmail: user.email,
        submittedAt: payload.timestamp,
      }, pool);
    } catch (error) {
      console.error('Trial feedback insert failed:', getDatabaseErrorCode(error));
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/feedback/trial:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function getDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
