import { NextRequest, NextResponse } from 'next/server';
import { getDatabasePool } from '@/lib/db/pool';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRateLimitIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}

export async function POST(request: NextRequest) {
  const rateLimit = RateLimiter.checkRateLimit(
    getRateLimitIdentifier(request),
    'default'
  );

  if (!rateLimit.allowed) {
    return RateLimiter.createLimitResponse(rateLimit.resetTime);
  }

  const body = await request.json().catch(() => null);
  const requestPath = new URL(request.url).pathname;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body?.source === 'string' ? body.source.slice(0, 40) : 'landing_page';

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: 'Enter a valid email address' },
      { status: 400 }
    );
  }

  let pool: ReturnType<typeof getDatabasePool>;
  let duplicate = false;
  try {
    pool = getDatabasePool();
  } catch {
    return NextResponse.json(
      { error: 'Waitlist service unavailable' },
      { status: 503 }
    );
  }

  try {
    const { rows } = await pool.query<{ id: string; user_id: string | null; email: string }>(
      `
        insert into "public"."beta_access" ("email", "source")
        values ($1, $2)
        returning "id", "user_id", "email"
      `,
      [email, source],
    );
    const data = rows[0];

    if (data) {
      await logBetaEvent({
        eventType: 'waitlist_joined',
        targetUserId: data.user_id,
        betaAccessId: data.id,
        targetEmail: data.email,
        requestPath,
        metadata: { source },
      });

      return NextResponse.json({
        success: true,
        duplicate: false,
        message: "You're on the list! We'll email you when your spot opens up.",
      });
    }
  } catch (error) {
    duplicate = isUniqueViolation(error);
    if (!duplicate) {
      console.error('Waitlist signup error:', {
        code: getDatabaseErrorCode(error),
        message: error instanceof Error ? error.message : 'Unknown database error',
      });

      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }
  }

  if (duplicate) {
    let existing: { id: string; user_id: string | null; email: string } | undefined;
    try {
      const result = await pool.query<{ id: string; user_id: string | null; email: string }>(
        `
          select "id", "user_id", "email"
          from "public"."beta_access"
          where "email" = $1
          limit 1
        `,
        [email],
      );
      existing = result.rows[0];
    } catch {
      // Preserve the duplicate response even if the follow-up lookup is unavailable.
    }

    await logBetaEvent({
      eventType: 'waitlist_duplicate',
      targetUserId: existing?.user_id,
      betaAccessId: existing?.id,
      targetEmail: email,
      requestPath,
      metadata: { source },
    });

    return NextResponse.json({
      success: true,
      duplicate: true,
      message: "You're already on the list! We'll email you soon.",
    });
  }

  console.error('Waitlist signup error: insert returned no row');
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}

function getDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function isUniqueViolation(error: unknown): boolean {
  return getDatabaseErrorCode(error) === '23505';
}
