import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';
import { isBetaEventType, type BetaEventType } from '@/lib/beta/beta-events';

const PUBLIC_EVENT_TYPES = new Set<BetaEventType>(['invite_arrived']);
const AUTHENTICATED_EVENT_TYPES = new Set<BetaEventType>([
  'guest_migration_attempted',
  'signup_from_invite',
  'support_requested',
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRateLimitIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}

function readMetadata(body: Record<string, unknown>): Record<string, unknown> {
  return {
    source: typeof body.source === 'string' ? body.source.slice(0, 40) : undefined,
    success: typeof body.success === 'boolean' ? body.success : undefined,
    migratedMessages:
      typeof body.migratedMessages === 'number'
        ? Math.max(0, Math.min(10, body.migratedMessages))
        : undefined,
    sessionCreated: typeof body.sessionCreated === 'boolean' ? body.sessionCreated : undefined,
  };
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
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid beta event body' }, { status: 400 });
  }

  const eventType = typeof body.eventType === 'string' ? body.eventType : '';

  if (!isBetaEventType(eventType)) {
    return NextResponse.json({ error: 'Unsupported beta event type' }, { status: 400 });
  }

  const requiresAuth = AUTHENTICATED_EVENT_TYPES.has(eventType);

  if (!PUBLIC_EVENT_TYPES.has(eventType) && !requiresAuth) {
    return NextResponse.json({ error: 'Unsupported beta event type' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (requiresAuth && !data.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const betaInviteId =
    typeof body?.betaInviteId === 'string' && UUID_PATTERN.test(body.betaInviteId)
      ? body.betaInviteId
      : null;

  const recorded = await logBetaEvent({
    eventType,
    targetUserId: data.user?.id,
    betaAccessId: betaInviteId,
    targetEmail: data.user?.email,
    requestPath: new URL(request.url).pathname,
    metadata: readMetadata(body as Record<string, unknown>),
  });

  return NextResponse.json({ success: true, recorded });
}
