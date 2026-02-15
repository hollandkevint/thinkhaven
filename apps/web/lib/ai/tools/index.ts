/**
 * Tool Registry and Definitions for Mary's Agent-Native Capabilities
 *
 * Phase 3: Tool Calling Infrastructure
 *
 * These tools give Mary atomic capabilities to manipulate sessions,
 * replacing heuristic-based phase completion with explicit agent decisions.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';

// =============================================================================
// Tool Result Types
// =============================================================================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface CompletePhaseResult extends ToolResult {
  data?: {
    previousPhase: string;
    nextPhase: string | null;
    completionReason: string;
    sessionProgress: number;
  };
}

export interface SwitchModeResult extends ToolResult {
  data?: {
    previousMode: string;
    newMode: string;
    reason: string;
  };
}

export interface RecommendActionResult extends ToolResult {
  data?: {
    recommendation: 'proceed' | 'pivot' | 'validate_further' | 'kill';
    viabilityScore: number;
    concerns: string[];
    strengths: string[];
    reasoning: string;
  };
}

export interface GenerateDocumentResult extends ToolResult {
  data?: {
    documentType: string;
    documentId: string;
    preview: string;
  };
}

export interface ReadSessionStateResult extends ToolResult {
  data?: {
    sessionId: string;
    pathway: string;
    currentPhase: string;
    progress: number;
    currentMode: string;
    exchangeCount: number;
    insights: string[];
  };
}

export interface UpdateContextResult extends ToolResult {
  data?: {
    insightAdded: string;
    totalInsights: number;
  };
}

// =============================================================================
// Tool Input Types
// =============================================================================

export interface CompletePhaseInput {
  reason: string;
  key_outcomes?: string[];
}

export interface SwitchModeInput {
  new_mode: 'inquisitive' | 'devil_advocate' | 'encouraging' | 'realistic';
  reason: string;
}

export interface SwitchSpeakerInput {
  speaker_key: string;
  handoff_reason: string;
}

export interface SwitchSpeakerResult extends ToolResult {
  data?: {
    previousSpeaker: string;
    newSpeaker: string;
    handoffReason: string;
  };
}

export interface RecommendActionInput {
  concerns: string[];
  strengths: string[];
  additional_context?: string;
}

export interface GenerateDocumentInput {
  document_type: 'lean_canvas' | 'business_model_canvas' | 'prd' | 'feature_brief' | 'concept_document';
  title?: string;
  sections_to_include?: string[];
}

export interface UpdateContextInput {
  insight: string;
  category?: 'market' | 'product' | 'competition' | 'risk' | 'opportunity' | 'general';
}

// Phase 5: Discovery Tool Types
export interface DiscoverPathwaysResult extends ToolResult {
  data?: {
    pathways: Array<{
      id: string;
      name: string;
      description: string;
      targetUser: string;
      phases: string[];
    }>;
    totalCount: number;
  };
}

export interface DiscoverPhaseActionsResult extends ToolResult {
  data?: {
    actions: Array<{
      id: string;
      name: string;
      description: string;
      type: string;
      producesOutput: boolean;
      outputType?: string;
    }>;
    totalCount: number;
  };
}

export interface DiscoverDocumentTypesResult extends ToolResult {
  data?: {
    documentTypes: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      requiredContext: string[];
      generatorAvailable: boolean;
    }>;
    totalCount: number;
  };
}

export interface DiscoverPhaseActionsInput {
  phase_id?: string;
  action_type?: 'analysis' | 'generation' | 'transition' | 'capture';
}

export interface DiscoverDocumentTypesInput {
  category?: 'canvas' | 'brief' | 'summary' | 'analysis';
  phase_id?: string;
}

// =============================================================================
// Tool Definitions (Anthropic API format)
// =============================================================================

export const MARY_TOOLS: Tool[] = [
  // ==========================================================================
  // Phase 5: Discovery Tools
  // ==========================================================================
  {
    name: 'discover_pathways',
    description: 'Discover all available strategic pathways and their configurations. Use this to understand what journeys are available for users, especially when helping them choose an approach or when you need to understand the system capabilities.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'discover_phase_actions',
    description: 'Discover what actions are available in a specific phase. Use this to understand what you can do at any point in the session, or to explore capabilities across different phases.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phase_id: {
          type: 'string',
          description: 'The phase to get actions for (e.g., "discovery", "ideation", "validation"). If not provided, returns universal actions.',
        },
        action_type: {
          type: 'string',
          enum: ['analysis', 'generation', 'transition', 'capture'],
          description: 'Filter actions by type',
        },
      },
      required: [],
    },
  },
  {
    name: 'discover_document_types',
    description: 'Discover what document types are available for generation. Use this to understand what deliverables you can create and what context is needed for each.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['canvas', 'brief', 'summary', 'analysis'],
          description: 'Filter by document category',
        },
        phase_id: {
          type: 'string',
          description: 'Filter by phase where documents are typically generated',
        },
      },
      required: [],
    },
  },

  // ==========================================================================
  // Core Session Tools (Phase 3)
  // ==========================================================================
  {
    name: 'read_session_state',
    description: 'Read the current session state including phase, progress, mode, and recent insights. Use this to understand where the user is in their journey before making decisions.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'complete_phase',
    description: 'Signal that the current phase is complete and the session should advance. Only call this when the user has adequately addressed the phase objectives. Provide a clear reason for completion.',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: {
          type: 'string',
          description: 'Why this phase is complete (what was accomplished)',
        },
        key_outcomes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key outcomes or decisions from this phase',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'switch_persona_mode',
    description: 'Change your coaching mode to better serve the user. Use when you detect the user would benefit from a different approach (e.g., shift to encouraging if they seem defensive, or devil_advocate if overconfident).',
    input_schema: {
      type: 'object' as const,
      properties: {
        new_mode: {
          type: 'string',
          enum: ['inquisitive', 'devil_advocate', 'encouraging', 'realistic'],
          description: 'The coaching mode to switch to',
        },
        reason: {
          type: 'string',
          description: 'Why this mode shift is appropriate',
        },
      },
      required: ['new_mode', 'reason'],
    },
  },
  {
    name: 'switch_speaker',
    description: 'Switch the active speaker to a different board member. Use this when you want a board member to weigh in on the conversation. Provide a handoff reason explaining why this perspective is relevant. The speaker_key must be one of: victoria, casey, elaine, omar, taylor, mary.',
    input_schema: {
      type: 'object' as const,
      properties: {
        speaker_key: {
          type: 'string',
          enum: ['mary', 'victoria', 'casey', 'elaine', 'omar', 'taylor'],
          description: 'The board member to switch to',
        },
        handoff_reason: {
          type: 'string',
          description: 'Why this board member should speak now (shown to the user as a handoff annotation)',
        },
      },
      required: ['speaker_key', 'handoff_reason'],
    },
  },
  {
    name: 'recommend_action',
    description: 'Provide a strategic recommendation about whether to proceed, pivot, validate further, or kill the idea. Only use after thorough exploration (at least 5 exchanges and genuine probing). This is a key differentiator - earn the right to recommend by doing the work first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        concerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific concerns identified during exploration',
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Strengths and positive indicators identified',
        },
        additional_context: {
          type: 'string',
          description: 'Any additional context for the recommendation',
        },
      },
      required: ['concerns', 'strengths'],
    },
  },
  {
    name: 'generate_document',
    description: 'Generate a structured document based on the session insights. Use when the user has provided enough context for a meaningful deliverable.',
    input_schema: {
      type: 'object' as const,
      properties: {
        document_type: {
          type: 'string',
          enum: ['lean_canvas', 'business_model_canvas', 'prd', 'feature_brief', 'concept_document'],
          description: 'Type of document to generate',
        },
        title: {
          type: 'string',
          description: 'Title for the document',
        },
        sections_to_include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific sections to include (optional, defaults to all)',
        },
      },
      required: ['document_type'],
    },
  },
  {
    name: 'update_session_context',
    description: 'Record an important insight or decision from the conversation. Use this to build up context that will inform future interactions and document generation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        insight: {
          type: 'string',
          description: 'The insight or decision to record',
        },
        category: {
          type: 'string',
          enum: ['market', 'product', 'competition', 'risk', 'opportunity', 'general'],
          description: 'Category of the insight',
        },
      },
      required: ['insight'],
    },
  },
];

// =============================================================================
// Tool Name Constants
// =============================================================================

export const TOOL_NAMES = {
  // Phase 5: Discovery Tools
  DISCOVER_PATHWAYS: 'discover_pathways',
  DISCOVER_PHASE_ACTIONS: 'discover_phase_actions',
  DISCOVER_DOCUMENT_TYPES: 'discover_document_types',
  // Phase 3: Core Session Tools
  READ_SESSION_STATE: 'read_session_state',
  COMPLETE_PHASE: 'complete_phase',
  SWITCH_PERSONA_MODE: 'switch_persona_mode',
  SWITCH_SPEAKER: 'switch_speaker',
  RECOMMEND_ACTION: 'recommend_action',
  GENERATE_DOCUMENT: 'generate_document',
  UPDATE_SESSION_CONTEXT: 'update_session_context',
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

// =============================================================================
// Tool Registry
// =============================================================================

export function getToolByName(name: string): Tool | undefined {
  return MARY_TOOLS.find(tool => tool.name === name);
}

export function getAllToolNames(): string[] {
  return MARY_TOOLS.map(tool => tool.name);
}

export function getToolDescriptions(): Record<string, string> {
  return MARY_TOOLS.reduce((acc, tool) => {
    acc[tool.name] = tool.description;
    return acc;
  }, {} as Record<string, string>);
}
