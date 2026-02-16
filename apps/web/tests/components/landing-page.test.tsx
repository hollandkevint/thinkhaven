import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))

// Mock Supabase client (used by WaitlistForm)
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    })
  }
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}))

import { render, screen, fireEvent } from '@testing-library/react'
import Home from '../../app/page'

describe('Landing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Content', () => {
    it('should render the headline', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should render the beta badge', () => {
      render(<Home />)
      expect(screen.getByText(/Join the Beta/)).toBeInTheDocument()
    })

    it('should render value proposition cards', () => {
      render(<Home />)
      expect(screen.getByText('10 Critical Questions')).toBeInTheDocument()
      expect(screen.getByText('Validation Scorecard')).toBeInTheDocument()
      expect(screen.getByText('Professional Report')).toBeInTheDocument()
    })

    it('should render testimonials', () => {
      render(<Home />)
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
      expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to /assessment when "Try Free Assessment First" is clicked', () => {
      render(<Home />)
      const assessmentButton = screen.getByText('Try Free Assessment First')

      fireEvent.click(assessmentButton)

      expect(mockPush).toHaveBeenCalledWith('/assessment')
    })

    it('should have footer link to /try', () => {
      render(<Home />)
      const tryLink = screen.getByText('Try Free')
      expect(tryLink).toHaveAttribute('href', '/try')
    })

    it('should have footer link to /assessment', () => {
      render(<Home />)
      const assessmentLink = screen.getByText('Free Assessment')
      expect(assessmentLink).toHaveAttribute('href', '/assessment')
    })
  })

  describe('Waitlist Form', () => {
    it('should render the waitlist email input', () => {
      render(<Home />)
      const emailInputs = screen.getAllByPlaceholderText('your@email.com')
      expect(emailInputs.length).toBeGreaterThan(0)
    })

    it('should render the join waitlist button', () => {
      render(<Home />)
      const joinButtons = screen.getAllByText('Join Waitlist')
      expect(joinButtons.length).toBeGreaterThan(0)
    })
  })
})
