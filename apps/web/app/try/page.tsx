'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import GuestChatInterface from '../components/guest/GuestChatInterface'
import { SessionMigration, type MigrationResult } from '@/lib/guest/session-migration'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'
import {
  BETA_INVITE_PARAM,
  BETA_INVITE_SOURCE,
  buildLoginPath,
  buildSignupPath,
  readBetaInviteContext,
  storeBetaInviteContext,
} from '@/lib/beta/invite-destinations'

interface BetaAccessStatusResponse {
  betaApproved: boolean
  redirectTo: string
}

async function recordBetaEvent(payload: Record<string, unknown>) {
  try {
    await fetch('/api/beta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Beta event telemetry should never block the guest conversion path.
  }
}

async function readBetaAccessStatus(): Promise<BetaAccessStatusResponse | null> {
  try {
    const response = await fetch('/api/beta/access-status', { cache: 'no-store' })
    if (!response.ok) return null
    return (await response.json()) as BetaAccessStatusResponse
  } catch {
    return null
  }
}

function buildWaitlistRedirect({
  inviteId,
  source,
  migratedMessages,
}: {
  inviteId: string | null
  source: string | null
  migratedMessages: number
}) {
  const params = new URLSearchParams()

  if (inviteId) {
    params.set(BETA_INVITE_PARAM, inviteId)
    params.set('source', source || BETA_INVITE_SOURCE)
  }

  if (migratedMessages > 0) {
    params.set('migrated', String(migratedMessages))
  }

  const query = params.toString()
  return query ? `/waitlist?${query}` : '/waitlist'
}

function TryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const inviteContext = readBetaInviteContext(searchParams)
  const inviteId = inviteContext?.inviteId || null
  const inviteSource = inviteContext?.source || null
  const inviteFromGuest = inviteContext?.fromGuest === true
  const trialMode = searchParams.get('mode') === 'plan-grill' ? 'plan-grill' : 'new-idea'
  const isPlanGrill = trialMode === 'plan-grill'
  const signupPath = inviteContext ? buildSignupPath(inviteContext) : '/signup?from=guest'
  const inviteArrivalLoggedRef = useRef<string | null>(null)

  useEffect(() => {
    const context = inviteId
      ? {
          inviteId,
          source: inviteSource || BETA_INVITE_SOURCE,
          fromGuest: inviteFromGuest,
        }
      : null

    storeBetaInviteContext(context)

    if (inviteId && inviteArrivalLoggedRef.current !== inviteId) {
      inviteArrivalLoggedRef.current = inviteId
      recordBetaEvent({
        eventType: 'invite_arrived',
        betaInviteId: inviteId,
        source: inviteSource || BETA_INVITE_SOURCE,
      })
    }
  }, [inviteFromGuest, inviteId, inviteSource])

  useEffect(() => {
    // If user is already authenticated, check for guest session migration
    if (user && !loading) {
      const migrateSession = async () => {
        const hadGuestSession = SessionMigration.hasGuestSession()
        let migrationResult: MigrationResult = {
          success: true,
          migratedMessages: 0,
        }

        // Check if there's a guest session to migrate
        if (hadGuestSession) {
          setMigrating(true)

          try {
            const result = await SessionMigration.migrateToUserWorkspace(user.id)
            migrationResult = result

            if (result.success && result.migratedMessages && result.migratedMessages > 0) {
              sessionStorage.setItem('migration_success', String(result.migratedMessages))
              console.log(`[Try] Successfully migrated ${result.migratedMessages} guest messages`)
            }
          } catch (error) {
            console.error('Migration failed:', error)
            migrationResult = {
              success: false,
              migratedMessages: 0,
              error: error instanceof Error ? error.message : 'Migration failed',
            }
          } finally {
            setMigrating(false)
          }
        }

        if (hadGuestSession) {
          await recordBetaEvent({
            eventType: 'guest_migration_attempted',
            betaInviteId: inviteId,
            source: inviteSource || (inviteId ? BETA_INVITE_SOURCE : 'try'),
            success: migrationResult.success,
            migratedMessages: migrationResult.migratedMessages || 0,
            sessionCreated: Boolean(migrationResult.sessionId),
          })
        }

        const access = await readBetaAccessStatus()

        if (access?.betaApproved) {
          if (migrationResult.success && migrationResult.sessionId) {
            router.push(`/app/session/${migrationResult.sessionId}`)
          } else {
            router.push(access.redirectTo || '/app')
          }
          return
        }

        if (access) {
          router.push(buildWaitlistRedirect({
            inviteId,
            source: inviteSource,
            migratedMessages: migrationResult.migratedMessages || 0,
          }))
          return
        }

        // Fall back to the protected app gate if the status endpoint is unavailable.
        router.push('/app')
      }

      migrateSession()
    }
  }, [inviteId, inviteSource, loading, router, user])

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
            href={signupPath}
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
            <strong>Try before you sign up.</strong>{' '}
            {isPlanGrill
              ? 'Get 10 free messages to grill a pasted plan with Mary.'
              : 'Get 10 free messages to pressure-test a real decision with ThinkHaven\'s board.'}
          </p>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex-1 max-w-5xl mx-auto w-full overflow-hidden">
        <GuestChatInterface pathway={trialMode} />
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
