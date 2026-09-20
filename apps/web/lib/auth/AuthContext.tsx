'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import posthog from 'posthog-js'
import { isSafeRedirectPath } from '@/lib/beta/invite-destinations'
import { authLogger } from '../monitoring/auth-logger'
import { railwayAuthClient } from './railway-auth-client'

export interface AuthUser {
  id: string
  email: string
  created_at: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
    [key: string]: unknown
  }
  app_metadata: {
    provider?: string
    [key: string]: unknown
  }
}

export interface AuthError {
  message: string
  status?: number
  statusText?: string
  code?: string
  name?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
}

interface BetterAuthUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  createdAt?: Date | string | null
  provider?: string | null
  app_metadata?: Record<string, unknown> | null
  user_metadata?: Record<string, unknown> | null
}

interface BetterAuthSessionData {
  user: BetterAuthUser
  session?: {
    id?: string
    updatedAt?: Date | string | null
    expiresAt?: Date | string | null
  } | null
}

interface BetterAuthSessionState {
  data: BetterAuthSessionData | null
  error?: unknown
  isPending: boolean
  isRefetching?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function errorDetails(error: unknown): { message: string; code?: string; status?: number } {
  if (error instanceof Error) {
    return { message: error.message, code: error.name }
  }

  if (isRecord(error)) {
    return {
      message: typeof error.message === 'string' ? error.message : 'Authentication failed',
      code: typeof error.code === 'string' ? error.code : undefined,
      status: typeof error.status === 'number' ? error.status : undefined,
    }
  }

  return { message: 'Authentication failed' }
}

function asAuthError(error: unknown, message = errorDetails(error).message): AuthError {
  if (isRecord(error)) {
    return { ...error, message } as AuthError
  }

  return { message }
}

function isInvalidCredentials(error: unknown): boolean {
  const { message, code } = errorDetails(error)
  const normalizedMessage = message.toLowerCase()
  return code === 'INVALID_EMAIL_OR_PASSWORD'
    || normalizedMessage.includes('invalid login credentials')
    || normalizedMessage.includes('invalid email or password')
}

function isEmailNotConfirmed(error: unknown): boolean {
  const { message, code } = errorDetails(error)
  const normalizedMessage = message.toLowerCase()
  return code === 'EMAIL_NOT_VERIFIED'
    || normalizedMessage.includes('email not confirmed')
    || normalizedMessage.includes('email not verified')
}

function emailErrorType(error: unknown): string {
  const { message, status } = errorDetails(error)
  const normalizedMessage = message.toLowerCase()

  if (isInvalidCredentials(error)) return 'invalid_credentials'
  if (isEmailNotConfirmed(error)) return 'email_not_confirmed'
  if (status === 429 || normalizedMessage.includes('too many requests')) return 'rate_limited'
  if (normalizedMessage.includes('network')) return 'network_error'
  return 'email_auth_error'
}

function mapUser(user: BetterAuthUser, providerOverride?: string): AuthUser {
  const existingMetadata = isRecord(user.user_metadata) ? user.user_metadata : {}
  const existingAppMetadata = isRecord(user.app_metadata) ? user.app_metadata : {}
  const provider = providerOverride
    || (typeof existingAppMetadata.provider === 'string' ? existingAppMetadata.provider : undefined)
    || user.provider
    || 'email'

  const createdAt = user.createdAt instanceof Date
    ? user.createdAt.toISOString()
    : typeof user.createdAt === 'string'
      ? user.createdAt
      : ''

  return {
    id: user.id,
    email: user.email,
    created_at: createdAt,
    user_metadata: {
      ...existingMetadata,
      ...(typeof existingMetadata.full_name === 'string' || !user.name ? {} : { full_name: user.name }),
      ...(typeof existingMetadata.avatar_url === 'string' || !user.image ? {} : { avatar_url: user.image }),
    },
    app_metadata: {
      ...existingAppMetadata,
      provider,
    },
  }
}

function sessionFingerprint(session: BetterAuthSessionData['session']): string {
  if (!session) return ''
  const updatedAt = session.updatedAt instanceof Date
    ? session.updatedAt.toISOString()
    : session.updatedAt || ''
  const expiresAt = session.expiresAt instanceof Date
    ? session.expiresAt.toISOString()
    : session.expiresAt || ''
  return `${session.id || ''}:${updatedAt}:${expiresAt}`
}

function resolveCallbackUrl(redirectTo?: string): string {
  const origin = window.location.origin
  const fallback = new URL('/app', origin).toString()

  if (!redirectTo) return fallback

  try {
    const requested = new URL(redirectTo, origin)
    if (requested.origin !== origin) return fallback

    const next = requested.searchParams.get('next')
    if (next !== null) {
      if (!isSafeRedirectPath(next)) return fallback
      return new URL(next, origin).toString()
    }

    if (requested.pathname === '/auth/callback') return fallback
    if (!isSafeRedirectPath(requested.pathname)) return fallback
    return requested.toString()
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const providerRef = useRef<string | undefined>(undefined)
  const previousSessionRef = useRef<{ user: AuthUser; fingerprint: string } | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    const sessionAtom = railwayAuthClient.useSession
    const unsubscribe = sessionAtom.subscribe((value) => {
      const state = value as BetterAuthSessionState

      if (state.isPending && !state.data) {
        setLoading(true)
        return
      }

      const nextUser = state.data
        ? mapUser(state.data.user, providerRef.current)
        : null
      const nextFingerprint = sessionFingerprint(state.data?.session)
      const previousSession = previousSessionRef.current

      if (!initializedRef.current) {
        initializedRef.current = true
        console.log('AuthContext: Initial session:', nextUser?.email || 'No user')
        if (nextUser) {
          posthog.identify(nextUser.id, {
            auth_provider: nextUser.app_metadata.provider || 'email',
          })
          previousSessionRef.current = { user: nextUser, fingerprint: nextFingerprint }
        }
      } else if (nextUser) {
        const event = previousSession
          ? previousSession.fingerprint === nextFingerprint ? 'SIGNED_IN' : 'TOKEN_REFRESHED'
          : 'SIGNED_IN'

        console.log('AuthContext: Auth state change:', {
          event,
          user: nextUser.email,
          provider: nextUser.app_metadata.provider,
          timestamp: new Date().toISOString(),
        })

        if (!previousSession) {
          posthog.identify(nextUser.id, {
            auth_provider: nextUser.app_metadata.provider || 'email',
          })
          if (nextUser.app_metadata.provider !== 'google') {
            void authLogger.logAuthSuccess(
              'email_password',
              nextUser.id,
              nextUser.email,
              0,
              `context_signin_${Date.now()}`,
            )
          }
        } else if (event === 'TOKEN_REFRESHED') {
          void authLogger.logSessionRefresh(nextUser.id, state.data?.session?.id || '')
        }

        previousSessionRef.current = { user: nextUser, fingerprint: nextFingerprint }
      } else {
        if (previousSession) {
          console.log('AuthContext: Auth state change:', {
            event: 'SIGNED_OUT',
            user: 'No user',
            provider: undefined,
            timestamp: new Date().toISOString(),
          })
          posthog.reset()
          void authLogger.logLogout(previousSession.user.id)
          previousSessionRef.current = null
          providerRef.current = undefined
        }
      }

      setUser(nextUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await railwayAuthClient.signOut()
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('oauth_google')
    providerRef.current = 'google'

    try {
      console.log('AuthContext: Starting Google OAuth signin flow')

      const { data, error } = await railwayAuthClient.signIn.social({
        provider: 'google',
        callbackURL: resolveCallbackUrl(redirectTo),
        disableRedirect: true,
      })

      if (error) {
        const authError = asAuthError(error)
        const latencyMs = Date.now() - startTime
        await authLogger.logAuthFailure(
          'oauth_google',
          'oauth_initiation_error',
          authError.message,
          latencyMs,
          correlationId,
        )
        throw new Error(authError.message || 'Google signin failed')
      }

      if (data?.url) {
        console.log('AuthContext: Redirecting to Google OAuth')
        window.location.href = data.url
      } else {
        throw new Error('Failed to initiate Google signin - no redirect URL received')
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'oauth_google',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId,
      )

      console.error('AuthContext: Error during Google signin:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('email_password')
    providerRef.current = 'email'

    try {
      const { data, error } = await railwayAuthClient.signIn.email({ email, password })
      const latencyMs = Date.now() - startTime

      if (error) {
        const compatibilityMessage = isInvalidCredentials(error)
          ? 'Invalid login credentials'
          : isEmailNotConfirmed(error)
            ? 'Email not confirmed'
            : errorDetails(error).message
        const authError = asAuthError(error, compatibilityMessage)

        await authLogger.logAuthFailure(
          'email_password',
          emailErrorType(error),
          authError.message,
          latencyMs,
          correlationId,
          undefined,
        )

        return { error: authError }
      }

      if (data?.user) {
        await authLogger.logAuthSuccess(
          'email_password',
          data.user.id,
          data.user.email || email,
          latencyMs,
          correlationId,
        )
      }

      return { error: null }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'email_password',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId,
      )

      throw error
    }
  }

  const value = {
    user,
    loading,
    signOut,
    signInWithGoogle,
    signInWithEmail,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
