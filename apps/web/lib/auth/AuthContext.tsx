'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { authLogger } from '../monitoring/auth-logger'
import posthog from 'posthog-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session?.user?.email || 'No user')
      setUser(session?.user ?? null)
      setLoading(false) // Always set loading to false after initial session check
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state change:', {
        event,
        user: session?.user?.email || 'No user',
        provider: session?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })

      setUser(session?.user ?? null)
      setLoading(false)
      
      // PostHog identity management (capture/identify no-op before init)
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, {
          auth_provider: session.user.app_metadata?.provider || 'email',
        })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }

      // Handle authentication events with structured logging
      if (event === 'SIGNED_IN' && session) {
        const authMethod = session.user.app_metadata?.provider === 'google' ? 'oauth_google' : 'email_password'

        // This success event is already logged in the callback for OAuth
        // Only log if it's email/password authentication
        if (authMethod === 'email_password') {
          authLogger.logAuthSuccess(
            authMethod,
            session.user.id,
            session.user.email || '',
            0, // Latency not tracked for context events
            `context_signin_${Date.now()}`,
            session.access_token.substring(0, 10) + '...'
          )
        }
      } else if (event === 'SIGNED_OUT') {
        if (session?.user) {
          authLogger.logLogout(
            session.user.id,
            session.access_token?.substring(0, 10) + '...'
          )
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        authLogger.logSessionRefresh(
          session.user.id,
          session.access_token.substring(0, 10) + '...'
        )
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('oauth_google')

    try {
      console.log('AuthContext: Starting Google OAuth signin flow')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        const latencyMs = Date.now() - startTime

        await authLogger.logAuthFailure(
          'oauth_google',
          'oauth_initiation_error',
          error.message || 'Google signin failed',
          latencyMs,
          correlationId
        )

        throw new Error(error.message || 'Google signin failed')
      }

      if (data?.url) {
        console.log('AuthContext: Redirecting to Google OAuth')
        window.location.href = data.url
      } else {
        throw new Error('Failed to initiate Google signin - no redirect URL received')
      }

    } catch (err) {
      const latencyMs = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'oauth_google',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId
      )

      console.error('AuthContext: Error during Google signin:', err)
      throw err
    }
  }


  const signInWithEmail = async (email: string, password: string) => {
    const startTime = Date.now()
    const correlationId = await authLogger.logAuthInitiation('email_password')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      const latencyMs = Date.now() - startTime

      if (error) {
        // Categorize email auth errors
        let errorType = 'email_auth_error'
        if (error.message?.includes('Invalid login credentials')) {
          errorType = 'invalid_credentials'
        } else if (error.message?.includes('Email not confirmed')) {
          errorType = 'email_not_confirmed'
        } else if (error.message?.includes('Too many requests')) {
          errorType = 'rate_limited'
        } else if (error.message?.includes('network')) {
          errorType = 'network_error'
        }

        await authLogger.logAuthFailure(
          'email_password',
          errorType,
          error.message,
          latencyMs,
          correlationId,
          undefined // No user ID available for failed auth
        )
      } else if (data?.user) {
        await authLogger.logAuthSuccess(
          'email_password',
          data.user.id,
          data.user.email || '',
          latencyMs,
          correlationId,
          data.session?.access_token?.substring(0, 10) + '...'
        )
      }

      return { error }
    } catch (err) {
      const latencyMs = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      await authLogger.logAuthFailure(
        'email_password',
        'unexpected_error',
        errorMessage,
        latencyMs,
        correlationId
      )

      throw err
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
