// Conversation database schema types for Supabase integration

export interface ConversationRow {
  id: string
  user_id: string
  workspace_id: string
  title?: string
  context_summary?: string
  bmad_session_id?: string
  created_at: string
  updated_at: string
  message_count: number
  total_tokens: number
  metadata?: Record<string, unknown>
}

export interface ConversationInsert {
  id?: string
  user_id: string
  workspace_id: string
  title?: string
  context_summary?: string
  bmad_session_id?: string
  created_at?: string
  updated_at?: string
  message_count?: number
  total_tokens?: number
  metadata?: Record<string, unknown>
}

export interface ConversationUpdate {
  id?: string
  user_id?: string
  workspace_id?: string
  title?: string
  context_summary?: string
  bmad_session_id?: string
  created_at?: string
  updated_at?: string
  message_count?: number
  total_tokens?: number
  metadata?: Record<string, unknown>
}

export interface MessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  token_usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coaching_context?: unknown
  metadata?: {
    tokens_used?: number
    response_time?: number
    coaching_context?: string
    quick_action?: string
    model_version?: string
    copied_from_branch?: boolean
    original_message_id?: string
    merged_from_branch?: string
    original_branch_message_id?: string
  }
  created_at: string
  message_index: number
}

export interface MessageInsert {
  id?: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  token_usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coaching_context?: unknown
  metadata?: {
    tokens_used?: number
    response_time?: number
    coaching_context?: string
    quick_action?: string
    model_version?: string
    copied_from_branch?: boolean
    original_message_id?: string
    merged_from_branch?: string
    original_branch_message_id?: string
  }
  created_at?: string
  message_index?: number
}

export interface MessageUpdate {
  id?: string
  conversation_id?: string
  role?: 'user' | 'assistant'
  content?: string
  token_usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coaching_context?: unknown
  metadata?: {
    tokens_used?: number
    response_time?: number
    coaching_context?: string
    quick_action?: string
    model_version?: string
    copied_from_branch?: boolean
    original_message_id?: string
    merged_from_branch?: string
    original_branch_message_id?: string
  }
  created_at?: string
  message_index?: number
}

export interface ConversationContextRow {
  id: string
  conversation_id: string
  context_type: 'summary' | 'key_insight' | 'decision_point' | 'bmad_phase' | 'user_note'
  content: string
  tokens_saved: number
  created_at: string
  message_range_start: number
  message_range_end: number
}

export interface ConversationContextInsert {
  id?: string
  conversation_id: string
  context_type: 'summary' | 'key_insight' | 'decision_point' | 'bmad_phase' | 'user_note'
  content: string
  tokens_saved?: number
  created_at?: string
  message_range_start: number
  message_range_end: number
}

// Message bookmarks for important messages
export interface MessageBookmarkRow {
  id: string
  message_id: string
  user_id: string
  title: string
  description?: string
  tags: string[]
  color: string
  created_at: string
  updated_at: string
}

export interface MessageBookmarkInsert {
  message_id: string
  user_id: string
  title: string
  description?: string
  tags?: string[]
  color?: string
}

export interface MessageBookmarkUpdate {
  title?: string
  description?: string
  tags?: string[]
  color?: string
}

// Message references for linking related messages across conversations
export interface MessageReferenceRow {
  id: string
  from_message_id: string
  to_message_id: string
  user_id: string
  reference_type: 'follow_up' | 'related' | 'contradiction' | 'builds_on' | 'question' | 'answer'
  description?: string
  created_at: string
}

export interface MessageReferenceInsert {
  from_message_id: string
  to_message_id: string
  user_id: string
  reference_type: 'follow_up' | 'related' | 'contradiction' | 'builds_on' | 'question' | 'answer'
  description?: string
}

// Conversation branches for alternative exploration paths
export interface ConversationBranchRow {
  id: string
  source_conversation_id: string
  branch_conversation_id: string
  branch_point_message_id: string
  title: string
  description?: string
  alternative_direction?: string
  created_by: string
  created_at: string
  metadata?: Record<string, unknown>
}

export interface ConversationBranchInsert {
  source_conversation_id: string
  branch_conversation_id: string
  branch_point_message_id: string
  title: string
  description?: string
  alternative_direction?: string
  created_by: string
  metadata?: Record<string, unknown>
}

// Extended database type with conversation tables
export type ConversationDatabase = {
  public: {
    Tables: {
      conversations: {
        Row: ConversationRow
        Insert: ConversationInsert
        Update: ConversationUpdate
      }
      messages: {
        Row: MessageRow
        Insert: MessageInsert
        Update: MessageUpdate
      }
      conversation_context: {
        Row: ConversationContextRow
        Insert: ConversationContextInsert
        Update: Partial<ConversationContextInsert>
      }
      message_bookmarks: {
        Row: MessageBookmarkRow
        Insert: MessageBookmarkInsert
        Update: MessageBookmarkUpdate
      }
      message_references: {
        Row: MessageReferenceRow
        Insert: MessageReferenceInsert
        Update: Partial<MessageReferenceInsert>
      }
      conversation_branches: {
        Row: ConversationBranchRow
        Insert: ConversationBranchInsert
        Update: Partial<ConversationBranchInsert>
      }
    }
  }
}