'use client'

import { useEffect, useState } from 'react'
import GuestChatInterface from '../components/guest/GuestChatInterface'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'

export default function TryPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    // If user is already authenticated, check for guest session migration
    if (user && !loading) {
      const migrateSession = async () => {
        // Check if there's a guest session to migrate
        if (SessionMigration.hasGuestSession()) {
          setMigrating(true)

          try {
            const result = await SessionMigration.migrateToUserWorkspace(user.id)

            if (result.success && result.migratedMessages && result.migratedMessages > 0) {
              // Show success message and redirect to dashboard
              console.log(`Migrated ${result.migratedMessages} messages to user workspace`)
              // Could show a toast notification here
            }
          } catch (error) {
            console.error('Migration failed:', error)
          } finally {
            setMigrating(false)
          }
        }

        // Redirect authenticated users to app
        router.push('/app')
      }

      migrateSession()
    }
  }, [user, loading, router])

  // Show loading state while checking auth or migrating
  if (loading || migrating) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--cream)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--terracotta)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--slate-blue)' }}>
            {migrating ? 'Saving your conversation...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Only show guest interface to non-authenticated users
  if (user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--divider)', backgroundColor: 'white' }}>
        <a href="/" className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>
          ThinkHaven
        </a>
        <nav className="flex items-center gap-4">
          <FeedbackButton variant="nav" />
          <a href="/assessment" className="text-sm font-medium" style={{ color: 'var(--slate-blue)' }}>
            Take Assessment
          </a>
          <a href="/login" className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Sign in
          </a>
          <a
            href="/signup"
            className="px-4 py-2 text-sm font-medium rounded-lg"
            style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
          >
            Sign up
          </a>
        </nav>
      </header>

      {/* Info banner */}
      <div className="flex-shrink-0 px-6 py-3" style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm">
            <strong>Try before you sign up!</strong> Get 10 free messages to experience ThinkHaven's AI-powered strategic thinking.
          </p>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 max-w-5xl mx-auto w-full overflow-hidden">
        <GuestChatInterface />
      </div>
    </div>
  )
}
