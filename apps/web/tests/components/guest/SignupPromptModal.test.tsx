import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SignupPromptModal from '../../../app/components/guest/SignupPromptModal'

const mockPush = vi.fn()
const mockOnClose = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../../../lib/guest/session-migration', () => ({
  SessionMigration: {
    generateSessionSummary: () => 'Mock guest summary',
  },
}))

describe('SignupPromptModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders as an accessible dialog for the guest message limit', () => {
    render(<SignupPromptModal isOpen onClose={mockOnClose} />)

    expect(screen.getByRole('dialog', { name: 'Save the thread before it disappears' })).toBeInTheDocument()
    expect(screen.getByText(/10 free messages/)).toBeInTheDocument()
    expect(screen.getByText('Your conversation will be saved')).toBeInTheDocument()
  })

  it('routes signup to the guest conversion path', () => {
    render(<SignupPromptModal isOpen onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign up to continue' }))

    expect(mockPush).toHaveBeenCalledWith('/signup?from=guest')
  })

  it('shows the generated conversation summary without closing', () => {
    render(<SignupPromptModal isOpen onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('button', { name: /View conversation summary/ }))

    expect(screen.getByRole('dialog', { name: 'Your conversation summary' })).toBeInTheDocument()
    expect(screen.getByText('Mock guest summary')).toBeInTheDocument()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    render(<SignupPromptModal isOpen onClose={mockOnClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
