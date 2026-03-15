import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { maryPersona } from '@/lib/ai/mary-persona';
import type { SubPersonaSessionState, SubPersonaMode } from '@/lib/ai/mary-persona';

const VALID_TONES: SubPersonaMode[] = ['inquisitive', 'devil_advocate', 'encouraging', 'realistic'];

/**
 * POST /api/session/tone
 * Updates the sub_persona_state.currentMode for a bmad_session.
 * Sets userOverride flag to prevent AI auto-shifting.
 * Resets board speaker to Mary on tone change.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, tone } = await request.json();

    if (!sessionId || !tone) {
      return Response.json({ error: 'Missing sessionId or tone' }, { status: 400 });
    }

    if (!VALID_TONES.includes(tone)) {
      return Response.json({ error: `Invalid tone: ${tone}` }, { status: 400 });
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

    // IDOR check
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('id, user_id, sub_persona_state, board_state, pathway')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentState = session.sub_persona_state as SubPersonaSessionState | null;
    const previousTone = currentState?.currentMode || 'inquisitive';

    // Build updated sub-persona state (use proper initializer for pathway-aware weights)
    const updatedState: SubPersonaSessionState = currentState
      || maryPersona.initializeSubPersonaState(session.pathway || 'new-idea');

    updatedState.currentMode = tone;
    updatedState.userOverride = true;
    updatedState.modeHistory = [
      ...(updatedState.modeHistory || []),
      {
        mode: tone,
        timestamp: new Date(),
        trigger: 'user_ui_switch',
      },
    ];

    // Reset board speaker to Mary
    const boardState = session.board_state as Record<string, unknown> | null;
    const updatedBoardState = boardState
      ? { ...boardState, activeSpeaker: 'mary' }
      : null;

    const updateData: Record<string, unknown> = {
      sub_persona_state: updatedState,
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
      previousTone,
      newTone: tone,
    });
  } catch (error) {
    console.error('[Session Tone] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
