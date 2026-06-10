import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../lib/auth/AuthContext'
import { supabase } from '../../../lib/supabase/client'
import { authLogger } from '../../../lib/monitoring/auth-logger'
import posthog from 'posthog-js'
import type { Session, User } from '@supabase/supabase-js'

// Mock Supabase client — surface must match what AuthContext actually calls:
// getSession, onAuthStateChange, signOut, signInWithOAuth (redirect flow), signInWithPassword.
vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn()
    }
  }
}))

vi.mock('../../../lib/monitoring/auth-logger', () => ({
  authLogger: {
    logAuthInitiation: vi.fn().mockResolvedValue('corr-test'),
    logAuthSuccess: vi.fn().mockResolvedValue(undefined),
    logAuthFailure: vi.fn().mockResolvedValue(undefined),
    logLogout: vi.fn().mockResolvedValue(undefined),
    logSessionRefresh: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), reset: vi.fn() }
}))

const mockSupabase = vi.mocked(supabase)
const mockAuthLogger = vi.mocked(authLogger)
const mockPosthog = vi.mocked(posthog)

// Captures the auth API so tests can call methods directly and assert rejections,
// instead of clicking buttons whose handlers swallow promises.
let authApi: ReturnType<typeof useAuth> | undefined

function TestComponent() {
  const auth = useAuth()
  authApi = auth
  const { user, loading, signOut } = auth

  if (loading) {
    return <div data-testid="loading">Loading...</div>
  }

  return (
    <div data-testid="auth-component">
      {user ? (
        <div>
          <span data-testid="user-email">{user.email}</span>
          <button data-testid="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <span data-testid="no-user">No user</span>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: { provider: 'google' },
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated'
  }

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600000
  }

  let mockSubscription: { unsubscribe: ReturnType<typeof vi.fn> }
  let mockLocation: { origin: string; href: string }

  beforeEach(() => {
    vi.clearAllMocks()
    authApi = undefined

    mockSubscription = { unsubscribe: vi.fn() }
    mockAuthLogger.logAuthInitiation.mockResolvedValue('corr-test')

    // signInWithGoogle assigns window.location.href on success; jsdom can't navigate.
    mockLocation = { origin: 'http://localhost:3000', href: 'http://localhost:3000/' }
    vi.stubGlobal('location', mockLocation)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/oauth-redirect' },
      error: null
    })
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function renderProvider() {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
  }

  async function waitForReady() {
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  }

  describe('Provider Initialization', () => {
    it('renders children and initializes with loading state', async () => {
      renderProvider()

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      await waitForReady()
    })

    it('sets initial session when user is authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })

    it('sets null user when no session exists', async () => {
      renderProvider()

      await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument()
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Authentication State Changes', () => {
    function captureAuthCallback() {
      let authCallback: ((event: string, session: Session | null) => void) | undefined
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })
      return () => authCallback!
    }

    it('handles SIGNED_IN event: sets user and identifies in PostHog', async () => {
      const getCallback = captureAuthCallback()
      renderProvider()
      await waitForReady()

      act(() => {
        getCallback()('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })
      expect(mockPosthog.identify).toHaveBeenCalledWith('test-user-id', {
        auth_provider: 'google'
      })
      // OAuth signins are logged in the OAuth callback route, not here.
      expect(mockAuthLogger.logAuthSuccess).not.toHaveBeenCalled()
    })

    it('logs auth success on SIGNED_IN for email/password sessions', async () => {
      const getCallback = captureAuthCallback()
      renderProvider()
      await waitForReady()

      const emailSession: Session = {
        ...mockSession,
        user: { ...mockUser, app_metadata: { provider: 'email' } }
      }
      act(() => {
        getCallback()('SIGNED_IN', emailSession)
      })

      await waitFor(() => {
        expect(mockAuthLogger.logAuthSuccess).toHaveBeenCalledWith(
          'email_password',
          'test-user-id',
          'test@example.com',
          0,
          expect.stringContaining('context_signin_'),
          expect.stringContaining('...')
        )
      })
    })

    it('handles SIGNED_OUT event: clears user and resets PostHog', async () => {
      const getCallback = captureAuthCallback()
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      renderProvider()
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument()
      })

      act(() => {
        getCallback()('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument()
      })
      expect(mockPosthog.reset).toHaveBeenCalled()
    })

    it('handles TOKEN_REFRESHED event: logs session refresh', async () => {
      const getCallback = captureAuthCallback()
      renderProvider()
      await waitForReady()

      act(() => {
        getCallback()('TOKEN_REFRESHED', mockSession)
      })

      await waitFor(() => {
        expect(mockAuthLogger.logSessionRefresh).toHaveBeenCalledWith(
          'test-user-id',
          expect.stringContaining('...')
        )
      })
    })
  })

  describe('Google Sign In (OAuth redirect flow)', () => {
    it('initiates OAuth with the default callback redirect and follows the URL', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle()
      })

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/auth/callback' }
      })
      expect(mockLocation.href).toBe('https://accounts.google.com/oauth-redirect')
      expect(mockAuthLogger.logAuthInitiation).toHaveBeenCalledWith('oauth_google')
    })

    it('honors a custom redirectTo', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle('http://localhost:3000/after-login')
      })

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/after-login' }
      })
    })

    it('throws and logs failure when OAuth initiation returns an error', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: null },
        error: { message: 'Provider not configured', status: 400, name: 'ProviderError' }
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      await expect(authApi!.signInWithGoogle()).rejects.toThrow('Provider not configured')
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'oauth_google',
        'oauth_initiation_error',
        'Provider not configured',
        expect.any(Number),
        'corr-test'
      )

      consoleErrorSpy.mockRestore()
    })

    it('throws when no redirect URL is returned', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: null },
        error: null
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      await expect(authApi!.signInWithGoogle()).rejects.toThrow(
        'Failed to initiate Google signin - no redirect URL received'
      )
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'oauth_google',
        'unexpected_error',
        'Failed to initiate Google signin - no redirect URL received',
        expect.any(Number),
        'corr-test'
      )

      consoleErrorSpy.mockRestore()
    })

    it('rethrows unexpected errors and logs them', async () => {
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(new Error('Network down'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      await expect(authApi!.signInWithGoogle()).rejects.toThrow('Network down')
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'oauth_google',
        'unexpected_error',
        'Network down',
        expect.any(Number),
        'corr-test'
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Email Sign In', () => {
    it('signs in with credentials and logs success', async () => {
      renderProvider()
      await waitForReady()

      let result: { error: unknown } | undefined
      await act(async () => {
        result = await authApi!.signInWithEmail('test@example.com', 'password')
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
      expect(result!.error).toBeNull()
      expect(mockAuthLogger.logAuthSuccess).toHaveBeenCalledWith(
        'email_password',
        'test-user-id',
        'test@example.com',
        expect.any(Number),
        'corr-test',
        expect.stringContaining('...')
      )
    })

    it('returns the error and logs categorized failure for invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      renderProvider()
      await waitForReady()

      let result: { error: unknown } | undefined
      await act(async () => {
        result = await authApi!.signInWithEmail('test@example.com', 'wrong')
      })

      expect(result!.error).toBe(mockError)
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'email_password',
        'invalid_credentials',
        'Invalid login credentials',
        expect.any(Number),
        'corr-test',
        undefined
      )
    })
  })

  describe('Sign Out', () => {
    it('handles successful sign out', async () => {
      // Session must be mocked before render so the signout button appears.
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      renderProvider()
      await waitFor(() => {
        expect(screen.getByTestId('signout-btn')).toBeInTheDocument()
      })

      act(() => {
        screen.getByTestId('signout-btn').click()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Component Cleanup', () => {
    it('unsubscribes from auth state changes on unmount', async () => {
      const { unmount } = renderProvider()

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Hook Usage Outside Provider', () => {
    it('throws error when useAuth is used outside AuthProvider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Logging and Debugging', () => {
    it('logs initial session information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      renderProvider()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Initial session:'),
          'test@example.com'
        )
      })

      consoleSpy.mockRestore()
    })

    it('logs auth state changes with proper metadata', async () => {
      let authCallback: ((event: string, session: Session | null) => void) | undefined
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      renderProvider()

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      act(() => {
        authCallback!('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Auth state change:'),
          expect.objectContaining({
            event: 'SIGNED_IN',
            user: 'test@example.com',
            provider: 'google',
            timestamp: expect.any(String)
          })
        )
      })

      consoleSpy.mockRestore()
    })
  })
})
