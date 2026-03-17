/**
 * Guest Session Migration
 *
 * Handles migrating guest session data to authenticated user workspace
 */

import { supabase } from '@/lib/supabase/client'
import { GuestSessionStore, GuestMessage } from './session-store'

export interface MigrationResult {
  success: boolean
  workspaceId?: string
  migratedMessages?: number
  error?: string
}

export class SessionMigration {
  /**
   * Migrate guest session to user workspace
   */
  static async migrateToUserWorkspace(userId: string): Promise<MigrationResult> {
    try {
      const guestData = GuestSessionStore.getSessionForMigration()

      if (!guestData || guestData.messages.length === 0) {
        // No guest data to migrate
        return {
          success: true,
          migratedMessages: 0
        }
      }

      // Create a bmad_sessions row with the guest messages as ChatMessage[]
      const chatMessages = guestData.messages.map(msg => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))

      const { data: newSession, error: createError } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: userId,
          workspace_id: userId,
          pathway: 'quick-decision',
          title: 'Guest Session',
          current_phase: 'discovery',
          current_template: 'general',
          current_step: 'chat',
          templates: [],
          next_steps: [],
          status: 'active',
          overall_completion: 0,
          message_count: chatMessages.length,
          message_limit: 10,
          chat_context: chatMessages,
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Failed to migrate session:', createError)
        return {
          success: false,
          error: 'Failed to save migrated session'
        }
      }

      // Clear guest session after successful migration
      GuestSessionStore.clearSession()

      return {
        success: true,
        workspaceId: userId,
        migratedMessages: guestData.messages.length
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
      messageCount: session.messageCount,
      totalMessages: session.messages.length,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt
    }
  }
}
