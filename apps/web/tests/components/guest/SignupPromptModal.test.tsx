import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SignupPromptModal from '@/app/components/guest/SignupPromptModal'

const push = vi.fn()
const onClose = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/lib/guest/session-migration', () => ({
  SessionMigration: {
    generateSessionSummary: vi.fn(() => 'Mock guest summary'),
  },
}))

vi.mock('@/lib/analytics/events', () => ({
  track: vi.fn(),
}))

describe('SignupPromptModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  it('renders as an accessible dialog for the guest message limit', () => {
    render(<SignupPromptModal isOpen onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Save the thread before it disappears' })).toBeInTheDocument()
    expect(screen.getByText(/10 free messages/)).toBeInTheDocument()
    expect(screen.getByText('Your conversation will be saved')).toBeInTheDocument()
  })

  it('routes signup to the guest conversion path', () => {
    render(<SignupPromptModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign up to continue' }))

    expect(push).toHaveBeenCalledWith('/signup?from=guest')
  })

  it('preserves beta invite context when sending guests to signup', () => {
    window.sessionStorage.setItem(
      'thinkhaven_beta_invite',
      JSON.stringify({
        inviteId: 'beta-row-1',
        source: 'beta_invite',
        fromGuest: false,
      })
    )

    render(<SignupPromptModal isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /sign up to continue/i }))

    expect(push).toHaveBeenCalledWith(
      '/signup?beta_invite=beta-row-1&source=beta_invite&from=guest'
    )
  })

  it('preserves beta invite context on the sign-in link', () => {
    window.sessionStorage.setItem(
      'thinkhaven_beta_invite',
      JSON.stringify({
        inviteId: 'beta-row-2',
        source: 'beta_invite',
        fromGuest: false,
      })
    )

    render(<SignupPromptModal isOpen onClose={onClose} />)

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login?beta_invite=beta-row-2&source=beta_invite'
    )
  })

  it('shows the generated conversation summary without closing', () => {
    render(<SignupPromptModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /View conversation summary/ }))

    expect(screen.getByRole('dialog', { name: 'Your conversation summary' })).toBeInTheDocument()
    expect(screen.getByText('Mock guest summary')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    render(<SignupPromptModal isOpen onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})
