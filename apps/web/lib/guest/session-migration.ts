/**
 * Guest Session Migration
 *
 * Handles migrating guest session data to authenticated user workspace
 */

import { GuestSessionStore } from './session-store'

export interface MigrationResult {
  success: boolean
  sessionId?: string
  workspaceId?: string
  migratedMessages?: number
  error?: string
}

export class SessionMigration {
  /**
   * Migrate guest session to user workspace
   */
  static async migrateToUserWorkspace(_userId: string): Promise<MigrationResult> {
    try {
      // The server derives the actor from Better Auth; this parameter remains for caller compatibility.
      void _userId
      const guestData = GuestSessionStore.getSessionForMigration()

      if (!guestData || guestData.messages.length === 0) {
        // No guest data to migrate
        return {
          success: true,
          migratedMessages: 0
        }
      }

      const response = await fetch('/api/guest/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session: guestData }),
      })

      const result = await response.json().catch(() => null) as MigrationResult | null
      if (!response.ok || !result?.success) {
        return {
          success: false,
          error: result?.error || 'Failed to save migrated session',
        }
      }

      // Clear guest session after successful migration
      GuestSessionStore.clearSession()

      return {
        ...result,
      }
    } catch (error) {
      console.error('Migration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown migration error'
      }
    }
  }

  /**
   * Generate summary of guest session for display
   */
  static generateSessionSummary(): string {
    const guestData = GuestSessionStore.getSessionForMigration()

    if (!guestData || guestData.messages.length === 0) {
      return 'No conversation to summarize'
    }

    const userMessages = guestData.messages.filter(m => m.role === 'user')
    const topics = userMessages.map(m => {
      // Extract first sentence or first 60 characters
      const firstSentence = m.content.split(/[.!?]/)[0]
      return firstSentence.length > 60
        ? firstSentence.substring(0, 60) + '...'
        : firstSentence
    })

    return `You discussed ${userMessages.length} topic${userMessages.length !== 1 ? 's' : ''} with Mary:\n\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
  }

  /**
   * Check if guest session exists
   */
  static hasGuestSession(): boolean {
    const session = GuestSessionStore.getSession()
    return session !== null && session.messages.length > 0
  }

  /**
   * Get guest session metadata
   */
  static getGuestSessionMetadata() {
    const session = GuestSessionStore.getSession()

    if (!session) {
      return null
    }

    return {
      sessionId: session.id,
      pathway: session.pathway,
      messageCount: session.messageCount,
      totalMessages: session.messages.length,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt
    }
  }
}
