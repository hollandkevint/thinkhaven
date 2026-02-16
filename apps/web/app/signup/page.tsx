'use client'

import { useState } from 'react'
import { useAuth } from '../../lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'

// Password strength calculation
const calculatePasswordStrength = (password: string): { level: 'weak' | 'medium' | 'strong', score: number } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { level: 'weak', score: strength };
  if (strength <= 4) return { level: 'medium', score: strength };
  return { level: 'strong', score: strength };
};

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<{ level: 'weak' | 'medium' | 'strong', score: number } | null>(null)

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value.length > 0) {
      setPasswordStrength(calculatePasswordStrength(value))
    } else {
      setPasswordStrength(null)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please log in instead.')
        } else {
          setError(error.message)
        }
      } else {
        setMessage('Check your email for a confirmation link!')
      }
    } catch (_err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google sign-up error:', err)
      setError('Google sign-up failed. Please try again.')
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

      {/* Centered Signup Form */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] space-y-8">

          {/* Google OAuth Button - Primary */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
              {googleLoading ? 'Signing up...' : 'Continue with Google'}
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
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Work Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1"
                style={{ color: 'var(--foreground)' }}
              >
                Work email
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
                placeholder="your@company.com"
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
                onChange={(e) => handlePasswordChange(e.target.value)}
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

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor:
                            passwordStrength.level === 'weak'
                              ? 'var(--error, #8B4D3B)'
                              : passwordStrength.level === 'medium'
                              ? 'var(--warning, #D4A84B)'
                              : 'var(--success, #4A6741)',
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium capitalize"
                      style={{
                        color:
                          passwordStrength.level === 'weak'
                            ? 'var(--error, #8B4D3B)'
                            : passwordStrength.level === 'medium'
                            ? 'var(--warning, #D4A84B)'
                            : 'var(--success, #4A6741)',
                      }}
                    >
                      {passwordStrength.level}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Success Message */}
            {message && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(74, 103, 65, 0.05)',
                  border: '1px solid var(--success, #4A6741)',
                  color: 'var(--success, #4A6741)'
                }}
              >
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(139, 77, 59, 0.05)',
                  border: '1px solid var(--error, #8B4D3B)',
                  color: 'var(--error, #8B4D3B)'
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full h-11 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white'
              }}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          {/* Terms and Privacy */}
          <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:opacity-75">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:opacity-75">
              Privacy Policy
            </a>
          </div>

          {/* Account Toggle Link */}
          <div className="text-center text-sm">
            <span style={{ color: 'var(--muted)' }}>Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
