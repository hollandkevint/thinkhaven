import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DashboardRedirect from '../../app/dashboard/page'
import AppDashboardPage from '../../app/app/page'
import { useAuth } from '../../lib/auth/AuthContext'
import { supabase } from '../../lib/supabase/client'
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

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
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
const mockSupabase = vi.mocked(supabase)
const mockMigration = vi.mocked(SessionMigration)

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

// Builds the .from('bmad_sessions').select().eq().order().limit() chain.
function mockSessionsQuery(result: { data: unknown[] | null; error: unknown }) {
  const limit = vi.fn(() => Promise.resolve(result))
  const order = vi.fn(() => ({ limit }))
  const eq = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq }))
  mockSupabase.from.mockReturnValue({ select } as never)
  return { select, eq, order, limit }
}

describe('Dashboard route integration', () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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
      mockSessionsQuery({ data: [], error: null })

      const { container } = render(<AppDashboardPage />)

      expect(container.firstChild).toBeNull()
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('loads and displays the user sessions', async () => {
      const { eq, limit } = mockSessionsQuery({ data: [sampleSession], error: null })

      render(<AppDashboardPage />)

      // Title appears in both the sidebar recent list and the session grid.
      await waitFor(() => {
        expect(screen.getAllByText('Pricing decision').length).toBeGreaterThan(0)
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('bmad_sessions')
      expect(eq).toHaveBeenCalledWith('user_id', 'test-user')
      expect(limit).toHaveBeenCalledWith(50)
    })

    it('shows the empty state when the user has no sessions', async () => {
      mockSessionsQuery({ data: [], error: null })

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
      mockSessionsQuery({ data: [], error: null })

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/session/migrated-1')
      })
      expect(mockMigration.migrateToUserWorkspace).toHaveBeenCalledWith('test-user')
    })
  })

  describe('Error handling and retry', () => {
    it('shows the error state when the sessions query fails', async () => {
      mockSessionsQuery({ data: null, error: new Error('relation does not exist') })

      render(<AppDashboardPage />)

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.getByText('relation does not exist')).toBeInTheDocument()
    })

    it('retry refetches and recovers to the loaded view', async () => {
      const limit = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: new Error('Network request failed') })
        .mockResolvedValueOnce({ data: [sampleSession], error: null })
      const order = vi.fn(() => ({ limit }))
      const eq = vi.fn(() => ({ order }))
      const select = vi.fn(() => ({ eq }))
      mockSupabase.from.mockReturnValue({ select } as never)

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
      expect(limit).toHaveBeenCalledTimes(2)
    })
  })
})
