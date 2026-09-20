/**
 * Session Primitives
 *
 * Atomic, composable functions for session lifecycle management.
 * These replace the bundled operations in SessionOrchestrator with
 * explicit, agent-controlled primitives.
 *
 * Phase 4 of Agent-Native Evolution
 */

import type { Pool } from 'pg';
import { getDatabasePool } from '@/lib/db/pool';
import { PATHWAY_PHASE_ORDER } from './pathway-config';
import type { PathwayType } from './pathway-config';

// Re-export from client-safe modules (session-primitives imports server-only code)
export { PATHWAY_LABELS } from './pathway-labels';
export type { PathwayType } from './pathway-config';

type Queryable = Pick<Pool, 'query'>;

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
  category:
    | 'market'
    | 'product'
    | 'competition'
    | 'risk'
    | 'opportunity'
    | 'domain'
    | 'decision'
    | 'assumption'
    | 'general';
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
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    let balance: number | undefined;
    if (options.requireCredits !== false) {
      const creditResult = await client.query<{ balance: number }>(
        'SELECT balance FROM public.user_credits WHERE user_id = $1 FOR UPDATE',
        [options.userId],
      );
      balance = creditResult.rows[0]?.balance;
      if (balance === undefined || balance < 1) {
        throw new BmadMethodError(
          'Insufficient credits to start a new session',
          'INSUFFICIENT_CREDITS',
          { userId: options.userId, required: 1 },
        );
      }
    }

    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO public.bmad_sessions (
          user_id, workspace_id, pathway, templates, current_phase,
          current_template, current_step, overall_completion, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'session_initialized', 0, 'active')
        RETURNING id
      `,
      [
        options.userId,
        options.workspaceId,
        options.pathway,
        options.templates,
        options.initialPhase,
        options.initialTemplate,
      ],
    );
    const sessionId = rows[0]?.id;
    if (!sessionId) throw new Error('Session creation returned no id');

    if (balance !== undefined) {
      const newBalance = balance - 1;
      await client.query(
        `UPDATE public.user_credits
         SET balance = $1, total_used = total_used + 1, updated_at = NOW()
         WHERE user_id = $2`,
        [newBalance, options.userId],
      );
      await client.query(
        `INSERT INTO public.credit_transactions (
           user_id, transaction_type, amount, balance_after, session_id, description
         ) VALUES ($1, 'deduct', -1, $2, $3, 'Credit deducted for session start')`,
        [options.userId, newBalance, sessionId],
      );
    }

    await client.query('COMMIT');
    return sessionId;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error instanceof BmadMethodError) throw error;
    throw new BmadMethodError(
      `Failed to create session record: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SESSION_CREATION_ERROR',
      { options },
    );
  } finally {
    client.release();
  }
}

/**
 * Load session state from database.
 * Returns null if session not found.
 */
export async function loadSessionState(
  sessionId: string,
  userId: string,
  db: Queryable = getDatabasePool(),
): Promise<SessionRecord | null> {
  const { rows } = await db.query<{
    id: string; user_id: string; workspace_id: string; pathway: PathwayType;
    current_phase: string; current_template: string; status: SessionRecord['status'];
    overall_completion: number | string; current_step: string; next_steps: string[] | null;
    start_time: string | Date; end_time: string | Date | null;
    created_at: string | Date; updated_at: string | Date;
  }>(
    `
      SELECT id, user_id, workspace_id, pathway, current_phase, current_template,
             status, overall_completion, current_step, next_steps, start_time,
             end_time, created_at, updated_at
      FROM public.bmad_sessions
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [sessionId, userId],
  );
  const data = rows[0];
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    workspaceId: data.workspace_id,
    pathway: data.pathway,
    currentPhase: data.current_phase,
    currentTemplate: data.current_template,
    status: data.status,
    overallCompletion: Number(data.overall_completion) || 0,
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
  userId: string,
  updates: Partial<{
    currentPhase: string;
    currentTemplate: string;
    status: 'active' | 'paused' | 'completed' | 'abandoned';
    overallCompletion: number;
    currentStep: string;
    nextSteps: string[];
    endTime: Date;
  }>,
  db: Queryable = getDatabasePool(),
): Promise<void> {
  const { rowCount } = await db.query(
    `
      UPDATE public.bmad_sessions
      SET current_phase = COALESCE($1, current_phase),
          current_template = COALESCE($2, current_template),
          status = COALESCE($3, status),
          overall_completion = COALESCE($4, overall_completion),
          current_step = COALESCE($5, current_step),
          next_steps = COALESCE($6, next_steps),
          end_time = COALESCE($7, end_time),
          updated_at = NOW()
      WHERE id = $8 AND user_id = $9
    `,
    [
      updates.currentPhase ?? null,
      updates.currentTemplate ?? null,
      updates.status ?? null,
      updates.overallCompletion ?? null,
      updates.currentStep ?? null,
      updates.nextSteps ?? null,
      updates.endTime ?? null,
      sessionId,
      userId,
    ],
  );

  if (rowCount !== 1) {
    throw new BmadMethodError(
      'Failed to persist session state: session not found',
      'SESSION_PERSIST_ERROR',
      { sessionId, userId, updates }
    );
  }
}

/**
 * Delete a session (for rollback scenarios).
 */
export async function deleteSession(sessionId: string, userId: string): Promise<void> {
  const { rowCount } = await getDatabasePool().query(
    'DELETE FROM public.bmad_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId],
  );

  if (rowCount !== 1) {
    throw new BmadMethodError(
      'Failed to delete session: session not found',
      'SESSION_DELETE_ERROR',
      { sessionId, userId }
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
  ...PATHWAY_PHASE_ORDER,
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
  userId: string,
  phaseId: string
): Promise<PhaseState | null> {
  const { rows } = await getDatabasePool().query<{
    phase_id: string; template_id: string; completion_percentage: number | string;
    started_at: string | Date | null; completed_at: string | Date | null;
  }>(
    `
      SELECT p.phase_id, p.template_id, p.completion_percentage, p.started_at, p.completed_at
      FROM public.bmad_session_progress p
      JOIN public.bmad_sessions s ON s.id = p.session_id
      WHERE p.session_id = $1 AND s.user_id = $2 AND p.phase_id = $3
      LIMIT 1
    `,
    [sessionId, userId, phaseId],
  );
  const data = rows[0];
  if (!data) return null;

  return {
    phaseId: data.phase_id,
    templateId: data.template_id,
    completion: Number(data.completion_percentage),
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
  userId: string,
  reason: string,
  keyOutcomes?: string[]
): Promise<PhaseCompletionResult> {
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    const session = await loadSessionState(sessionId, userId, client);
    if (!session) {
      await client.query('ROLLBACK');
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

    await client.query(
      `
        INSERT INTO public.bmad_phase_outputs (
          session_id, phase_id, output_id, output_name, output_type, output_data, is_required
        ) VALUES ($1, $2, $3, 'Phase Completion', 'document', $4::jsonb, false)
      `,
      [
        sessionId,
        previousPhase,
        `completion-${Date.now()}`,
        JSON.stringify({
          reason,
          key_outcomes: keyOutcomes || [],
          completed_at: new Date().toISOString(),
        }),
      ],
    );

  // Update session state
  const updates: Parameters<typeof persistSessionState>[2] = {
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

    await persistSessionState(sessionId, userId, updates, client);
    await client.query('COMMIT');

    return {
      success: true,
      previousPhase,
      nextPhase,
      isSessionComplete,
      newProgress,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// Insight Management Primitives
// =============================================================================

export async function recordPhaseOutput(options: {
  sessionId: string;
  userId: string;
  phaseId: string;
  outputId: string;
  outputName: string;
  outputType: string;
  outputData: Record<string, unknown>;
}): Promise<string> {
  const { rows } = await getDatabasePool().query<{ id: string }>(
    `
      INSERT INTO public.bmad_phase_outputs (
        session_id, phase_id, output_id, output_name, output_type, output_data, is_required
      )
      SELECT s.id, $3, $4, $5, $6, $7::jsonb, false
      FROM public.bmad_sessions s
      WHERE s.id = $1 AND s.user_id = $2
      RETURNING id
    `,
    [
      options.sessionId,
      options.userId,
      options.phaseId,
      options.outputId,
      options.outputName,
      options.outputType,
      JSON.stringify(options.outputData),
    ],
  );
  if (!rows[0]) throw new BmadMethodError('Session not found', 'SESSION_NOT_FOUND');
  return rows[0].id;
}

/**
 * Record an insight from the conversation.
 */
export async function recordInsight(
  sessionId: string,
  userId: string,
  insight: string,
  category: SessionInsight['category'] = 'general'
): Promise<string> {
  const { rows } = await getDatabasePool().query<{ id: string }>(
    `
      INSERT INTO public.bmad_phase_outputs (
        session_id, phase_id, output_id, output_name, output_type, output_data, is_required
      )
      SELECT s.id, s.current_phase, $3, 'Session Insight', 'text', $4::jsonb, false
      FROM public.bmad_sessions s
      WHERE s.id = $1 AND s.user_id = $2
      RETURNING id
    `,
    [
      sessionId,
      userId,
      `insight-${Date.now()}`,
      JSON.stringify({ insight, category, recorded_at: new Date().toISOString() }),
    ],
  );
  if (!rows[0]) {
    throw new BmadMethodError(
      'Failed to record insight: session not found',
      'INSIGHT_RECORD_ERROR',
      { sessionId, userId, insight }
    );
  }
  return rows[0].id;
}

/**
 * Get all insights for a session.
 */
export async function getSessionInsights(
  sessionId: string,
  userId: string,
  category?: SessionInsight['category'],
  limit: number = 50
): Promise<SessionInsight[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const { rows } = await getDatabasePool().query<{
    id: string; session_id: string; phase_id: string;
    output_data: { category?: SessionInsight['category']; insight?: string };
    created_at: string | Date;
  }>(
    `
      SELECT o.id, o.session_id, o.phase_id, o.output_data, o.created_at
      FROM public.bmad_phase_outputs o
      JOIN public.bmad_sessions s ON s.id = o.session_id
      WHERE o.session_id = $1 AND s.user_id = $2
        AND o.output_name = 'Session Insight'
        AND ($3::text IS NULL OR o.output_data @> jsonb_build_object('category', $3::text))
      ORDER BY o.created_at DESC
      LIMIT $4
    `,
    [sessionId, userId, category || null, safeLimit],
  );

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    phaseId: row.phase_id,
    category: row.output_data?.category || 'general',
    content: row.output_data?.insight || '',
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
  userId: string,
  phaseId: string,
  promptId: string,
  response: {
    text?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  const { rowCount } = await getDatabasePool().query(
    `
      INSERT INTO public.bmad_user_responses (
        session_id, phase_id, prompt_id, response_text, response_data
      )
      SELECT s.id, $3, $4, $5, $6::jsonb
      FROM public.bmad_sessions s
      WHERE s.id = $1 AND s.user_id = $2
    `,
    [
      sessionId,
      userId,
      phaseId,
      promptId,
      response.text || null,
      JSON.stringify(response.data || null),
    ],
  );

  if (rowCount !== 1) {
    throw new BmadMethodError(
      'Failed to record user response: session not found',
      'RESPONSE_RECORD_ERROR',
      { sessionId, userId, phaseId, promptId }
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
  const { rows } = await getDatabasePool().query<{
    id: string; user_id: string; workspace_id: string; pathway: PathwayType;
    current_phase: string; current_template: string; status: SessionRecord['status'];
    overall_completion: number | string; current_step: string; next_steps: string[] | null;
    start_time: string | Date; end_time: string | Date | null;
    created_at: string | Date; updated_at: string | Date;
  }>(
    `
      SELECT id, user_id, workspace_id, pathway, current_phase, current_template,
             status, overall_completion, current_step, next_steps, start_time,
             end_time, created_at, updated_at
      FROM public.bmad_sessions
      WHERE user_id = $1 AND status = 'active'
        AND ($2::uuid IS NULL OR workspace_id = $2)
      ORDER BY updated_at DESC
    `,
    [userId, workspaceId || null],
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    pathway: row.pathway,
    currentPhase: row.current_phase,
    currentTemplate: row.current_template,
    status: row.status,
    overallCompletion: Number(row.overall_completion) || 0,
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
  const { rowCount } = await getDatabasePool().query(
    'SELECT 1 FROM public.bmad_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId],
  );
  return rowCount === 1;
}
