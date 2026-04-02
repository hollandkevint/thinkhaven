/**
 * Guest Session Migration
 *
 * Handles migrating guest session data to authenticated user workspace
 */

import { supabase } from '@/lib/supabase/client'
import { GuestSessionStore, GuestMessage } from './session-store'

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

      // Validate and sanitize guest messages before migration
      const ALLOWED_ROLES = new Set(['user', 'assistant'])
      const MAX_CONTENT_LENGTH = 4000
      const MAX_MESSAGES = 10

      const validMessages = guestData.messages
        .filter(msg => ALLOWED_ROLES.has(msg.role))
        .slice(0, MAX_MESSAGES)

      const chatMessages = validMessages.map(msg => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content.slice(0, MAX_CONTENT_LENGTH) : '',
        timestamp: msg.timestamp || new Date().toISOString(),
      }))

      // Derive title from first user message (first 6 words)
      const firstUserMsg = chatMessages.find(m => m.role === 'user')
      const autoTitle = firstUserMsg
        ? firstUserMsg.content.split(/\s+/).slice(0, 6).join(' ')
        : 'Guest Session'

      const { data: newSession, error: createError } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: userId,
          workspace_id: userId,
          pathway: 'quick-decision',
          title: autoTitle,
          current_phase: 'discovery',
          current_template: 'general',
          current_step: 'chat',
          templates: [],
          next_steps: [],
          status: 'active',
          overall_completion: 0,
          message_count: chatMessages.filter(m => m.role === 'user').length,
          message_limit: 10,
          chat_context: chatMessages,
        })
        .select('id')
        .single()

      if (createError || !newSession) {
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
        sessionId: newSession.id,
        workspaceId: userId,
        migratedMessages: chatMessages.length
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
