'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app`
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Confirmation email sent! Please check your inbox.')
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Resend Confirmation Email</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email address to receive a new confirmation link
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResend}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 block w-full px-3 py-2 border border-divider rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          {error && (
            <div className="error-boundary">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-success/10 border border-success text-success rounded-lg p-4">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-cream bg-terracotta hover:bg-terracotta-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
                Back to Sign In
              </Link>
            </p>
            <p className="text-muted-foreground">
              Need a new account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}