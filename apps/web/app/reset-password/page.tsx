'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { railwayAuthClient } from '@/lib/auth/railway-auth-client'
import { buildLoginPath, readBetaInviteContext } from '@/lib/beta/invite-destinations'

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const inviteContext = readBetaInviteContext(searchParams)
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('This password reset link is invalid or expired. Request a new one from the sign-in page.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { error: resetError } = await railwayAuthClient.resetPassword({
        newPassword,
        token,
      })

      if (resetError) {
        setError(resetError.message || 'Unable to reset your password. Request a new link and try again.')
      } else {
        setMessage('Password reset successfully. You can now sign in.')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('Unable to reset your password. Request a new link and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold font-display text-foreground">
            ThinkHaven
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-primary">Set a new password</h1>
          <p className="mt-2 text-muted-foreground">Choose a new password for your account.</p>
        </div>

        <form className="space-y-6" onSubmit={handleReset}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
              New password
            </label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {error && <div className="error-boundary">{error}</div>}
          {message && (
            <div className="bg-success/10 border border-success text-success rounded-lg p-4">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-cream bg-terracotta hover:bg-terracotta-hover disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="text-center text-muted-foreground">
          <Link href={buildLoginPath(inviteContext)} className="font-medium text-primary hover:text-primary-hover">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-muted-foreground">Loading password reset...</p>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
