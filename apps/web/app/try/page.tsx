'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import GuestChatInterface from '../components/guest/GuestChatInterface'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'
import {
  buildLoginPath,
  buildSignupPath,
  readBetaInviteContext,
  storeBetaInviteContext,
} from '@/lib/beta/invite-destinations'

function TryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const inviteContext = readBetaInviteContext(searchParams)

  useEffect(() => {
    storeBetaInviteContext(inviteContext)
  }, [inviteContext])

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
              sessionStorage.setItem('migration_success', String(result.migratedMessages))
              console.log(`[Try] Successfully migrated ${result.migratedMessages} guest messages`)
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
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-blue">
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
    <div className="h-screen flex flex-col bg-cream">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-cream">
        <Link href="/" className="text-2xl font-bold font-display text-ink">
          ThinkHaven
        </Link>
        <nav className="flex items-center gap-4">
          <FeedbackButton variant="nav" />
          <Link href="/assessment" className="text-sm font-medium text-slate-blue">
            Take Assessment
          </Link>
          <Link href={buildLoginPath(inviteContext)} className="text-sm font-medium text-ink">
            Sign in
          </Link>
          <Link
            href={buildSignupPath(inviteContext)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-terracotta text-cream"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Info banner */}
      <div className="flex-shrink-0 px-6 py-3 bg-terracotta text-cream">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm">
            <strong>Try before you sign up!</strong> Get 10 free messages to experience ThinkHaven&apos;s AI-powered strategic thinking.
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

export default function TryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-blue">Loading...</p>
        </div>
      </div>
    }>
      <TryPageContent />
    </Suspense>
  )
}
