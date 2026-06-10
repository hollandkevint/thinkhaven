/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname, useRouter } from 'next/navigation'
import Navigation from '../../../app/components/ui/navigation'
import { useAuth } from '../../../lib/auth/AuthContext'

// Mock dependencies
vi.mock('next/navigation')
vi.mock('../../../lib/auth/AuthContext')
vi.mock('../../../app/components/monetization/CreditGuard', () => ({
  CreditGuard: () => null,
}))
vi.mock('../../../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild }: any) =>
    asChild ? <>{children}</> : (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
  DropdownMenuSeparator: () => <hr />,
}))

const mockPush = vi.fn()
const mockSignOut = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as any).mockReturnValue({
    push: mockPush
  })
  ;(usePathname as any).mockReturnValue('/')
})

describe('Navigation Component', () => {
  it('renders loading state correctly', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      signOut: mockSignOut
    })

    const { container } = render(<Navigation />)
    
    expect(screen.getByText('ThinkHaven')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders unauthenticated state with login and signup buttons', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    expect(screen.getByText('ThinkHaven')).toBeInTheDocument()
    expect(screen.getAllByText('Try a Free Session').length).toBeGreaterThan(0)
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0)
  })

  it('renders authenticated state with user dropdown', () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)

    expect(screen.getByText('ThinkHaven')).toBeInTheDocument()
    // Authenticated nav drops the try-free CTA in favor of the user dropdown.
    expect(screen.getByText('test')).toBeInTheDocument() // Username from email
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('links the desktop try-free CTA and pushes from the mobile menu item', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)

    const tryElements = screen.getAllByText('Try a Free Session')
    // Desktop CTA is a real link.
    const desktopLink = tryElements.map(el => el.closest('a')).find(Boolean)
    expect(desktopLink).toHaveAttribute('href', '/try')
    // Mobile menu item navigates programmatically.
    const mobileItem = tryElements.find(el => el.closest('button'))
    expect(mobileItem).toBeDefined()
    fireEvent.click(mobileItem!)
    expect(mockPush).toHaveBeenCalledWith('/try')
  })

  it('navigates to login when login button is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getAllByText('Login')[0])
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('navigates to signup when signup button is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getAllByText('Sign Up')[0])
    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('navigates to home when logo is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    expect(screen.getByText('ThinkHaven').closest('a')).toHaveAttribute('href', '/')
  })

  it('opens mobile menu and shows navigation options', async () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    // Find and click mobile menu trigger (Menu icon)
    const menuButton = screen.getByRole('button', { 
      name: /open menu/i
    })
    fireEvent.click(menuButton)

    // Wait for mobile menu items to appear
    await waitFor(() => {
      expect(screen.getAllByText('Try a Free Session').length).toBeGreaterThanOrEqual(2) // Desktop CTA + mobile item
      expect(screen.getAllByText('Login')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Sign Up')).toHaveLength(1) // Mobile menu only — desktop has no signup button
      expect(screen.getAllByText('Pricing').length).toBeGreaterThanOrEqual(2) // Desktop link + mobile item
    })
  })

  it('shows user options in authenticated dropdown', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    // Click on user dropdown trigger
    const userButton = screen.getByRole('button', { name: /test/i })
    fireEvent.pointerDown(userButton)
    fireEvent.click(userButton)

    // Wait for dropdown items to appear
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Sign Out').length).toBeGreaterThan(0)
    })
  })

  it('calls signOut when sign out is clicked', async () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    // Click on user dropdown trigger
    const userButton = screen.getByRole('button', { name: /test/i })
    fireEvent.pointerDown(userButton)
    fireEvent.click(userButton)

    // Wait for dropdown to appear and click sign out
    await waitFor(() => {
      const signOutButton = screen.getAllByText('Sign Out')[0]
      fireEvent.click(signOutButton)
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
