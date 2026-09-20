/**
 * Session Manipulation Tools
 *
 * Implements the atomic session tools that give Mary agency over session state.
 * These replace heuristic-based phase completion with explicit agent decisions.
 *
 * Updated in Phase 4 to use session primitives.
 */

import { maryPersona, SubPersonaSessionState } from '../mary-persona';
import {
  completePhase as completePhasePrivmitive,
  recordPhaseOutput,
  recordInsight,
  getSessionInsights,
} from '@/lib/session/session-primitives';
import {
  getSession,
  updateSessionSubPersonaState,
} from '@/lib/db/repositories/session-repository';
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
export async function readSessionState(sessionId: string, userId: string): Promise<ReadSessionStateResult> {
  try {
    const session = await getSession(sessionId, userId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    const subPersonaState = session.sub_persona_state as SubPersonaSessionState | null;

    // Get recent insights using primitive
    const insights = await getSessionInsights(sessionId, userId, undefined, 5);
    const recentInsights = insights.map(i => i.content);

    return {
      success: true,
      data: {
        sessionId: session.id,
        pathway: session.pathway,
        currentPhase: session.current_phase,
        progress: session.overall_completion,
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
  userId: string,
  input: CompletePhaseInput
): Promise<CompletePhaseResult> {
  try {
    // Use the primitive for phase completion
    const result = await completePhasePrivmitive(
      sessionId,
      userId,
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
  userId: string,
  input: SwitchModeInput
): Promise<SwitchModeResult> {
  try {
    const session = await getSession(sessionId, userId);
    if (!session) {
      return {
        success: false,
        error: 'Failed to fetch session: Session not found',
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
    const updated = await updateSessionSubPersonaState(sessionId, userId, updatedState);
    if (!updated) {
      return {
        success: false,
        error: 'Failed to update mode: Session not found',
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
  userId: string,
  input: SwitchSpeakerInput
): Promise<SwitchSpeakerResult> {
  try {
    // Resolve and validate the speaker key
    const newMember = resolveSpeakerKey(input.speaker_key);

    // Get current board state from sub_persona_state
    const session = await getSession(sessionId, userId);
    if (!session) {
      return {
        success: false,
        error: 'Failed to fetch session: Session not found',
      };
    }

    const sps = (session.sub_persona_state as Record<string, unknown>) || {};
    const previousSpeaker = (sps.activeSpeaker as string) || 'mary';

    // Update board state within sub_persona_state
    const updated = await updateSessionSubPersonaState(sessionId, userId, {
      ...sps,
      activeSpeaker: newMember.id,
    });
    if (!updated) {
      return {
        success: false,
        error: 'Failed to switch speaker: Session not found',
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
  userId: string,
  input: RecommendActionInput
): Promise<RecommendActionResult> {
  try {
    const session = await getSession(sessionId, userId);
    if (!session) {
      return {
        success: false,
        error: 'Failed to fetch session: Session not found',
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

      await updateSessionSubPersonaState(sessionId, userId, updatedState);
    }

    await recordPhaseOutput({
      sessionId,
      userId,
      phaseId: 'viability_assessment',
      outputId: `recommendation-${Date.now()}`,
      outputName: 'Strategic Recommendation',
      outputType: 'analysis',
      outputData: {
        recommendation: assessment.recommendation,
        viability_score: assessment.score,
        concerns: input.concerns,
        strengths: input.strengths,
        reasoning: assessment.reasoning,
        additional_context: input.additional_context,
        assessed_at: new Date().toISOString(),
      },
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
  userId: string,
  input: UpdateContextInput
): Promise<UpdateContextResult> {
  try {
    // Use the primitive to record insight
    await recordInsight(
      sessionId,
      userId,
      input.insight,
      input.category || 'general'
    );

    // Get total insights count using primitive
    const insights = await getSessionInsights(sessionId, userId);

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
