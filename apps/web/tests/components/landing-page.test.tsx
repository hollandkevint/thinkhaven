import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

// Mock next/link to render as a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string, children: ReactNode }) => (
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
  Button: ({ children, asChild, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean, children: ReactNode }) => {
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
      expect(screen.getAllByText('Mary').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Victoria').length).toBeGreaterThan(0)
      expect(screen.getByText('Omar')).toBeInTheDocument()
    })

    it('should render Kevin Holland credibility section', () => {
      render(<Home />)
      expect(screen.getByText('Kevin Holland')).toBeInTheDocument()
    })

    it('should render the board of directors section heading', () => {
      render(<Home />)
      expect(screen.getByText('Six advisors, one decision under pressure.')).toBeInTheDocument()
    })

    it('should render the outcomes section heading', () => {
      render(<Home />)
      expect(screen.getByText('Artifact. Decision. Confidence.')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should link to /try from hero CTA', () => {
      render(<Home />)
      const tryLink = screen.getAllByText('Try a Free Session')[0]
      expect(tryLink.closest('a')).toHaveAttribute('href', '/try')
    })

    it('should link to /assessment from hero', () => {
      render(<Home />)
      const assessmentLink = screen.getByText('Strategy Assessment')
      expect(assessmentLink.closest('a')).toHaveAttribute('href', '/assessment')
    })

    it('should link to /try from final CTA', () => {
      render(<Home />)
      const startLink = screen.getAllByText('Try a Free Session')[1]
      expect(startLink.closest('a')).toHaveAttribute('href', '/try')
    })

    it('should have footer link to /try', () => {
      render(<Home />)
      const tryLinks = screen.getAllByText('Try a Free Session')
      const tryLink = tryLinks[tryLinks.length - 1]
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

    it('does not show the removed global onboarding modal copy', () => {
      render(<Home />)
      expect(screen.queryByText('ThinkHaven is a decision design system')).not.toBeInTheDocument()
      expect(screen.getByText(/10 free messages/)).toBeInTheDocument()
    })
  })
})
