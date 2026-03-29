/**
 * Session Primitives
 *
 * Atomic, composable functions for session lifecycle management.
 * These replace the bundled operations in SessionOrchestrator with
 * explicit, agent-controlled primitives.
 *
 * Phase 4 of Agent-Native Evolution
 */

import { createClient } from '@/lib/supabase/server';
import { hasCredits, deductCredit } from '@/lib/monetization/credit-manager';

export type PathwayType = 'decision' | 'product-idea' | 'strategy-review' | 'explore';

/** Human-readable labels for each pathway */
export const PATHWAY_LABELS: Record<string, string> = {
  'decision': 'Decision',
  'product-idea': 'Product Idea',
  'strategy-review': 'Strategy Review',
  'explore': 'Exploration',
  // Legacy pathways (still stored in existing sessions)
  'new-idea': 'New Idea',
  'business-model': 'Business Model',
  'business-model-problem': 'Business Problem',
  'feature-refinement': 'Feature Refinement',
  'strategic-optimization': 'Strategic Optimization',
  'quick-decision': 'Quick Decision',
  'deep-analysis': 'Deep Analysis',
  'board-of-directors': 'Board Session',
  'strategy-sprint': 'Strategy Sprint',
};

export class BmadMethodError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BmadMethodError';
  }
}

// =============================================================================
// Types
// =============================================================================

export interface SessionRecord {
  id: string;
  userId: string;
  workspaceId: string;
  pathway: PathwayType;
  currentPhase: string;
  currentTemplate: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  overallCompletion: number;
  currentStep: string;
  nextSteps: string[];
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhaseState {
  phaseId: string;
  templateId: string;
  completion: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SessionInsight {
  id: string;
  sessionId: string;
  phaseId: string;
  category: 'market' | 'product' | 'competition' | 'risk' | 'opportunity' | 'general';
  content: string;
  createdAt: Date;
}

export interface PhaseCompletionResult {
  success: boolean;
  previousPhase: string;
  nextPhase: string | null;
  isSessionComplete: boolean;
  newProgress: number;
  error?: string;
}

export interface CreateSessionOptions {
  userId: string;
  workspaceId: string;
  pathway: PathwayType;
  initialPhase: string;
  initialTemplate: string;
  templates: string[];
  requireCredits?: boolean;
}

// =============================================================================
// Session Lifecycle Primitives
// =============================================================================

/**
 * Create a new session record in the database.
 * This is an atomic operation that does NOT bundle credit checks or template loading.
 */
export async function createSessionRecord(
  options: CreateSessionOptions
): Promise<string> {
  const supabase = await createClient();

  // Credit check (optional, defaults to true)
  if (options.requireCredits !== false) {
    const userHasCredits = await hasCredits(options.userId, 1);
    if (!userHasCredits) {
      throw new BmadMethodError(
        'Insufficient credits to start a new session',
        'INSUFFICIENT_CREDITS',
        { userId: options.userId, required: 1 }
      );
    }
  }

  const { data, error } = await supabase
    .from('bmad_sessions')
    .insert({
      user_id: options.userId,
      workspace_id: options.workspaceId,
      pathway: options.pathway,
      templates: options.templates,
      current_phase: options.initialPhase,
      current_template: options.initialTemplate,
      current_step: 'session_initialized',
      overall_completion: 0,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    throw new BmadMethodError(
      `Failed to create session record: ${error.message}`,
      'SESSION_CREATION_ERROR',
      { options, originalError: error }
    );
  }

  // Deduct credit after successful creation
  if (options.requireCredits !== false) {
    const deductResult = await deductCredit(options.userId, data.id);
    if (!deductResult.success) {
      // Rollback: Delete the session
      await supabase.from('bmad_sessions').delete().eq('id', data.id);
      throw new BmadMethodError(
        deductResult.message || 'Failed to deduct credit',
        'CREDIT_DEDUCTION_FAILED',
        { userId: options.userId, sessionId: data.id }
      );
    }
  }

  return data.id;
}

/**
 * Load session state from database.
 * Returns null if session not found.
 */
export async function loadSessionState(
  sessionId: string
): Promise<SessionRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bmad_sessions')
    .select(`
      id,
      user_id,
      workspace_id,
      pathway,
      current_phase,
      current_template,
      status,
      overall_completion,
      current_step,
      next_steps,
      start_time,
      end_time,
      created_at,
      updated_at
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new BmadMethodError(
      `Failed to load session: ${error.message}`,
      'SESSION_LOAD_ERROR',
      { sessionId, originalError: error }
    );
  }

  return {
    id: data.id,
    userId: data.user_id,
    workspaceId: data.workspace_id,
    pathway: data.pathway,
    currentPhase: data.current_phase,
    currentTemplate: data.current_template,
    status: data.status,
    overallCompletion: data.overall_completion || 0,
    currentStep: data.current_step || '',
    nextSteps: data.next_steps || [],
    startTime: new Date(data.start_time),
    endTime: data.end_time ? new Date(data.end_time) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Persist session state changes to database.
 * Only updates the fields provided.
 */
export async function persistSessionState(
  sessionId: string,
  updates: Partial<{
    currentPhase: string;
    currentTemplate: string;
    status: 'active' | 'paused' | 'completed' | 'abandoned';
    overallCompletion: number;
    currentStep: string;
    nextSteps: string[];
    endTime: Date;
  }>
): Promise<void> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.currentPhase !== undefined) updateData.current_phase = updates.currentPhase;
  if (updates.currentTemplate !== undefined) updateData.current_template = updates.currentTemplate;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.overallCompletion !== undefined) updateData.overall_completion = updates.overallCompletion;
  if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
  if (updates.nextSteps !== undefined) updateData.next_steps = updates.nextSteps;
  if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();

  const { error } = await supabase
    .from('bmad_sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) {
    throw new BmadMethodError(
      `Failed to persist session state: ${error.message}`,
      'SESSION_PERSIST_ERROR',
      { sessionId, updates, originalError: error }
    );
  }
}

/**
 * Delete a session (for rollback scenarios).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('bmad_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    throw new BmadMethodError(
      `Failed to delete session: ${error.message}`,
      'SESSION_DELETE_ERROR',
      { sessionId, originalError: error }
    );
  }
}

// =============================================================================
// Phase Management Primitives
// =============================================================================

/**
 * Phase order definitions for each pathway.
 * This is the single source of truth for phase sequences.
 */
export const PHASE_ORDER: Record<string, string[]> = {
  'new-idea': ['discovery', 'ideation', 'validation', 'planning'],
  'business-model': ['analysis', 'revenue', 'customer', 'validation', 'planning'],
  'strategic-optimization': ['assessment', 'analysis', 'strategy', 'implementation'],
  'explore': ['discovery'],
};

/**
 * Get the phase order for a pathway.
 */
export function getPhaseOrder(pathway: string): string[] {
  return PHASE_ORDER[pathway] || [];
}

/**
 * Get the next phase in sequence for a pathway.
 * Returns null if current phase is the last one or not found.
 */
export function getNextPhase(pathway: string, currentPhase: string): string | null {
  const phases = PHASE_ORDER[pathway];
  if (!phases) return null;

  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= phases.length - 1) {
    return null;
  }

  return phases[currentIndex + 1];
}

/**
 * Calculate progress percentage based on completed phases.
 */
export function calculateProgress(pathway: string, currentPhase: string): number {
  const phases = PHASE_ORDER[pathway];
  if (!phases || phases.length === 0) return 0;

  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1) return 0;

  // Progress is based on completed phases (current phase is in progress)
  return Math.round((currentIndex / phases.length) * 100);
}

/**
 * Read current phase state from database.
 */
export async function readPhaseState(
  sessionId: string,
  phaseId: string
): Promise<PhaseState | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bmad_session_progress')
    .select('*')
    .eq('session_id', sessionId)
    .eq('phase_id', phaseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new BmadMethodError(
      `Failed to read phase state: ${error.message}`,
      'PHASE_READ_ERROR',
      { sessionId, phaseId, originalError: error }
    );
  }

  return {
    phaseId: data.phase_id,
    templateId: data.template_id,
    completion: data.completion_percentage,
    startedAt: data.started_at ? new Date(data.started_at) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  };
}

/**
 * Complete the current phase and advance to the next.
 * This is the agent-controlled replacement for heuristic completion.
 *
 * @param sessionId - The session to advance
 * @param reason - Why the phase is complete (for audit trail)
 * @param keyOutcomes - Key outcomes from this phase (optional)
 */
export async function completePhase(
  sessionId: string,
  reason: string,
  keyOutcomes?: string[]
): Promise<PhaseCompletionResult> {
  const supabase = await createClient();

  // Load current session state
  const session = await loadSessionState(sessionId);
  if (!session) {
    return {
      success: false,
      previousPhase: '',
      nextPhase: null,
      isSessionComplete: false,
      newProgress: 0,
      error: 'Session not found',
    };
  }

  const previousPhase = session.currentPhase;
  const nextPhase = getNextPhase(session.pathway, previousPhase);
  const isSessionComplete = nextPhase === null;

  // Calculate new progress
  const phases = PHASE_ORDER[session.pathway] || [];
  const currentIndex = phases.indexOf(previousPhase);
  const newProgress = phases.length > 0
    ? Math.round(((currentIndex + 1) / phases.length) * 100)
    : session.overallCompletion;

  // Record phase completion in outputs
  await supabase.from('bmad_phase_outputs').insert({
    session_id: sessionId,
    phase_id: previousPhase,
    output_id: `completion-${Date.now()}`,
    output_name: 'Phase Completion',
    output_type: 'document',
    output_data: {
      reason,
      key_outcomes: keyOutcomes || [],
      completed_at: new Date().toISOString(),
    },
    is_required: false,
  });

  // Update session state
  const updates: Parameters<typeof persistSessionState>[1] = {
    overallCompletion: newProgress,
    currentStep: isSessionComplete
      ? 'Session complete'
      : `Starting ${nextPhase}`,
  };

  if (nextPhase) {
    updates.currentPhase = nextPhase;
  } else {
    updates.status = 'completed';
    updates.endTime = new Date();
  }

  await persistSessionState(sessionId, updates);

  return {
    success: true,
    previousPhase,
    nextPhase,
    isSessionComplete,
    newProgress,
  };
}

// =============================================================================
// Insight Management Primitives
// =============================================================================

/**
 * Record an insight from the conversation.
 */
export async function recordInsight(
  sessionId: string,
  insight: string,
  category: SessionInsight['category'] = 'general'
): Promise<string> {
  const supabase = await createClient();

  // Get current phase
  const session = await loadSessionState(sessionId);
  const phaseId = session?.currentPhase || 'general';

  const { data, error } = await supabase
    .from('bmad_phase_outputs')
    .insert({
      session_id: sessionId,
      phase_id: phaseId,
      output_id: `insight-${Date.now()}`,
      output_name: 'Session Insight',
      output_type: 'text',
      output_data: {
        insight,
        category,
        recorded_at: new Date().toISOString(),
      },
      is_required: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new BmadMethodError(
      `Failed to record insight: ${error.message}`,
      'INSIGHT_RECORD_ERROR',
      { sessionId, insight, originalError: error }
    );
  }

  return data.id;
}

/**
 * Get all insights for a session.
 */
export async function getSessionInsights(
  sessionId: string,
  category?: SessionInsight['category'],
  limit: number = 50
): Promise<SessionInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from('bmad_phase_outputs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('output_name', 'Session Insight')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.contains('output_data', { category });
  }

  const { data, error } = await query;

  if (error) {
    throw new BmadMethodError(
      `Failed to get insights: ${error.message}`,
      'INSIGHT_GET_ERROR',
      { sessionId, originalError: error }
    );
  }

  return (data || []).map(row => ({
    id: row.id,
    sessionId: row.session_id,
    phaseId: row.phase_id,
    category: (row.output_data as { category?: string })?.category as SessionInsight['category'] || 'general',
    content: (row.output_data as { insight?: string })?.insight || '',
    createdAt: new Date(row.created_at),
  }));
}

// =============================================================================
// User Response Primitives
// =============================================================================

/**
 * Record a user response in the session.
 */
export async function recordUserResponse(
  sessionId: string,
  phaseId: string,
  promptId: string,
  response: {
    text?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('bmad_user_responses')
    .insert({
      session_id: sessionId,
      phase_id: phaseId,
      prompt_id: promptId,
      response_text: response.text,
      response_data: response.data,
    });

  if (error) {
    throw new BmadMethodError(
      `Failed to record user response: ${error.message}`,
      'RESPONSE_RECORD_ERROR',
      { sessionId, phaseId, promptId, originalError: error }
    );
  }
}

// =============================================================================
// Session Query Primitives
// =============================================================================

/**
 * Get active sessions for a user.
 */
export async function getActiveSessions(
  userId: string,
  workspaceId?: string
): Promise<SessionRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('bmad_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    throw new BmadMethodError(
      `Failed to get active sessions: ${error.message}`,
      'SESSION_QUERY_ERROR',
      { userId, workspaceId, originalError: error }
    );
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    pathway: row.pathway,
    currentPhase: row.current_phase,
    currentTemplate: row.current_template,
    status: row.status,
    overallCompletion: row.overall_completion || 0,
    currentStep: row.current_step || '',
    nextSteps: row.next_steps || [],
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

/**
 * Check if a session exists and belongs to a user.
 */
export async function sessionBelongsToUser(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bmad_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw new BmadMethodError(
      `Failed to check session ownership: ${error.message}`,
      'SESSION_CHECK_ERROR',
      { sessionId, userId, originalError: error }
    );
  }

  return !!data;
}
