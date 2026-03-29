/**
 * Trial Feedback API
 *
 * POST /api/feedback/trial
 * Collects user feedback after completing trial sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { error: insertError } = await supabase.from('trial_feedback').insert({
      user_id: user.id,
      rating: payload.rating,
      would_pay: payload.wouldPay,
      feedback_text: payload.feedback,
      user_email: user.email,
      submitted_at: payload.timestamp,
    });

    if (insertError) {
      console.error('Trial feedback insert failed:', insertError.code);

      return NextResponse.json({
        success: true,
        message: 'Feedback recorded',
      });
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
