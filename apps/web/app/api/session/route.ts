import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasCredits, deductCredit } from '@/lib/monetization/credit-manager';
import { RateLimiter } from '@/lib/security/rate-limiter';

interface PathwayConfig {
  id: string;
  phase: string;
  messageLimit: number;
}

const PATHWAYS: Record<string, PathwayConfig> = {
  explore: { id: 'explore', phase: 'discovery', messageLimit: 20 },
  'quick-decision': { id: 'quick-decision', phase: 'discovery', messageLimit: 10 },
  'deep-analysis': { id: 'deep-analysis', phase: 'discovery', messageLimit: 30 },
  'board-of-directors': { id: 'board-of-directors', phase: 'discovery', messageLimit: 40 },
  'strategy-sprint': { id: 'strategy-sprint', phase: 'discovery', messageLimit: 20 },
};

/**
 * POST /api/session - Create a new session.
 * Pattern: check credits -> create session -> deduct credit.
 * If session creation fails, no credit is lost.
 * If deduction fails after creation, session is rolled back (deleted).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 10 session creations per minute per user
    const { allowed: rateLimitAllowed, remainingRequests, resetTime } = RateLimiter.checkRateLimit(user.id, 'session-create');
    if (!rateLimitAllowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many session creation requests. Please try again later.',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        },
      });
    }

    const body = await request.json().catch(() => ({}));
    const pathwayId = body.pathway || 'explore';

    const pathway = PATHWAYS[pathwayId];
    if (!pathway) {
      return new Response(JSON.stringify({ error: 'Invalid pathway' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pre-check credits (fast, non-locking)
    const canProceed = await hasCredits(user.id, 1, user.email || undefined);
    if (!canProceed) {
      return new Response(JSON.stringify({
        error: 'NO_CREDITS',
        message: 'You\'ve used all your session credits.',
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session first, then deduct credit.
    // If creation fails, no credit is lost.
    const { data: session, error: createError } = await supabase
      .from('bmad_sessions')
      .insert({
        user_id: user.id,
        workspace_id: user.id,
        pathway: pathway.id,
        title: 'New Session',
        current_phase: pathway.phase,
        current_template: 'general',
        current_step: 'chat',
        templates: [],
        next_steps: [],
        status: 'active',
        overall_completion: 0,
        message_count: 0,
        message_limit: pathway.messageLimit,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Session API] Creation failed:', createError.message);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deduct credit after successful session creation (per-session model)
    // Atomic: deduct_credit_transaction uses SELECT...FOR UPDATE
    const creditResult = await deductCredit(user.id, session.id, user.email || undefined);
    if (!creditResult.success) {
      // Rollback: delete the session since credit deduction failed
      await supabase.from('bmad_sessions').delete().eq('id', session.id).eq('user_id', user.id);
      return new Response(JSON.stringify({
        error: 'NO_CREDITS',
        message: 'You\'ve used all your session credits.',
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: session.id }), {
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
