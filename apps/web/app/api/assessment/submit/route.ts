import { NextRequest, NextResponse } from 'next/server';
import { getDatabasePool } from '@/lib/db/pool';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, scores, answers, completedAt } = await request.json();

    if (!email || !scores || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let pool: ReturnType<typeof getDatabasePool>;
    try {
      pool = getDatabasePool();
    } catch {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Store assessment results
    try {
      await pool.query(
        `
          insert into "public"."assessment_submissions" (
            "email",
            "scores",
            "answers",
            "completed_at",
            "created_at"
          )
          values ($1, $2::jsonb, $3::jsonb, $4, $5)
        `,
        [
          email,
          JSON.stringify(scores),
          JSON.stringify(answers),
          completedAt,
          new Date().toISOString(),
        ],
      );
    } catch (error) {
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
