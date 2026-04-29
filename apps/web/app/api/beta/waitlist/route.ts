import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Waitlist service unavailable' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from('beta_access')
    .insert({ email, source })
    .select('id, user_id, email')
    .single();

  if (!error && data) {
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

  if (error?.code === '23505') {
    const { data: existing } = await supabase
      .from('beta_access')
      .select('id, user_id, email')
      .eq('email', email)
      .maybeSingle();

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

  console.error('Waitlist signup error:', {
    code: error?.code,
    message: error?.message,
  });

  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
