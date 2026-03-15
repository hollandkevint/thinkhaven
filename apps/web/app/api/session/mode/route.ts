import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SessionMode } from '@/lib/ai/session-mode-types';

const VALID_MODES: SessionMode[] = ['assessment', 'stress-test', 'executive-prep'];

/**
 * POST /api/session/mode
 * Updates the session_mode for a bmad_session.
 * Resets board speaker to Mary on mode change.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, mode } = await request.json();

    if (!sessionId || !mode) {
      return Response.json({ error: 'Missing sessionId or mode' }, { status: 400 });
    }

    if (!VALID_MODES.includes(mode)) {
      return Response.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // IDOR check: verify user owns this session
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('id, user_id, board_state, session_mode')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const previousMode = session.session_mode || 'assessment';

    // Update session mode and reset board speaker to Mary
    const boardState = session.board_state as Record<string, unknown> | null;
    const updatedBoardState = boardState
      ? { ...boardState, activeSpeaker: 'mary' }
      : null;

    const updateData: Record<string, unknown> = {
      session_mode: mode,
      updated_at: new Date().toISOString(),
    };

    if (updatedBoardState) {
      updateData.board_state = updatedBoardState;
    }

    const { error: updateError } = await supabase
      .from('bmad_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      return Response.json({ error: `Update failed: ${updateError.message}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      previousMode,
      newMode: mode,
    });
  } catch (error) {
    console.error('[Session Mode] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
