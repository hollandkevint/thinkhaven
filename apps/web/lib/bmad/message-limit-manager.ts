/**
 * Message Limit Manager
 *
 * Handles session message limits for the SLC launch period.
 * Enforces 10-message limit per session before Stripe integration.
 *
 * Message limits are only enforced when LAUNCH_MODE is enabled.
 * After Stripe integration, this can be removed or integrated with credit tiers.
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_MESSAGE_LIMIT = 10;
export const WARNING_THRESHOLD = 5; // Show warning when 5 messages remaining

// ============================================================================
// TYPES
// ============================================================================

export interface MessageLimitStatus {
  currentCount: number;
  messageLimit: number;
  remaining: number;
  limitReached: boolean;
  warningThreshold: boolean;
}

export interface IncrementResult {
  newCount: number;
  limitReached: boolean;
  messageLimit: number;
}

// ============================================================================
// MESSAGE LIMIT OPERATIONS
// ============================================================================

/**
 * Check if per-session message limits are enabled.
 * Defaults to true (MESSAGE_LIMIT_ENABLED !== 'false').
 */
export function isMessageLimitEnabled(): boolean {
  return process.env.MESSAGE_LIMIT_ENABLED !== 'false';
}

/**
 * Check current message limit status for a session
 */
export async function checkMessageLimit(sessionId: string): Promise<MessageLimitStatus | null> {
  if (!isMessageLimitEnabled()) {
    // Message limits disabled - return unlimited status
    return {
      currentCount: 0,
      messageLimit: -1,
      remaining: -1,
      limitReached: false,
      warningThreshold: false,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('check_message_limit', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Error checking message limit:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No data returned from check_message_limit');
      return null;
    }

    const status = data[0];
    return {
      currentCount: status.current_count,
      messageLimit: status.message_limit,
      remaining: status.remaining,
      limitReached: status.limit_reached,
      warningThreshold: status.remaining <= WARNING_THRESHOLD && !status.limit_reached,
    };
  } catch (error) {
    console.error('Unexpected error checking message limit:', error);
    return null;
  }
}

/**
 * Increment message count for a session
 * Should be called for each user message sent
 */
export async function incrementMessageCount(sessionId: string): Promise<IncrementResult | null> {
  if (!isMessageLimitEnabled()) {
    // Message limits disabled - return success without incrementing
    return {
      newCount: 0,
      limitReached: false,
      messageLimit: -1,
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('increment_message_count', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Error incrementing message count:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No data returned from increment_message_count');
      return null;
    }

    const result = data[0];
    console.log('[MESSAGE_LIMIT]', {
      sessionId,
      newCount: result.new_count,
      limit: result.message_limit,
      reached: result.limit_reached,
    });

    return {
      newCount: result.new_count,
      limitReached: result.limit_reached,
      messageLimit: result.message_limit,
    };
  } catch (error) {
    console.error('Unexpected error incrementing message count:', error);
    return null;
  }
}

/**
 * Check if session can accept more messages
 */
export async function canSendMessage(sessionId: string): Promise<boolean> {
  const status = await checkMessageLimit(sessionId);
  if (!status) {
    // If we can't check the limit, allow the message (fail open)
    console.warn('Could not check message limit, allowing message');
    return true;
  }

  return !status.limitReached;
}

/**
 * Get warning message for approaching limit
 */
export function getWarningMessage(remaining: number): string {
  if (remaining <= 0) {
    return 'You\'ve reached the message limit for this session. You can export your work and start a new session.';
  } else if (remaining === 1) {
    return 'You have 1 message remaining in this session.';
  } else if (remaining <= WARNING_THRESHOLD) {
    return `You have ${remaining} messages remaining in this session.`;
  }
  return '';
}

/**
 * Get limit reached message
 */
export function getLimitReachedMessage(): string {
  return `
You've reached the 10-message limit for this session. Here's what you can do:

1. **Export your work**: Use the export options above to save your conversation as PDF or Markdown
2. **Start a new session**: Click "New Session" to continue with a fresh strategic thinking session
3. **Review your insights**: Take some time to reflect on what we've discovered together

During our launch period, each session is limited to 10 messages to ensure quality interactions. This gives us both time to explore your strategy deeply without overwhelming you with information.

Ready to export or start fresh?
  `.trim();
}
