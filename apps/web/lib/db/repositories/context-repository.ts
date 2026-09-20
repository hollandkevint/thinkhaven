import type { Pool } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'

type Queryable = Pick<Pool, 'query'>

export interface ContextSessionRecord {
  id: string
  pathway: string
  current_phase: string
  overall_completion: number
  sub_persona_state: unknown
}

export interface ContextInsightRecord {
  output_data: unknown
}

export interface WorkspaceRecord {
  workspace_state: unknown
}

export interface CompletedSessionRecord {
  pathway: string
  overall_completion: number
}

export async function getOwnedContextSession(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<ContextSessionRecord | null> {
  const { rows } = await pool.query<ContextSessionRecord>(
    `
      select
        id,
        pathway,
        current_phase,
        overall_completion::float8 as overall_completion,
        sub_persona_state
      from public.bmad_sessions
      where id = $1
        and user_id = $2
      limit 1
    `,
    [sessionId, userId],
  )

  return rows[0] ?? null
}

export async function getOwnedContextInsights(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<ContextInsightRecord[]> {
  const { rows } = await pool.query<ContextInsightRecord>(
    `
      select p.output_data
      from public.bmad_phase_outputs as p
      inner join public.bmad_sessions as s on s.id = p.session_id
      where p.session_id = $1
        and s.user_id = $2
      order by p.created_at desc
      limit 5
    `,
    [sessionId, userId],
  )

  return rows
}

export async function getUserWorkspace(
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<WorkspaceRecord | null> {
  const { rows } = await pool.query<WorkspaceRecord>(
    `
      select workspace_state
      from public.user_workspace
      where user_id = $1
      limit 1
    `,
    [userId],
  )

  return rows[0] ?? null
}

export async function countCompletedSessions(
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    `
      select count(*)::int as count
      from public.bmad_sessions
      where user_id = $1
        and status = 'completed'
    `,
    [userId],
  )

  return rows[0]?.count ?? 0
}

export async function getLastCompletedSession(
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<CompletedSessionRecord | null> {
  const { rows } = await pool.query<CompletedSessionRecord>(
    `
      select
        pathway,
        overall_completion::float8 as overall_completion
      from public.bmad_sessions
      where user_id = $1
        and status = 'completed'
      order by created_at desc
      limit 1
    `,
    [userId],
  )

  return rows[0] ?? null
}
