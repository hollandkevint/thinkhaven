/**
 * Board of Directors Type Definitions
 *
 * Shared types for the Personal Board of Directors feature.
 * BoardMemberId is the single source of truth for valid speaker keys.
 */

// =============================================================================
// Board Member Types
// =============================================================================

export type BoardMemberId = 'mary' | 'victoria' | 'casey' | 'elaine' | 'omar' | 'taylor';

export type Disposition = 'supportive' | 'cautious' | 'opposed' | 'neutral';

export interface BoardMember {
  readonly id: BoardMemberId;
  readonly name: string;
  readonly role: string;
  readonly worldview: string;
  readonly bias: string;
  readonly voiceDescription: string;
  readonly color: string;
  readonly isOptIn: boolean;
}

export interface BoardState {
  activeSpeaker: BoardMemberId;
  taylorOptedIn: boolean;
}

// =============================================================================
// Chat Message Types (extracted from page.tsx)
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  strategic_tags?: string[];
  speaker?: BoardMemberId;
  handoff_reason?: string;
}
