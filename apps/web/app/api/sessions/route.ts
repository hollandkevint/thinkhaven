import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInitialBoardState } from '@/lib/ai/board-members';
import { getPathway } from '@/lib/pathways';

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pathwayId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pathwayId } = body;
  if (!pathwayId) {
    return NextResponse.json({ error: 'pathwayId is required' }, { status: 400 });
  }

  const pathway = getPathway(pathwayId);
  if (!pathway) {
    return NextResponse.json({ error: 'Invalid pathway' }, { status: 400 });
  }

  const sessionInsert: Record<string, unknown> = {
    user_id: user.id,
    workspace_id: user.id,
    pathway: pathway.id,
    current_phase: 'discovery',
    current_template: 'general',
    current_step: 'chat',
    templates: [],
    next_steps: [],
    status: 'active',
    overall_completion: 0,
    message_count: 0,
    message_limit: pathway.messageLimit,
  };

  if (pathway.activatesBoard) {
    sessionInsert.sub_persona_state = createInitialBoardState();
  }

  const { data: session, error: createError } = await supabase
    .from('bmad_sessions')
    .insert(sessionInsert)
    .select('id')
    .single();

  if (createError) {
    console.error('Session creation failed:', createError);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session creation returned no data' }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
