import type { Pool } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'
import { getPathwayConfig } from '@/lib/session/pathway-config'

const ALLOWED_ROLES = new Set(['user', 'assistant'])
const MAX_CONTENT_LENGTH = 4000
const MAX_MESSAGES = 10
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const MAX_UTM_VALUE_LENGTH = 120

type Queryable = Pick<Pool, 'query'>

export interface GuestMigrationInput {
  sessionId: string
  pathway?: string
  messages: unknown[]
  utm?: unknown
}

export interface MigratedGuestSession {
  id: string
  messageCount: number
}

function sanitizeUtm(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const source = value as Record<string, unknown>
  const utm = Object.fromEntries(
    UTM_KEYS.flatMap((key) => {
      const item = source[key]
      return typeof item === 'string' && item.trim()
        ? [[key, item.trim().slice(0, MAX_UTM_VALUE_LENGTH)]]
        : []
    }),
  )

  return Object.keys(utm).length > 0 ? utm : null
}

function sanitizeMessages(messages: unknown[]): Array<{
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}> {
  return messages
    .filter((message): message is Record<string, unknown> => (
      !!message && typeof message === 'object' && !Array.isArray(message)
    ))
    .filter((message) => typeof message.role === 'string' && ALLOWED_ROLES.has(message.role))
    .slice(0, MAX_MESSAGES)
    .map((message) => ({
      id: typeof message.id === 'string' && message.id ? message.id : crypto.randomUUID(),
      role: message.role as 'user' | 'assistant',
      content: typeof message.content === 'string' ? message.content.slice(0, MAX_CONTENT_LENGTH) : '',
      timestamp: typeof message.timestamp === 'string' && message.timestamp
        ? message.timestamp
        : new Date().toISOString(),
    }))
}

export function normalizeGuestMigrationInput(value: unknown): GuestMigrationInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const input = value as Record<string, unknown>
  if (
    typeof input.sessionId !== 'string' ||
    input.sessionId.length === 0 ||
    input.sessionId.length > 200 ||
    !Array.isArray(input.messages)
  ) {
    return null
  }

  return {
    sessionId: input.sessionId,
    pathway: typeof input.pathway === 'string' ? input.pathway : undefined,
    messages: input.messages,
    utm: input.utm,
  }
}

/**
 * Persist one guest session for the authenticated actor.
 * The deterministic id keeps retries from creating a second session without a schema change.
 */
export async function migrateGuestSession(
  userId: string,
  input: GuestMigrationInput,
  db: Queryable = getDatabasePool(),
): Promise<MigratedGuestSession | null> {
  const messages = sanitizeMessages(input.messages)
  if (messages.length === 0) return null

  const pathway = input.pathway === 'plan-grill' ? 'plan-grill' : 'quick-decision'
  const planGrillConfig = pathway === 'plan-grill' ? getPathwayConfig('plan-grill') : undefined
  const firstUserMessage = messages.find((message) => message.role === 'user')
  const title = firstUserMessage
    ? firstUserMessage.content.split(/\s+/).slice(0, 6).join(' ')
    : 'Guest Session'
  const utm = sanitizeUtm(input.utm)
  const columns = [
    'id',
    'user_id',
    'workspace_id',
    'pathway',
    'title',
    'current_phase',
    'current_template',
    'current_step',
    'templates',
    'next_steps',
    'status',
    'overall_completion',
    'message_count',
    'message_limit',
    'chat_context',
    ...(utm ? ['utm'] : []),
  ]
  const values = [
    userId,
    pathway,
    title,
    planGrillConfig?.phase || 'discovery',
    messages.filter((message) => message.role === 'user').length,
    planGrillConfig?.messageLimit || 10,
    JSON.stringify(messages),
    ...(utm ? [JSON.stringify(utm)] : []),
  ]
  const placeholders = [
    `md5($2 || ':' || $1)::uuid`,
    '$2',
    '$2',
    '$3',
    '$4',
    "'general'",
    "'chat'",
    "'{}'",
    "'{}'",
    "'active'",
    '$6',
    '$7',
    '$8::jsonb',
    ...(utm ? ['$9::jsonb'] : []),
  ]

  const query = `
    insert into public.bmad_sessions (${columns.join(', ')})
    values (${placeholders.join(', ')})
    on conflict (id) do nothing
    returning id
  `
  const result = await db.query<{ id: string }>(query, [input.sessionId, ...values])
  const id = result.rows[0]?.id

  if (id) {
    return { id, messageCount: messages.length }
  }

  const existing = await db.query<{ id: string }>(
    `
      select id
      from public.bmad_sessions
      where id = md5($1 || ':' || $2)::uuid
        and user_id = $1
      limit 1
    `,
    [userId, input.sessionId],
  )

  return existing.rows[0]
    ? { id: existing.rows[0].id, messageCount: messages.length }
    : null
}
