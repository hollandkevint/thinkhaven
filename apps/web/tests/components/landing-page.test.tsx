import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

// Mock next/link to render as a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
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
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      // When asChild, render children directly (Radix Slot behavior)
      return <>{children}</>
    }
    return <button {...props}>{children}</button>
  }
}))

import { render, screen } from '@testing-library/react'
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

    it('should render board member names', () => {
      render(<Home />)
      expect(screen.getByText('Mary')).toBeInTheDocument()
      expect(screen.getByText('Victoria')).toBeInTheDocument()
      expect(screen.getByText('Omar')).toBeInTheDocument()
    })

    it('should render Kevin Holland credibility section', () => {
      render(<Home />)
      expect(screen.getByText('Kevin Holland')).toBeInTheDocument()
    })

    it('should render the board of directors section heading', () => {
      render(<Home />)
      expect(screen.getByText('Your Personal Board of Directors')).toBeInTheDocument()
    })

    it('should render the outcomes section heading', () => {
      render(<Home />)
      expect(screen.getByText('What Actually Changes')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should link to /try from hero CTA', () => {
      render(<Home />)
      const tryLink = screen.getByText('Try a Free Session')
      expect(tryLink.closest('a')).toHaveAttribute('href', '/try')
    })

    it('should link to /assessment from hero', () => {
      render(<Home />)
      const assessmentLink = screen.getByText('Take the 5-Minute Assessment')
      expect(assessmentLink.closest('a')).toHaveAttribute('href', '/assessment')
    })

    it('should link to /try from final CTA', () => {
      render(<Home />)
      const startLink = screen.getByText('Start a Free Session')
      expect(startLink.closest('a')).toHaveAttribute('href', '/try')
    })

    it('should have footer link to /try', () => {
      render(<Home />)
      const tryLink = screen.getByText('Free Session')
      expect(tryLink).toHaveAttribute('href', '/try')
    })

    it('should have footer link to /assessment', () => {
      render(<Home />)
      const assessmentLink = screen.getByText('Strategy Assessment')
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
