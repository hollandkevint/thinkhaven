import { betterAuth, type User } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { PostgresDialect } from 'kysely'
import { Pool, type PoolClient } from 'pg'
import { getDatabasePool } from '../db/pool'

const AUTH_SCHEMA = 'app_auth'

export class RailwayAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RailwayAuthConfigurationError'
  }
}

export type RailwayAuthEmailKind = 'verification' | 'reset-password'

export type RailwayAuthEmail = {
  kind: RailwayAuthEmailKind
  user: Pick<User, 'email' | 'name'>
  url: string
  token: string
  request?: Request
}

export type RailwayAuthEmailSender = (email: RailwayAuthEmail) => Promise<void>

type RailwayAuthFactoryOptions = {
  env?: NodeJS.ProcessEnv
  pool?: Pool
  sendEmail?: RailwayAuthEmailSender
}

function required(env: NodeJS.ProcessEnv, key: string, ...aliases: string[]): string {
  for (const name of [key, ...aliases]) {
    const value = env[name]?.trim()
    if (value) return value
  }
  throw new RailwayAuthConfigurationError(`${key} must be set before using Railway Auth.`)
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

export function createResendAuthEmailSender(env: NodeJS.ProcessEnv = process.env): RailwayAuthEmailSender {
  return async ({ kind, user, url }) => {
    const apiKey = required(env, 'RESEND_API_KEY')
    const from = required(env, 'RESEND_FROM_EMAIL')
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const action = kind === 'verification' ? 'verify your email address' : 'reset your password'
    await resend.emails.send({
      from,
      to: user.email,
      subject: kind === 'verification' ? 'Verify your ThinkHaven email' : 'Reset your ThinkHaven password',
      text: `Use this link to ${action}: ${url}`,
      html: `<p>Use this link to ${escapeHtml(action)}:</p><p><a href="${escapeHtml(url)}">Continue</a></p>`,
    })
  }
}

function createAuthEmailCallback(sender: RailwayAuthEmailSender, kind: RailwayAuthEmailKind) {
  return async (data: { user: User; url: string; token: string }, request?: Request) => {
    await sender({ kind, user: data.user, url: data.url, token: data.token, request })
  }
}

export function createRailwayAuth(options: RailwayAuthFactoryOptions = {}) {
  const env = options.env ?? process.env
  required(env, 'DATABASE_URL')
  const secret = required(env, 'BETTER_AUTH_SECRET', 'AUTH_SECRET')
  const clientId = required(env, 'GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  const clientSecret = required(env, 'GOOGLE_CLIENT_SECRET')
  const databasePool = options.pool ?? getDatabasePool(env)
  const sendEmail = options.sendEmail ?? createResendAuthEmailSender(env)
  const baseURL = env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim()

  return betterAuth({
    appName: 'ThinkHaven',
    ...(baseURL ? { baseURL } : {}),
    secret,
    database: {
      dialect: new PostgresDialect({ pool: databasePool }),
      type: 'postgres',
      schemaName: AUTH_SCHEMA,
      transaction: true,
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: createAuthEmailCallback(sendEmail, 'reset-password'),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: createAuthEmailCallback(sendEmail, 'verification'),
    },
    socialProviders: {
      google: { clientId, clientSecret },
    },
    plugins: [nextCookies()],
  })
}

let auth: ReturnType<typeof createRailwayAuth> | undefined

export function getRailwayAuth() {
  auth ??= createRailwayAuth()
  return auth
}

export async function withDatabaseTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
  databasePool: Pool = getDatabasePool(),
): Promise<T> {
  const client = await databasePool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Preserve the original failure.
    }
    throw error
  } finally {
    client.release()
  }
}
