import type { Pool, PoolClient } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'

type Queryable = Pick<Pool, 'query'>
type TransactionPool = Pick<Pool, 'connect'>

export interface CreateSessionInput {
  userId: string
  pathway: string
  title: string
  currentPhase: string
  messageLimit: number
  chargeCredit: boolean
}

export type CreateSessionResult =
  | { status: 'created'; id: string }
  | { status: 'insufficient-credits' }

export type AppendMessageResult = 'appended' | 'duplicate' | 'not-found'

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
  overall_completion: number
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

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK')
  } catch {
    // Preserve the original failure.
  }
}

export async function createSession(
  input: CreateSessionInput,
  pool: TransactionPool = getDatabasePool(),
): Promise<CreateSessionResult> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let balance: number | undefined
    if (input.chargeCredit) {
      const creditResult = await client.query<{ balance: number }>(
        `
          select balance
          from public.user_credits
          where user_id = $1
          for update
        `,
        [input.userId],
      )
      balance = creditResult.rows[0]?.balance
      if (balance === undefined || balance < 1) {
        await client.query('ROLLBACK')
        return { status: 'insufficient-credits' }
      }
    }

    const { rows } = await client.query<{ id: string }>(
      `
        insert into public.bmad_sessions (
          user_id,
          workspace_id,
          pathway,
          title,
          current_phase,
          current_template,
          current_step,
          templates,
          next_steps,
          status,
          overall_completion,
          message_count,
          message_limit
        )
        values ($1, $1, $2, $3, $4, 'general', 'chat', '{}', '{}', 'active', 0, 0, $5)
        returning id
      `,
      [input.userId, input.pathway, input.title, input.currentPhase, input.messageLimit],
    )
    const sessionId = rows[0]?.id
    if (!sessionId) throw new Error('Session creation failed')

    if (input.chargeCredit) {
      const newBalance = (balance as number) - 1
      await client.query(
        `
          update public.user_credits
          set balance = $1,
              total_used = total_used + 1,
              updated_at = now()
          where user_id = $2
        `,
        [newBalance, input.userId],
      )
      await client.query(
        `
          insert into public.credit_transactions (
            user_id,
            transaction_type,
            amount,
            balance_after,
            session_id,
            description
          )
          values ($1, 'deduct', -1, $2, $3, 'Credit deducted for session start')
        `,
        [input.userId, newBalance, sessionId],
      )
    }

    await client.query('COMMIT')
    return { status: 'created', id: sessionId }
  } catch (error) {
    await rollback(client)
    throw error
  } finally {
    client.release()
  }
}

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
        overall_completion,
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

export async function updateSessionSubPersonaState(
  sessionId: string,
  userId: string,
  state: unknown,
  pool: Queryable = getDatabasePool(),
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `
      update public.bmad_sessions
      set sub_persona_state = $1::jsonb,
          updated_at = now()
      where id = $2
        and user_id = $3
    `,
    [JSON.stringify(state), sessionId, userId],
  )

  return rowCount === 1
}

export async function appendSessionMessage(
  sessionId: string,
  userId: string,
  message: { id: string } & Record<string, unknown>,
  pool: Queryable = getDatabasePool(),
): Promise<AppendMessageResult> {
  const { rows } = await pool.query<{ owned: boolean; appended: boolean }>(
    `
      with owned as (
        select id
        from public.bmad_sessions
        where id = $1 and user_id = $2
      ), updated as (
        update public.bmad_sessions
        set chat_context = coalesce(chat_context, '[]'::jsonb) || $3::jsonb,
            updated_at = now()
        where id in (select id from owned)
          and not exists (
            select 1
            from jsonb_array_elements(coalesce(chat_context, '[]'::jsonb)) as existing
            where existing->>'id' = $4
          )
        returning id
      )
      select
        exists(select 1 from owned) as owned,
        exists(select 1 from updated) as appended
    `,
    [sessionId, userId, JSON.stringify([message]), message.id],
  )

  if (!rows[0]?.owned) return 'not-found'
  return rows[0].appended ? 'appended' : 'duplicate'
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
