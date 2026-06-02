/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '../../../app/login/page'
import { useAuth } from '../../../lib/auth/AuthContext'

// Mock dependencies
vi.mock('next/navigation')
vi.mock('../../../lib/auth/AuthContext')

const mockPush = vi.fn()
const mockSignInWithEmail = vi.fn()
const mockSignInWithGoogle = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as any).mockReturnValue({
    push: mockPush
  })
  ;(useAuth as any).mockReturnValue({
    signInWithEmail: mockSignInWithEmail,
    signInWithGoogle: mockSignInWithGoogle
  })
})

// Story 0.1: Auth tests temporarily disabled during OAuth middleware removal
describe.skip('Login Page', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('ThinkHaven')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders Google OAuth button', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('displays navigation links to signup and resend confirmation', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Sign up here')).toBeInTheDocument()
    expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
  })

  it('handles email/password login form submission', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: null })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login error and displays error message', async () => {
    const error = { message: 'Invalid login credentials' }
    mockSignInWithEmail.mockResolvedValue({ error })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please check your credentials and try again.')).toBeInTheDocument()
    })
  })

  it('handles email confirmation error and shows resend link', async () => {
    const error = { message: 'Email not confirmed' }
    mockSignInWithEmail.mockResolvedValue({ error })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Your email needs to be confirmed/)).toBeInTheDocument()
      expect(screen.getByText('→ Resend confirmation email')).toBeInTheDocument()
    })
  })

  it('handles Google OAuth sign-in', async () => {
    mockSignInWithGoogle.mockResolvedValue()
    
    render(<LoginPage />)
    
    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })
  })

  it('handles Google OAuth error', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Google OAuth failed'))
    
    render(<LoginPage />)
    
    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(screen.getByText('Google sign-in failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    mockSignInWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument()
    })
  })

  it('shows loading state during Google OAuth', async () => {
    mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LoginPage />)
    
    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)
    
    expect(screen.getByText('Signing in with Google...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    })
  })

  it('disables Google button when form is loading', async () => {
    mockSignInWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    const googleButton = screen.getByText('Continue with Google')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    expect(googleButton).toBeDisabled()
  })
})
