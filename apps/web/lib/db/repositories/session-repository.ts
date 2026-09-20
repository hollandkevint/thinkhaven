import type { Pool } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'

type Queryable = Pick<Pool, 'query'>

export interface SessionSummary {
  id: string
  user_id: string
  pathway: string
  title: string | null
  current_phase: string
  message_count: number
  message_limit: number
  status: string
  created_at: string
  updated_at: string
}

export interface SessionRecord extends SessionSummary {
  chat_context: unknown
  sub_persona_state: unknown
  lean_canvas: unknown
}

const SUMMARY_COLUMNS = `
  id,
  user_id,
  pathway,
  title,
  current_phase,
  message_count,
  message_limit,
  status,
  created_at,
  updated_at
`

export async function listSessions(
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<SessionSummary[]> {
  const { rows } = await pool.query<SessionSummary>(
    `
      select ${SUMMARY_COLUMNS}
      from public.bmad_sessions
      where user_id = $1
      order by updated_at desc
      limit 50
    `,
    [userId],
  )

  return rows
}

export async function getSession(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<SessionRecord | null> {
  const { rows } = await pool.query<SessionRecord>(
    `
      select
        ${SUMMARY_COLUMNS},
        chat_context,
        sub_persona_state,
        lean_canvas
      from public.bmad_sessions
      where id = $1
        and user_id = $2
      limit 1
    `,
    [sessionId, userId],
  )

  return rows[0] ?? null
}

export async function renameSession(
  sessionId: string,
  userId: string,
  title: string,
  pool: Queryable = getDatabasePool(),
): Promise<SessionSummary | null> {
  const { rows } = await pool.query<SessionSummary>(
    `
      update public.bmad_sessions
      set title = $1,
          updated_at = now()
      where id = $2
        and user_id = $3
      returning ${SUMMARY_COLUMNS}
    `,
    [title, sessionId, userId],
  )

  return rows[0] ?? null
}

export async function deleteSession(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `
      delete from public.bmad_sessions
      where id = $1
        and user_id = $2
    `,
    [sessionId, userId],
  )

  return rowCount === 1
}
