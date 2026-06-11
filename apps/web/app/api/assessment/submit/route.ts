import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, scores, answers, completedAt } = await request.json();

    if (!email || !scores || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Store assessment results
    const { error } = await supabase
      .from('assessment_submissions')
      .insert({
        email,
        scores,
        answers,
        completed_at: completedAt,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing assessment:', error);
      // Don't fail the request - we still have localStorage
      return NextResponse.json(
        { success: true, stored: false, message: 'Assessment recorded locally' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, stored: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
