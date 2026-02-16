'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginPageContent() {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle error messages from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signInWithEmail(email, password)

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('signup')) {
          setError('Your email needs to be confirmed. Please check your email and click the confirmation link.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('User not found')) {
          setError('No account found with this email address. Please sign up first.')
        } else {
          setError(`Login failed: ${error.message}`)
        }
      } else {
        router.push('/app')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Minimal Navigation - Logo only */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-2xl font-bold font-display" style={{ color: 'var(--foreground)' }}>
          Thinkhaven
        </Link>
      </div>

      {/* Centered Login Form */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] space-y-8">

          {/* Google OAuth Button - Primary */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-11 flex items-center justify-center gap-3 px-4 border rounded-lg transition-all disabled:opacity-50 hover:border-ink/20"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'white',
              color: 'var(--foreground)'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-semibold">
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-cream" style={{ color: 'var(--muted)' }}>OR</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  '--tw-ring-color': 'var(--primary)'
                } as React.CSSProperties}
                placeholder="your@email.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  '--tw-ring-color': 'var(--primary)'
                } as React.CSSProperties}
                placeholder="••••••••"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                At least 8 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(139, 77, 59, 0.05)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)'
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          {/* Account Toggle Link */}
          <div className="text-center text-sm">
            <span style={{ color: 'var(--muted)' }}>Don't have an account? </span>
            <Link
              href="/signup"
              className="font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="h-8 w-48 bg-ink/10 animate-pulse rounded mb-4 mx-auto"></div>
          <p style={{ color: 'var(--muted)' }}>Loading login...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
