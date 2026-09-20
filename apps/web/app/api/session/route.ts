import { NextRequest } from 'next/server';
import { getRailwaySession } from '@/lib/auth/railway-session';
import { isAdminEmail } from '@/lib/auth/admin';
import { createSession } from '@/lib/db/repositories/session-repository';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { getPathwayConfig } from '@/lib/session/pathway-config';

/**
 * POST /api/session - Create a new session.
 * Session creation and an enabled credit deduction share one database transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const railwaySession = await getRailwaySession(request);
    const user = railwaySession?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { allowed, resetTime } = RateLimiter.checkRateLimit(user.id, 'session-create');
    if (!allowed) return RateLimiter.createLimitResponse(resetTime);

    const body = await request.json().catch(() => ({}));
    const pathwayId = body.pathway || 'explore';

    const pathway = getPathwayConfig(pathwayId);
    if (!pathway) {
      return new Response(JSON.stringify({ error: 'Invalid pathway' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await createSession({
      userId: user.id,
      pathway: pathway.id,
      title: pathway.defaultTitle,
      currentPhase: pathway.phase,
      messageLimit: pathway.messageLimit,
      chargeCredit:
        process.env.CREDIT_SYSTEM_ENABLED === 'true' &&
        !isAdminEmail(user.email || undefined),
    });

    if (result.status === 'insufficient-credits') {
      return new Response(JSON.stringify({
        error: 'NO_CREDITS',
        message: 'You\'ve used all your session credits.',
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: result.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
