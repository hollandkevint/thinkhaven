/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../app/components/ui/navigation'
import { useAuth } from '../../../lib/auth/AuthContext'

// Mock dependencies
vi.mock('next/navigation')
vi.mock('../../../lib/auth/AuthContext')

const mockPush = vi.fn()
const mockSignOut = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as any).mockReturnValue({
    push: mockPush
  })
})

describe('Navigation Component', () => {
  it('renders loading state correctly', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: true,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    expect(screen.getByText('Thinkhaven')).toBeInTheDocument()
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
  })

  it('renders unauthenticated state with login and signup buttons', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    expect(screen.getByText('Thinkhaven')).toBeInTheDocument()
    expect(screen.getByText('Try Free')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('renders authenticated state with user dropdown', () => {
    ;(useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    expect(screen.getByText('Thinkhaven')).toBeInTheDocument()
    expect(screen.getByText('Try Free')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument() // Username from email
  })

  it('navigates to try page when try free button is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)

    fireEvent.click(screen.getByText('Try Free'))
    expect(mockPush).toHaveBeenCalledWith('/try')
  })

  it('navigates to login when login button is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getByText('Login'))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('navigates to signup when signup button is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getByText('Sign Up'))
    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('navigates to home when logo is clicked', () => {
    ;(useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut
    })

    render(<Navigation />)
    
    fireEvent.click(screen.getByText('Thinkhaven'))
    expect(mockPush).toHaveBeenCalledWith('/')
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
      name: /menu/i 
    })
    fireEvent.click(menuButton)

    // Wait for mobile menu items to appear
    await waitFor(() => {
      expect(screen.getAllByText('Demo')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Login')).toHaveLength(2) // Desktop + mobile
      expect(screen.getAllByText('Sign Up')).toHaveLength(2) // Desktop + mobile
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
    const userButton = screen.getByText('test')
    fireEvent.click(userButton)

    // Wait for dropdown items to appear
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
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
    const userButton = screen.getByText('test')
    fireEvent.click(userButton)

    // Wait for dropdown to appear and click sign out
    await waitFor(() => {
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})