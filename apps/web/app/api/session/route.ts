import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PathwayType } from '@/lib/bmad/types';
import { getPathway } from '@/lib/pathways';
import { deductCredit } from '@/lib/monetization/credit-manager';

/**
 * POST /api/session - Create a new session.
 * Server-side to enforce credit checks and deduction (per-session model).
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

    const body = await request.json().catch(() => ({}));
    const pathwayId = body.pathway || 'explore';

    // Validate pathway exists
    const pathway = getPathway(pathwayId);
    if (!pathway) {
      return new Response(JSON.stringify({ error: 'Invalid pathway' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Deduct 1 credit for session creation (per-session model)
    // When CREDIT_SYSTEM_ENABLED !== 'true', this is a no-op that returns success
    const creditResult = await deductCredit(user.id, undefined, user.email || undefined);
    if (!creditResult.success) {
      return new Response(JSON.stringify({
        error: 'NO_CREDITS',
        message: 'You\'ve used all your session credits.',
        balance: creditResult.balance,
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
