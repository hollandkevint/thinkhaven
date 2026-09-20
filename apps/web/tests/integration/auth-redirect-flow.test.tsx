import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DashboardRedirect from '../../app/dashboard/page'
import AppDashboardPage from '../../app/app/page'
import { useAuth } from '../../lib/auth/AuthContext'
import { SessionMigration } from '../../lib/guest/session-migration'

// Integration coverage for the dashboard route family:
// - /dashboard is a legacy client shim that replaces to /app
// - /app (AppDashboardPage) owns session loading, empty/error states, and retry
// Auth gating itself is server-side in app/app/layout.tsx (redirect to /login),
// so it is not assertable from these client components.

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('../../lib/auth/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../lib/guest/session-migration', () => ({
  SessionMigration: {
    hasGuestSession: vi.fn(() => false),
    migrateToUserWorkspace: vi.fn()
  }
}))

vi.mock('../../app/components/ui/ErrorState', () => ({
  ErrorState: ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div data-testid="error-state">
      <p>{error}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}))

vi.mock('../../app/components/feedback/FeedbackButton', () => ({
  FeedbackButton: () => <div data-testid="feedback-button" />
}))

const mockUseRouter = vi.mocked(useRouter)
const mockUseAuth = vi.mocked(useAuth)
const mockMigration = vi.mocked(SessionMigration)
const mockFetch = vi.fn()

const mockUser = {
  id: 'test-user',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' }
}

const sampleSession = {
  id: 'session-1',
  user_id: 'test-user',
  pathway: 'new-idea',
  title: 'Pricing decision',
  current_phase: 'CHALLENGE',
  message_count: 4,
  message_limit: 30,
  status: 'active',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: new Date().toISOString()
}

function mockSessionsResponse(body: unknown, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(body),
  }
}

describe('Dashboard route integration', () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace } as never)
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn()
    } as never)
    mockMigration.hasGuestSession.mockReturnValue(false)
  })

  describe('Legacy /dashboard shim', () => {
    it('replaces to /app on mount', async () => {
      render(<DashboardRedirect />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/app')
      })
      expect(screen.getByText('Redirecting...')).toBeInTheDocument()
    })
  })

  describe('App dashboard rendering', () => {
    it('renders nothing when there is no user (layout owns the redirect)', () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() } as never)

      const { container } = render(<AppDashboardPage />)

      expect(container.firstChild).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('loads and displays the user sessions', async () => {
      mockFetch.mockResolvedValueOnce(mockSessionsResponse([sampleSession]))

      render(<AppDashboardPage />)

      // Title appears in both the sidebar recent list and the session grid.
      await waitFor(() => {
        expect(screen.getAllByText('Pricing decision').length).toBeGreaterThan(0)
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/sessions', { cache: 'no-store' })
      // Better Auth scopes the server request; the browser does not submit a user id.
      expect(JSON.stringify(mockFetch.mock.calls[0])).not.toContain('test-user')
    })

    it('shows the empty state when the user has no sessions', async () => {
      mockFetch.mockResolvedValueOnce(mockSessionsResponse([]))

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Nothing yet. What are you trying to decide?')
        ).toBeInTheDocument()
      })
      expect(screen.getByText('Start a session')).toBeInTheDocument()
    })

    it('redirects into a migrated session when a guest session exists', async () => {
      mockMigration.hasGuestSession.mockReturnValue(true)
      mockMigration.migrateToUserWorkspace.mockResolvedValue({
        success: true,
        sessionId: 'migrated-1'
      } as never)

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/session/migrated-1')
      })
      expect(mockMigration.migrateToUserWorkspace).toHaveBeenCalledWith('test-user')
    })
  })

  describe('Error handling and retry', () => {
    it('shows the error state when the sessions query fails', async () => {
      mockFetch.mockResolvedValueOnce(
        mockSessionsResponse({ error: 'Railway database unavailable' }, false),
      )

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.getByText('Railway database unavailable')).toBeInTheDocument()
    })

    it('retry refetches and recovers to the loaded view', async () => {
      mockFetch
        .mockResolvedValueOnce(mockSessionsResponse({ error: 'Network request failed' }, false))
        .mockResolvedValueOnce(mockSessionsResponse([sampleSession]))

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })

      act(() => {
        screen.getByText('Retry').click()
      })

      await waitFor(() => {
        expect(screen.getAllByText('Pricing decision').length).toBeGreaterThan(0)
      })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch.mock.calls[0][0]).toBe('/api/sessions')
      expect(mockFetch.mock.calls[1][0]).toBe('/api/sessions')
    })
  })
})
