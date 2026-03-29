'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (_err) {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access account settings</p>
          <Link href="/login" className="text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">Account Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your strategic workspace account</p>
          </div>
          <Link
            href="/app"
            className="px-4 py-2 border border-divider rounded hover:bg-primary/5 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Account Information */}
        <div className="bg-card border border-divider rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email Address
              </label>
              <p className="text-foreground">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Account Created
              </label>
              <p className="text-foreground">
                {new Date(user.created_at || '').toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-foreground">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-card border border-divider rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-divider rounded focus:ring-primary focus:border-primary"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-divider rounded focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-terracotta text-cream font-medium rounded hover:bg-terracotta-hover disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Deletion - Coming Soon */}
        {/* Real account deletion requires Supabase Edge Function for cascade delete.
            Removed fake deletion UI that only signed out without deleting data. */}

        {/* Messages */}
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
      </div>
    </div>
  )
}
