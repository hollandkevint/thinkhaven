import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../../lib/auth/AuthContext'
import { railwayAuthClient } from '../../../lib/auth/railway-auth-client'
import { authLogger } from '../../../lib/monitoring/auth-logger'
import posthog from 'posthog-js'

interface TestUser {
  id: string
  email: string
  name: string
  image: string
  createdAt: string
  provider?: string
}

interface TestSessionData {
  user: TestUser
  session: {
    id: string
    updatedAt: string
    expiresAt: string
  }
}

interface TestSessionState {
  data: TestSessionData | null
  error: null
  isPending: boolean
  isRefetching: boolean
}

vi.mock('../../../lib/auth/railway-auth-client', () => ({
  railwayAuthClient: {
    useSession: { subscribe: vi.fn() },
    signIn: {
      social: vi.fn(),
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}))

vi.mock('../../../lib/monitoring/auth-logger', () => ({
  authLogger: {
    logAuthInitiation: vi.fn().mockResolvedValue('corr-test'),
    logAuthSuccess: vi.fn().mockResolvedValue(undefined),
    logAuthFailure: vi.fn().mockResolvedValue(undefined),
    logLogout: vi.fn().mockResolvedValue(undefined),
    logSessionRefresh: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), reset: vi.fn() },
}))

const mockAuthClient = vi.mocked(railwayAuthClient)
const mockSessionAtom = mockAuthClient.useSession
const mockSubscribe = vi.mocked(mockSessionAtom.subscribe)
const mockSocialSignIn = mockAuthClient.signIn.social as unknown as ReturnType<typeof vi.fn>
const mockEmailSignIn = mockAuthClient.signIn.email as unknown as ReturnType<typeof vi.fn>
const mockAuthLogger = vi.mocked(authLogger)
const mockPosthog = vi.mocked(posthog)

let authApi: ReturnType<typeof useAuth> | undefined
let sessionListener: ((state: TestSessionState) => void) | undefined
let initialSessionState: TestSessionState

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
  const mockUser: TestUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    createdAt: '2023-01-01T00:00:00Z',
    provider: 'google',
  }

  const mockSession: TestSessionData = {
    user: mockUser,
    session: {
      id: 'session-1',
      updatedAt: '2026-09-19T12:00:00Z',
      expiresAt: '2026-09-19T13:00:00Z',
    },
  }

  let mockUnsubscribe: ReturnType<typeof vi.fn>
  let mockLocation: { origin: string; href: string }

  beforeEach(() => {
    vi.clearAllMocks()
    authApi = undefined
    sessionListener = undefined
    mockUnsubscribe = vi.fn()
    mockAuthLogger.logAuthInitiation.mockResolvedValue('corr-test')

    initialSessionState = {
      data: null,
      error: null,
      isPending: false,
      isRefetching: false,
    }

    mockSubscribe.mockImplementation((listener) => {
      sessionListener = listener as unknown as (state: TestSessionState) => void
      sessionListener(initialSessionState)
      if (initialSessionState.isPending) {
        queueMicrotask(() => sessionListener?.({ ...initialSessionState, isPending: false }))
      }
      return mockUnsubscribe
    })
    mockAuthClient.signOut.mockResolvedValue({ data: { success: true }, error: null })
    mockSocialSignIn.mockResolvedValue({
      data: { redirect: true, url: 'https://accounts.google.com/oauth-redirect' },
      error: null,
    })
    mockEmailSignIn.mockResolvedValue({
      data: { redirect: false, token: 'unused-test-token', user: mockUser },
      error: null,
    })

    mockLocation = { origin: 'http://localhost:3000', href: 'http://localhost:3000/' }
    vi.stubGlobal('location', mockLocation)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function renderProvider() {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )
  }

  async function waitForReady() {
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  }

  function emitSession(data: TestSessionData | null, overrides: Partial<TestSessionState> = {}) {
    act(() => {
      sessionListener?.({
        data,
        error: null,
        isPending: false,
        isRefetching: false,
        ...overrides,
      })
    })
  }

  describe('Provider Initialization', () => {
    it('renders children and initializes with loading state', async () => {
      initialSessionState = { ...initialSessionState, isPending: true }
      renderProvider()

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(mockSubscribe).toHaveBeenCalled()
      await waitForReady()
    })

    it('sets initial session when user is authenticated', async () => {
      initialSessionState = { ...initialSessionState, data: mockSession }
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
    it('handles a signed-in session: sets user and identifies in PostHog', async () => {
      renderProvider()
      await waitForReady()

      emitSession(mockSession)

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })
      expect(mockPosthog.identify).toHaveBeenCalledWith('test-user-id', {
        auth_provider: 'google',
      })
      expect(mockAuthLogger.logAuthSuccess).not.toHaveBeenCalled()
    })

    it('logs auth success for an email/password session without a token', async () => {
      renderProvider()
      await waitForReady()

      emitSession({
        ...mockSession,
        user: { ...mockUser, provider: 'email' },
      })

      await waitFor(() => {
        expect(mockAuthLogger.logAuthSuccess).toHaveBeenCalledWith(
          'email_password',
          'test-user-id',
          'test@example.com',
          0,
          expect.stringContaining('context_signin_'),
        )
      })
    })

    it('handles sign out: clears user and resets PostHog', async () => {
      initialSessionState = { ...initialSessionState, data: mockSession }
      renderProvider()
      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument()
      })

      emitSession(null)

      await waitFor(() => {
        expect(screen.getByTestId('no-user')).toBeInTheDocument()
      })
      expect(mockPosthog.reset).toHaveBeenCalled()
      expect(mockAuthLogger.logLogout).toHaveBeenCalledWith('test-user-id')
    })

    it('logs session refresh without exposing a token', async () => {
      renderProvider()
      await waitForReady()

      emitSession(mockSession)
      emitSession({
        ...mockSession,
        session: { ...mockSession.session, id: 'session-2' },
      })

      await waitFor(() => {
        expect(mockAuthLogger.logSessionRefresh).toHaveBeenCalledWith('test-user-id', 'session-2')
      })
    })
  })

  describe('Google Sign In (OAuth redirect flow)', () => {
    it('initiates OAuth with the default final callback and follows the URL', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle()
      })

      expect(mockSocialSignIn).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: 'http://localhost:3000/app',
        disableRedirect: true,
      })
      expect(mockLocation.href).toBe('https://accounts.google.com/oauth-redirect')
      expect(mockAuthLogger.logAuthInitiation).toHaveBeenCalledWith('oauth_google')
    })

    it('honors a safe custom redirectTo', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle('http://localhost:3000/after-login')
      })

      expect(mockSocialSignIn).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: 'http://localhost:3000/after-login',
        disableRedirect: true,
      })
    })

    it('converts the legacy callback URL to a safe invite destination', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle(
          'http://localhost:3000/auth/callback?next=%2Ftry%3Fbeta_invite%3Dinvite-1%26source%3Dbeta_invite',
        )
      })

      expect(mockSocialSignIn).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: 'http://localhost:3000/try?beta_invite=invite-1&source=beta_invite',
        disableRedirect: true,
      })
    })

    it('falls back to the app when a callback destination is not same-origin and safe', async () => {
      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithGoogle('https://evil.example/steal')
      })

      expect(mockSocialSignIn).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: 'http://localhost:3000/app',
        disableRedirect: true,
      })
    })

    it('throws and logs failure when OAuth initiation returns an error', async () => {
      mockSocialSignIn.mockResolvedValue({
        data: null,
        error: { message: 'Provider not configured', status: 400, name: 'ProviderError' },
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
        'corr-test',
      )

      consoleErrorSpy.mockRestore()
    })

    it('throws when no redirect URL is returned', async () => {
      mockSocialSignIn.mockResolvedValue({
        data: { redirect: false, url: undefined },
        error: null,
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      await expect(authApi!.signInWithGoogle()).rejects.toThrow(
        'Failed to initiate Google signin - no redirect URL received',
      )
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'oauth_google',
        'unexpected_error',
        'Failed to initiate Google signin - no redirect URL received',
        expect.any(Number),
        'corr-test',
      )

      consoleErrorSpy.mockRestore()
    })

    it('rethrows unexpected errors and logs them', async () => {
      mockSocialSignIn.mockRejectedValue(new Error('Network down'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      await expect(authApi!.signInWithGoogle()).rejects.toThrow('Network down')
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'oauth_google',
        'unexpected_error',
        'Network down',
        expect.any(Number),
        'corr-test',
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Email Sign In', () => {
    it('signs in with credentials and logs success without a token', async () => {
      renderProvider()
      await waitForReady()

      let result: { error: unknown } | undefined
      await act(async () => {
        result = await authApi!.signInWithEmail('test@example.com', 'password')
      })

      expect(mockEmailSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
      expect(result!.error).toBeNull()
      expect(mockAuthLogger.logAuthSuccess).toHaveBeenCalledWith(
        'email_password',
        'test-user-id',
        'test@example.com',
        expect.any(Number),
        'corr-test',
      )
    })

    it('returns the compatibility error and logs categorized failure for invalid credentials', async () => {
      mockEmailSignIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email or password', code: 'INVALID_EMAIL_OR_PASSWORD' },
      })

      renderProvider()
      await waitForReady()

      let result: { error: { message: string } | null } | undefined
      await act(async () => {
        result = await authApi!.signInWithEmail('test@example.com', 'wrong')
      })

      expect(result!.error).toMatchObject({ message: 'Invalid login credentials' })
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'email_password',
        'invalid_credentials',
        'Invalid login credentials',
        expect.any(Number),
        'corr-test',
        undefined,
      )
    })

    it('categorizes unverified-email and rate-limit errors', async () => {
      mockEmailSignIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' },
      })

      renderProvider()
      await waitForReady()

      await act(async () => {
        await authApi!.signInWithEmail('test@example.com', 'wrong')
      })
      expect(mockAuthLogger.logAuthFailure).toHaveBeenCalledWith(
        'email_password',
        'email_not_confirmed',
        'Email not confirmed',
        expect.any(Number),
        'corr-test',
        undefined,
      )

      mockEmailSignIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Too many requests', status: 429 },
      })
      await act(async () => {
        await authApi!.signInWithEmail('test@example.com', 'wrong')
      })
      expect(mockAuthLogger.logAuthFailure).toHaveBeenLastCalledWith(
        'email_password',
        'rate_limited',
        'Too many requests',
        expect.any(Number),
        'corr-test',
        undefined,
      )
    })
  })

  describe('Sign Out', () => {
    it('handles successful sign out', async () => {
      initialSessionState = { ...initialSessionState, data: mockSession }
      renderProvider()
      await waitFor(() => {
        expect(screen.getByTestId('signout-btn')).toBeInTheDocument()
      })

      await act(async () => {
        await authApi!.signOut()
      })

      expect(mockAuthClient.signOut).toHaveBeenCalled()
    })
  })

  describe('Component Cleanup', () => {
    it('unsubscribes from the Better Auth session atom on unmount', async () => {
      const { unmount } = renderProvider()

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Hook Usage Outside Provider', () => {
    it('throws an error when useAuth is used outside AuthProvider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Logging and Debugging', () => {
    it('logs initial session information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      initialSessionState = { ...initialSessionState, data: mockSession }

      renderProvider()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Initial session:'),
          'test@example.com',
        )
      })

      consoleSpy.mockRestore()
    })

    it('logs auth state changes with metadata and no token material', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      renderProvider()
      await waitForReady()

      emitSession(mockSession)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Auth state change:'),
          expect.objectContaining({
            event: 'SIGNED_IN',
            user: 'test@example.com',
            provider: 'google',
            timestamp: expect.any(String),
          }),
        )
      })

      expect(consoleSpy.mock.calls.flat()).not.toContain('mock-access-token')
      consoleSpy.mockRestore()
    })
  })
})
