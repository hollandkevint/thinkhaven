import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LoginPage from '../../../app/login/page'
import SignUpPage from '../../../app/signup/page'
import ResendConfirmationPage from '../../../app/resend-confirmation/page'
import ResetPasswordPage from '../../../app/reset-password/page'
import AccountPage from '../../../app/app/account/page'

const mocks = vi.hoisted(() => ({
  authClient: {
    requestPasswordReset: vi.fn(),
    signUp: { email: vi.fn() },
    sendVerificationEmail: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
  useAuth: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('../../../lib/auth/railway-auth-client', () => ({
  railwayAuthClient: mocks.authClient,
}))

vi.mock('../../../lib/auth/AuthContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('next/navigation', () => ({
  useRouter: mocks.useRouter,
  useSearchParams: mocks.useSearchParams,
}))

describe('Better Auth browser flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useRouter.mockReturnValue({ push: vi.fn() })
    mocks.useSearchParams.mockReturnValue(new URLSearchParams())
    mocks.useAuth.mockReturnValue({
      user: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
    })
    mocks.authClient.requestPasswordReset.mockResolvedValue({ data: { status: true }, error: null })
    mocks.authClient.signUp.email.mockResolvedValue({ data: {}, error: null })
    mocks.authClient.sendVerificationEmail.mockResolvedValue({ data: { status: true }, error: null })
    mocks.authClient.resetPassword.mockResolvedValue({ data: { status: true }, error: null })
    mocks.authClient.changePassword.mockResolvedValue({ data: { success: true }, error: null })
  })

  it('requests a reset through Better Auth and shows generic success', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))

    await waitFor(() => {
      expect(mocks.authClient.requestPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
        redirectTo: 'http://localhost:3000/reset-password',
      })
    })
    expect(screen.getByText('Check your email for a password reset link.')).toBeInTheDocument()
  })

  it('signs up with an email-derived display name and invite-safe callback', async () => {
    mocks.useSearchParams.mockReturnValue(new URLSearchParams('beta_invite=invite-1&source=beta_invite&from=guest'))
    render(<SignUpPage />)
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'jane.doe@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse-battery' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => {
      expect(mocks.authClient.signUp.email).toHaveBeenCalledWith({
        name: 'jane.doe',
        email: 'jane.doe@example.com',
        password: 'correct-horse-battery',
        callbackURL: '/try?beta_invite=invite-1&source=beta_invite&from=guest',
      })
    })
  })

  it('resends verification with generic success even when the request fails', async () => {
    mocks.authClient.sendVerificationEmail.mockRejectedValueOnce(new Error('account not found'))
    render(<ResendConfirmationPage />)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resend Confirmation Email' }))

    await waitFor(() => {
      expect(screen.getByText('If an account exists, a confirmation email will arrive shortly.')).toBeInTheDocument()
    })
    expect(mocks.authClient.sendVerificationEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      callbackURL: 'http://localhost:3000/app',
    })
  })

  it('resets a password with the token from the verification link', async () => {
    mocks.useSearchParams.mockReturnValue(new URLSearchParams('token=reset-token'))
    render(<ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-password-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => {
      expect(mocks.authClient.resetPassword).toHaveBeenCalledWith({
        newPassword: 'new-password-123',
        token: 'reset-token',
      })
    })
    expect(screen.getByText('Password reset successfully. You can now sign in.')).toBeInTheDocument()
  })

  it('changes a credential password with the current password', async () => {
    mocks.useAuth.mockReturnValue({
      user: { email: 'user@example.com', created_at: '2026-01-01', app_metadata: { provider: 'email' } },
    })
    render(<AccountPage />)
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'old-password' } })
    fireEvent.change(screen.getByLabelText('New Password (min 8 characters)'), { target: { value: 'new-password-123' } })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'new-password-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(mocks.authClient.changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
      })
    })
  })

  it('shows reset guidance without depending on provider-specific user fields', () => {
    mocks.useAuth.mockReturnValue({
      user: { email: 'user@gmail.com', created_at: '2026-01-01' },
    })
    render(<AccountPage />)

    expect(screen.getByText(/If this account uses Google sign-in without a ThinkHaven password/)).toBeInTheDocument()
    expect(mocks.authClient.changePassword).not.toHaveBeenCalled()
  })
})
