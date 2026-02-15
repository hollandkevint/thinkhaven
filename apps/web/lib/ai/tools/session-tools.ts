/**
 * Session Manipulation Tools
 *
 * Implements the atomic session tools that give Mary agency over session state.
 * These replace heuristic-based phase completion with explicit agent decisions.
 *
 * Updated in Phase 4 to use session primitives.
 */

import { createClient } from '@/lib/supabase/server';
import { maryPersona, SubPersonaSessionState } from '../mary-persona';
import {
  loadSessionState,
  persistSessionState,
  completePhase as completePhasePrivmitive,
  recordInsight,
  getSessionInsights,
  PHASE_ORDER,
} from '@/lib/bmad/session-primitives';
import { resolveSpeakerKey } from '../board-members';
import type {
  CompletePhaseInput,
  CompletePhaseResult,
  SwitchModeInput,
  SwitchModeResult,
  SwitchSpeakerInput,
  SwitchSpeakerResult,
  RecommendActionInput,
  RecommendActionResult,
  ReadSessionStateResult,
  UpdateContextInput,
  UpdateContextResult,
} from './index';

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Read the current session state
 */
export async function readSessionState(sessionId: string): Promise<ReadSessionStateResult> {
  try {
    // Use primitive to load session
    const session = await loadSessionState(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Get sub-persona state from database
    const supabase = await createClient();
    const { data: sessionData } = await supabase
      .from('bmad_sessions')
      .select('sub_persona_state')
      .eq('id', sessionId)
      .single();

    const subPersonaState = sessionData?.sub_persona_state as SubPersonaSessionState | null;

    // Get recent insights using primitive
    const insights = await getSessionInsights(sessionId, undefined, 5);
    const recentInsights = insights.map(i => i.content);

    return {
      success: true,
      data: {
        sessionId: session.id,
        pathway: session.pathway,
        currentPhase: session.currentPhase,
        progress: session.overallCompletion,
        currentMode: subPersonaState?.currentMode || 'inquisitive',
        exchangeCount: subPersonaState?.exchangeCount || 0,
        insights: recentInsights,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading session state: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Complete the current phase and advance to the next.
 * Uses the atomic completePhase primitive.
 */
export async function completePhase(
  sessionId: string,
  input: CompletePhaseInput
): Promise<CompletePhaseResult> {
  try {
    // Use the primitive for phase completion
    const result = await completePhasePrivmitive(
      sessionId,
      input.reason,
      input.key_outcomes
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to complete phase',
      };
    }

    return {
      success: true,
      data: {
        previousPhase: result.previousPhase,
        nextPhase: result.nextPhase,
        completionReason: input.reason,
        sessionProgress: result.newProgress,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error completing phase: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Switch the sub-persona mode
 */
export async function switchPersonaMode(
  sessionId: string,
  input: SwitchModeInput
): Promise<SwitchModeResult> {
  try {
    const supabase = await createClient();

    // Get current sub-persona state
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('sub_persona_state, pathway')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const currentState = session.sub_persona_state as SubPersonaSessionState | null;
    const previousMode = currentState?.currentMode || 'inquisitive';

    // Create updated state
    const updatedState: SubPersonaSessionState = currentState || maryPersona.initializeSubPersonaState(session.pathway || 'new-idea');
    updatedState.currentMode = input.new_mode;
    updatedState.modeHistory = [
      ...(updatedState.modeHistory || []),
      {
        mode: input.new_mode,
        timestamp: new Date(),
        trigger: `tool_switch: ${input.reason}`,
      },
    ];

    // Update database
    const { error: updateError } = await supabase
      .from('bmad_sessions')
      .update({
        sub_persona_state: updatedState,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update mode: ${updateError.message}`,
      };
    }

    return {
      success: true,
      data: {
        previousMode,
        newMode: input.new_mode,
        reason: input.reason,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error switching mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Switch the active board member speaker.
 * Resolves the speaker key against the registry (falls back to Mary).
 * Updates board_state in the session record.
 */
export async function switchSpeaker(
  sessionId: string,
  input: SwitchSpeakerInput
): Promise<SwitchSpeakerResult> {
  try {
    const supabase = await createClient();

    // Resolve and validate the speaker key
    const newMember = resolveSpeakerKey(input.speaker_key);

    // Get current board state
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('board_state')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const currentBoardState = (session.board_state as { activeSpeaker?: string }) || {};
    const previousSpeaker = currentBoardState.activeSpeaker || 'mary';

    // Update board state
    const { error: updateError } = await supabase
      .from('bmad_sessions')
      .update({
        board_state: {
          ...currentBoardState,
          activeSpeaker: newMember.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to switch speaker: ${updateError.message}`,
      };
    }

    return {
      success: true,
      data: {
        previousSpeaker,
        newSpeaker: newMember.id,
        handoffReason: input.handoff_reason,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error switching speaker: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Provide a strategic recommendation (kill/pivot/proceed)
 */
export async function recommendAction(
  sessionId: string,
  input: RecommendActionInput
): Promise<RecommendActionResult> {
  try {
    const supabase = await createClient();

    // Get current session state for viability assessment
    const { data: session, error: fetchError } = await supabase
      .from('bmad_sessions')
      .select('sub_persona_state, pathway')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${fetchError?.message || 'Session not found'}`,
      };
    }

    const currentState = session.sub_persona_state as SubPersonaSessionState | null;

    // Use the existing viability assessment logic
    const assessment = maryPersona.assessViability(
      currentState || maryPersona.initializeSubPersonaState(session.pathway || 'new-idea'),
      input.concerns,
      input.strengths
    );

    // Update kill decision state
    if (currentState) {
      const updatedState = maryPersona.updateKillDecision(
        currentState,
        input.concerns,
        true // A recommendation counts as a probe
      );

      await supabase
        .from('bmad_sessions')
        .update({
          sub_persona_state: updatedState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    // Record the recommendation
    await supabase.from('bmad_phase_outputs').insert({
      session_id: sessionId,
      phase_id: 'viability_assessment',
      output_id: `recommendation-${Date.now()}`,
      output_name: 'Strategic Recommendation',
      output_type: 'analysis',
      output_data: {
        recommendation: assessment.recommendation,
        viability_score: assessment.score,
        concerns: input.concerns,
        strengths: input.strengths,
        reasoning: assessment.reasoning,
        additional_context: input.additional_context,
        assessed_at: new Date().toISOString(),
      },
      is_required: false,
    });

    return {
      success: true,
      data: {
        recommendation: assessment.recommendation,
        viabilityScore: assessment.score,
        concerns: input.concerns,
        strengths: input.strengths,
        reasoning: assessment.reasoning,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error making recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update session context with a new insight.
 * Uses the atomic recordInsight primitive.
 */
export async function updateSessionContext(
  sessionId: string,
  input: UpdateContextInput
): Promise<UpdateContextResult> {
  try {
    // Use the primitive to record insight
    await recordInsight(
      sessionId,
      input.insight,
      input.category || 'general'
    );

    // Get total insights count using primitive
    const insights = await getSessionInsights(sessionId);

    return {
      success: true,
      data: {
        insightAdded: input.insight,
        totalInsights: insights.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error updating context: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
