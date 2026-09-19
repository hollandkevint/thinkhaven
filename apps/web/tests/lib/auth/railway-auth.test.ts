import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { createRailwayAuth, RailwayAuthConfigurationError } from '@/lib/auth/railway-auth'

const env = {
  DATABASE_URL: 'postgresql://localhost/thinkhaven',
  BETTER_AUTH_SECRET: 'test-secret',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
} as NodeJS.ProcessEnv

describe('Railway Auth foundation', () => {
  it('fails closed when required configuration is missing', () => {
    expect(() => createRailwayAuth({ env: {} as NodeJS.ProcessEnv, pool: {} as Pool })).toThrow(RailwayAuthConfigurationError)
  })

  it('wires database sessions, Google, and injected email callbacks without connecting', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)
    const auth = createRailwayAuth({ env, pool: {} as Pool, sendEmail })

    expect(auth.options.database).toMatchObject({ type: 'postgres', schemaName: 'app_auth', transaction: true })
    expect(auth.options.emailAndPassword?.enabled).toBe(true)
    expect(auth.options.socialProviders?.google).toEqual({ clientId: 'google-client-id', clientSecret: 'google-client-secret' })

    const data = { user: { email: 'user@example.com', name: 'User' } as never, url: 'http://localhost:3000/verify', token: 'token' }
    await auth.options.emailVerification?.sendVerificationEmail?.(data)
    await auth.options.emailAndPassword?.sendResetPassword?.(data)
    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail).toHaveBeenNthCalledWith(1, expect.objectContaining({ kind: 'verification', url: data.url }))
    expect(sendEmail).toHaveBeenNthCalledWith(2, expect.objectContaining({ kind: 'reset-password', url: data.url }))
  })
})
