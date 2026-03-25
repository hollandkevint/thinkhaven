import Anthropic from '@anthropic-ai/sdk';
import type { Tool, ContentBlock, ToolUseBlock, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { maryPersona, type CoachingContext } from './mary-persona';
import { MARY_TOOLS } from './tools/index';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

// Initialize Anthropic client (lazy initialization to avoid build-time errors)
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    // Get and sanitize API key (remove whitespace/newlines)
    const rawApiKey = process.env.ANTHROPIC_API_KEY;
    const apiKey = rawApiKey?.trim();

    console.log('[Claude Client] DEBUG: Getting Anthropic client', {
      hasRawKey: !!rawApiKey,
      rawKeyLength: rawApiKey?.length || 0,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 15) || 'undefined',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Validate API key at runtime (not module load time)
    if (!apiKey) {
      console.error('[Claude Client] FATAL: ANTHROPIC_API_KEY environment variable is not set or empty after trim');
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    console.log('[Claude Client] Initializing Anthropic client...');

    try {
      anthropic = new Anthropic({
        apiKey: apiKey,
      });
      console.log('[Claude Client] Successfully initialized Anthropic client');
    } catch (error) {
      console.error('[Claude Client] Failed to initialize Anthropic client:', error);
      throw error;
    }
  }
  return anthropic;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_estimate_usd?: number;
}

export interface StreamingResponse {
  id: string;
  content: AsyncIterable<string>;
  usage?: TokenUsage;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolUseResult {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface MessageWithToolUse {
  id: string;
  textContent: string;
  toolUses: ToolUseResult[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage?: TokenUsage;
}

export class ClaudeClient {
  private tokenUsageCallback?: (usage: TokenUsage) => void;
  
  setTokenUsageCallback(callback: (usage: TokenUsage) => void) {
    this.tokenUsageCallback = callback;
  }

  async sendMessage(
    message: string,
    conversationHistory: ConversationMessage[] = [],
    coachingContext?: CoachingContext
  ): Promise<StreamingResponse> {
    try {
      console.log('[Claude Client] sendMessage called', {
        messageLength: message.length,
        historyLength: conversationHistory.length,
        hasCoachingContext: !!coachingContext,
        timestamp: new Date().toISOString()
      });

      // Filter conversation history to only include role and content
      const cleanHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const messages = [
        ...cleanHistory,
        { role: 'user' as const, content: message }
      ];

      console.log('[Claude Client] Getting Anthropic client...');
      const client = getAnthropicClient();

      console.log('[Claude Client] Calling Anthropic API...', {
        model: ANTHROPIC_MODEL,
        messageCount: messages.length
      });

      const stream = await client.messages.create({
        model: ANTHROPIC_MODEL, // Claude Sonnet 4 - upgraded per API docs
        max_tokens: 4096,
        temperature: 0.7,
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages,
        stream: true,
      });

      console.log('[Claude Client] Successfully created Anthropic stream');

      const { content, usage } = await this.processStreamWithUsage(stream);
      
      if (usage && this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        content,
        usage
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new ClaudeApiError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processStreamWithUsage(stream: AsyncIterable<unknown>): Promise<{
    content: AsyncIterable<string>,
    usage?: TokenUsage
  }> {
    const chunks: string[] = [];
    let usage: TokenUsage | undefined;

    const processedStream = async function* () {
      for await (const chunk of stream) {
        if (
          typeof chunk === 'object' && 
          chunk !== null && 
          'type' in chunk
        ) {
          // Handle content deltas
          if (
            chunk.type === 'content_block_delta' && 
            'delta' in chunk &&
            typeof chunk.delta === 'object' &&
            chunk.delta !== null &&
            'text' in chunk.delta &&
            typeof chunk.delta.text === 'string'
          ) {
            chunks.push(chunk.delta.text);
            yield chunk.delta.text;
          }
          // Handle usage information
          else if (chunk.type === 'message_delta' && 'usage' in chunk) {
            const chunkUsage = chunk.usage;
            if (typeof chunkUsage === 'object' && chunkUsage !== null) {
              usage = {
                input_tokens: 'input_tokens' in chunkUsage ? Number(chunkUsage.input_tokens) : 0,
                output_tokens: 'output_tokens' in chunkUsage ? Number(chunkUsage.output_tokens) : 0,
                total_tokens: 0,
                cost_estimate_usd: 0
              };
              usage.total_tokens = usage.input_tokens + usage.output_tokens;
              // Rough cost estimate for Sonnet (input: $3/1M, output: $15/1M). Adjust if using Haiku via ANTHROPIC_MODEL.
              usage.cost_estimate_usd = (usage.input_tokens * 0.000003) + (usage.output_tokens * 0.000015);
            }
          }
        }
      }
    };

    return {
      content: processedStream(),
      usage
    };
  }

  private async *processStream(stream: AsyncIterable<unknown>): AsyncIterable<string> {
    try {
      for await (const chunk of stream) {
        if (
          typeof chunk === 'object' && 
          chunk !== null && 
          'type' in chunk &&
          chunk.type === 'content_block_delta' && 
          'delta' in chunk &&
          typeof chunk.delta === 'object' &&
          chunk.delta !== null &&
          'text' in chunk.delta &&
          typeof chunk.delta.text === 'string'
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new ClaudeApiError(`Stream processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL, // Claude Sonnet 4 - upgraded per API docs
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return !!response;
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }

  /**
   * Send a message with tool support (non-streaming).
   * Returns the full response including any tool use blocks.
   */
  async sendMessageWithTools(
    message: string,
    conversationHistory: ConversationMessage[] = [],
    coachingContext?: CoachingContext,
    options?: {
      tools?: Tool[];
      maxTokens?: number;
    }
  ): Promise<MessageWithToolUse> {
    try {
      console.log('[Claude Client] sendMessageWithTools called', {
        messageLength: message.length,
        historyLength: conversationHistory.length,
        hasCoachingContext: !!coachingContext,
        toolCount: options?.tools?.length || MARY_TOOLS.length,
        timestamp: new Date().toISOString()
      });

      const cleanHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const messages = [
        ...cleanHistory,
        { role: 'user' as const, content: message }
      ];

      const client = getAnthropicClient();
      const tools = options?.tools || MARY_TOOLS;

      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: options?.maxTokens || 4096,
        temperature: 0.7,
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages,
        tools: tools,
      });

      console.log('[Claude Client] Response received', {
        stopReason: response.stop_reason,
        contentBlocks: response.content.length,
      });

      // Extract text and tool use blocks
      let textContent = '';
      const toolUses: ToolUseResult[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += (block as TextBlock).text;
        } else if (block.type === 'tool_use') {
          const toolBlock = block as ToolUseBlock;
          toolUses.push({
            id: toolBlock.id,
            name: toolBlock.name,
            input: toolBlock.input as Record<string, unknown>,
          });
        }
      }

      // Calculate token usage
      const usage: TokenUsage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        cost_estimate_usd: (response.usage.input_tokens * 0.000003) + (response.usage.output_tokens * 0.000015),
      };

      if (this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        textContent,
        toolUses,
        stopReason: response.stop_reason as MessageWithToolUse['stopReason'],
        usage,
      };
    } catch (error) {
      console.error('Claude API Error (with tools):', error);
      throw new ClaudeApiError(`Failed to send message with tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Continue a conversation after tool execution.
   * This is used to send tool results back to Claude.
   */
  async continueWithToolResults(
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string | ContentBlock[];
    }>,
    toolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
    }>,
    coachingContext?: CoachingContext,
    options?: {
      tools?: Tool[];
      maxTokens?: number;
    }
  ): Promise<MessageWithToolUse> {
    try {
      console.log('[Claude Client] continueWithToolResults called', {
        historyLength: conversationHistory.length,
        toolResultCount: toolResults.length,
        timestamp: new Date().toISOString()
      });

      const client = getAnthropicClient();
      const tools = options?.tools || MARY_TOOLS;

      // Build messages array with tool results
      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: toolResults }
      ];

      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: options?.maxTokens || 4096,
        temperature: 0.7,
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages as Anthropic.MessageParam[],
        tools: tools,
      });

      console.log('[Claude Client] Tool continuation response received', {
        stopReason: response.stop_reason,
        contentBlocks: response.content.length,
      });

      // Extract text and tool use blocks
      let textContent = '';
      const toolUses: ToolUseResult[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += (block as TextBlock).text;
        } else if (block.type === 'tool_use') {
          const toolBlock = block as ToolUseBlock;
          toolUses.push({
            id: toolBlock.id,
            name: toolBlock.name,
            input: toolBlock.input as Record<string, unknown>,
          });
        }
      }

      const usage: TokenUsage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        cost_estimate_usd: (response.usage.input_tokens * 0.000003) + (response.usage.output_tokens * 0.000015),
      };

      if (this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        textContent,
        toolUses,
        stopReason: response.stop_reason as MessageWithToolUse['stopReason'],
        usage,
      };
    } catch (error) {
      console.error('Claude API Error (tool continuation):', error);
      // Log the messages that caused the error for debugging
      console.error('[Claude Client] Failed messages structure:', JSON.stringify(
        messages.map((m: any) => ({ role: m.role, contentType: Array.isArray(m.content) ? 'array' : typeof m.content, contentLength: Array.isArray(m.content) ? m.content.length : String(m.content).length }))
      ));
      throw new ClaudeApiError(`Failed to continue with tool results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export class ClaudeApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

// Singleton instance
export const claudeClient = new ClaudeClient();