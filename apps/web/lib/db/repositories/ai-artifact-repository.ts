import type { Pool } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'
import type { LeanCanvas } from '@/lib/canvas/lean-canvas-schema'

type Queryable = Pick<Pool, 'query'>

export interface DocumentSessionContext {
  pathway: string
  current_phase: string
}

export interface DocumentInsightRow {
  output_data: unknown
  phase_id: string
  output_name: string
}

export async function getOwnedDocumentSession(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<DocumentSessionContext | null> {
  const { rows } = await pool.query<DocumentSessionContext>(
    `
      select pathway, current_phase
      from public.bmad_sessions
      where id = $1
        and user_id = $2
      limit 1
    `,
    [sessionId, userId],
  )

  return rows[0] ?? null
}

export async function getOwnedSessionInsights(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<DocumentInsightRow[]> {
  const { rows } = await pool.query<DocumentInsightRow>(
    `
      select p.output_data, p.phase_id, p.output_name
      from public.bmad_phase_outputs as p
      inner join public.bmad_sessions as s on s.id = p.session_id
      where p.session_id = $1
        and s.user_id = $2
      order by p.created_at asc
    `,
    [sessionId, userId],
  )

  return rows
}

export async function insertOwnedGeneratedDocument(
  sessionId: string,
  userId: string,
  document: { name: string; type: string; content: string },
  pool: Queryable = getDatabasePool(),
): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>(
    `
      insert into public.bmad_generated_documents (
        session_id,
        document_name,
        document_type,
        content,
        format
      )
      select $1, $2, $3, $4, 'markdown'
      where exists (
        select 1
        from public.bmad_sessions
        where id = $1
          and user_id = $5
      )
      returning id
    `,
    [sessionId, document.name, document.type, document.content, userId],
  )

  return rows[0]?.id ?? null
}

export async function updateOwnedLeanCanvas(
  sessionId: string,
  userId: string,
  updates: Partial<LeanCanvas>,
  pool: Queryable = getDatabasePool(),
): Promise<LeanCanvas | null> {
  const { rows } = await pool.query<{ lean_canvas: LeanCanvas | null }>(
    `
      update public.bmad_sessions
      set lean_canvas = coalesce(lean_canvas, '{}'::jsonb) || $1::jsonb,
          updated_at = now()
      where id = $2
        and user_id = $3
      returning lean_canvas
    `,
    [JSON.stringify(updates), sessionId, userId],
  )

  return rows[0]?.lean_canvas ?? null
}
