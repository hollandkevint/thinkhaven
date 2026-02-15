/**
 * Tool Executor
 *
 * Central execution engine for Mary's tools.
 * Routes tool calls to appropriate handlers and manages execution context.
 */

import {
  TOOL_NAMES,
  type ToolResult,
  type CompletePhaseInput,
  type SwitchModeInput,
  type SwitchSpeakerInput,
  type RecommendActionInput,
  type GenerateDocumentInput,
  type UpdateContextInput,
  type DiscoverPhaseActionsInput,
  type DiscoverDocumentTypesInput,
} from './tools/index';

import {
  readSessionState,
  completePhase,
  switchPersonaMode,
  switchSpeaker,
  recommendAction,
  updateSessionContext,
} from './tools/session-tools';

import { generateDocument } from './tools/document-tools';

import {
  discoverPathways,
  discoverPhaseActions,
  discoverDocumentTypes,
} from './tools/discovery-tools';

// =============================================================================
// Types
// =============================================================================

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId: string;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: ToolResult;
  executionTimeMs: number;
}

// =============================================================================
// Tool Executor
// =============================================================================

export class ToolExecutor {
  private context: ToolExecutionContext;

  constructor(context: ToolExecutionContext) {
    this.context = context;
  }

  /**
   * Execute a single tool call
   */
  async execute(toolCall: ToolCall): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    console.log('[ToolExecutor] Executing tool:', {
      toolName: toolCall.name,
      toolCallId: toolCall.id,
      sessionId: this.context.sessionId,
    });

    let result: ToolResult;

    try {
      switch (toolCall.name) {
        // Phase 5: Discovery Tools
        case TOOL_NAMES.DISCOVER_PATHWAYS:
          result = await discoverPathways();
          break;

        case TOOL_NAMES.DISCOVER_PHASE_ACTIONS:
          result = await discoverPhaseActions(
            toolCall.input as DiscoverPhaseActionsInput
          );
          break;

        case TOOL_NAMES.DISCOVER_DOCUMENT_TYPES:
          result = await discoverDocumentTypes(
            toolCall.input as DiscoverDocumentTypesInput
          );
          break;

        // Phase 3: Core Session Tools
        case TOOL_NAMES.READ_SESSION_STATE:
          result = await readSessionState(this.context.sessionId);
          break;

        case TOOL_NAMES.COMPLETE_PHASE:
          result = await completePhase(
            this.context.sessionId,
            toolCall.input as CompletePhaseInput
          );
          break;

        case TOOL_NAMES.SWITCH_PERSONA_MODE:
          result = await switchPersonaMode(
            this.context.sessionId,
            toolCall.input as SwitchModeInput
          );
          break;

        case TOOL_NAMES.SWITCH_SPEAKER:
          result = await switchSpeaker(
            this.context.sessionId,
            toolCall.input as SwitchSpeakerInput
          );
          break;

        case TOOL_NAMES.RECOMMEND_ACTION:
          result = await recommendAction(
            this.context.sessionId,
            toolCall.input as RecommendActionInput
          );
          break;

        case TOOL_NAMES.GENERATE_DOCUMENT:
          result = await generateDocument(
            this.context.sessionId,
            this.context.userId,
            toolCall.input as GenerateDocumentInput
          );
          break;

        case TOOL_NAMES.UPDATE_SESSION_CONTEXT:
          result = await updateSessionContext(
            this.context.sessionId,
            toolCall.input as UpdateContextInput
          );
          break;

        default:
          result = {
            success: false,
            error: `Unknown tool: ${toolCall.name}`,
          };
      }
    } catch (error) {
      result = {
        success: false,
        error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    const executionTimeMs = Date.now() - startTime;

    console.log('[ToolExecutor] Tool execution complete:', {
      toolName: toolCall.name,
      success: result.success,
      executionTimeMs,
      error: result.error,
    });

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      result,
      executionTimeMs,
    };
  }

  /**
   * Execute multiple tool calls in sequence
   */
  async executeAll(toolCalls: ToolCall[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.execute(toolCall);
      results.push(result);
    }

    return results;
  }

  /**
   * Format tool results for sending back to Claude
   */
  static formatResultsForClaude(results: ToolExecutionResult[]): Array<{
    type: 'tool_result';
    tool_use_id: string;
    content: string;
  }> {
    return results.map(result => ({
      type: 'tool_result' as const,
      tool_use_id: result.toolCallId,
      content: JSON.stringify(result.result),
    }));
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse tool use blocks from Claude's response
 */
export function parseToolUseBlocks(
  contentBlocks: Array<{ type: string; id?: string; name?: string; input?: unknown }>
): ToolCall[] {
  return contentBlocks
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      id: block.id || '',
      name: block.name || '',
      input: (block.input as Record<string, unknown>) || {},
    }));
}

/**
 * Check if a response contains tool use
 */
export function hasToolUse(
  contentBlocks: Array<{ type: string }>
): boolean {
  return contentBlocks.some(block => block.type === 'tool_use');
}

/**
 * Extract text content from response (excluding tool use)
 */
export function extractTextContent(
  contentBlocks: Array<{ type: string; text?: string }>
): string {
  return contentBlocks
    .filter(block => block.type === 'text' && block.text)
    .map(block => block.text)
    .join('');
}
