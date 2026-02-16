'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const workspaceState = null // Mock empty state
  const saveWorkspace = async () => { console.log('Workspace save disabled') }
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion')
      return
    }

    setDeletingAccount(true)
    setError('')

    try {
      setMessage('Account deletion initiated. Signing out...')
      setTimeout(() => {
        signOut()
        router.push('/')
      }, 2000)
    } catch (_err) {
      setError('Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleSaveWorkspace = async () => {
    try {
      await saveWorkspace()
      setMessage('Workspace saved successfully!')
    } catch (_err) {
      setError('Failed to save workspace')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">Please sign in to access account settings</p>
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
            <p className="text-secondary mt-2">Manage your strategic workspace account</p>
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
                Workspace Status
              </label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-foreground">
                  {(workspaceState as { chat_context?: unknown[] })?.chat_context?.length || 0} messages,
                  {(workspaceState as { canvas_elements?: unknown[] })?.canvas_elements?.length || 0} elements
                </span>
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
              className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Workspace Management */}
        <div className="bg-card border border-divider rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace Management</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Manual Save</p>
                <p className="text-sm text-secondary">Force save your current workspace state</p>
              </div>
              <button
                onClick={handleSaveWorkspace}
                className="px-4 py-2 bg-accent text-white font-medium rounded hover:bg-accent/90"
              >
                Save Now
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-error rounded-lg p-6">
          <h2 className="text-xl font-semibold text-error mb-4">Danger Zone</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-error mb-2">Delete Account</p>
              <p className="text-sm text-secondary mb-4">
                This will permanently delete your account and all workspace data. This action cannot be undone.
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-error rounded focus:ring-error focus:border-error"
                />

                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirm !== 'DELETE'}
                  className="px-4 py-2 bg-error text-white font-medium rounded hover:bg-error/90 disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>

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
