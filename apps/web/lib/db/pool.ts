import { Pool } from 'pg'

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseConfigurationError'
  }
}

let pool: Pool | undefined
let poolUrl: string | undefined

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL?.trim()
  if (!url) {
    throw new DatabaseConfigurationError('DATABASE_URL must be set before using the Railway database.')
  }
  return url
}

export function getDatabasePool(env: NodeJS.ProcessEnv = process.env): Pool {
  const url = getDatabaseUrl(env)
  if (!pool || poolUrl !== url) {
    pool = new Pool({ connectionString: url })
    poolUrl = url
  }
  return pool
}

export async function closeDatabasePool(): Promise<void> {
  const current = pool
  pool = undefined
  poolUrl = undefined
  if (current) await current.end()
}
