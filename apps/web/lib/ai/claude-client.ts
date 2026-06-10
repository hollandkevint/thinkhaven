import Anthropic from '@anthropic-ai/sdk';

type Tool = Anthropic.Messages.Tool;
type ContentBlock = Anthropic.Messages.ContentBlock;
type ToolUseBlock = Anthropic.Messages.ToolUseBlock;
type TextBlock = Anthropic.Messages.TextBlock;
import { maryPersona, type CoachingContext } from './mary-persona';
import { MARY_TOOLS } from './tools/index';
import { isOpenRouterConfigured, openRouterComplete } from './openrouter-client';
import { modelFor, samplingFor, effortConfigFor, estimateCostUsd } from './model-config';

// Initialize Anthropic client (lazy initialization to avoid build-time errors)
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    anthropic = new Anthropic({ apiKey });
    console.log('[Claude Client] Initialized');
  }
  return anthropic;
}

/**
 * Whether an Anthropic failure should trigger the OpenRouter fallback.
 * Credit-exhausted (402), rate-limited (429), and upstream 5xx are transient/provider
 * failures worth retrying elsewhere; a missing API key means Anthropic can't run at all.
 * Other 4xx (e.g. 400 invalid request) are re-thrown unmasked so real bugs surface.
 */
function isFallbackWorthy(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (typeof status === 'number') {
    return status === 402 || status === 429 || status >= 500;
  }
  if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
    return true;
  }
  return false;
}

function describeError(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (typeof status === 'number') return `status ${status}`;
  return error instanceof Error ? error.message : 'unknown error';
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
  rawContent: ContentBlock[];
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
      const cleanHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const messages = [
        ...cleanHistory,
        { role: 'user' as const, content: message }
      ];

      const client = getAnthropicClient();
      const model = modelFor('chat');

      const stream = await client.messages.create({
        model,
        max_tokens: 4096,
        ...samplingFor(model, 0.7),
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages,
        stream: true,
      });

      const { content, usage } = await this.processStreamWithUsage(stream, model);
      
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

  private async processStreamWithUsage(stream: AsyncIterable<unknown>, model: string): Promise<{
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
              // Cost estimate priced by the resolved model (see model-config.ts).
              usage.cost_estimate_usd = estimateCostUsd(model, usage.input_tokens, usage.output_tokens);
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

  async testConnection(): Promise<boolean> {
    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: modelFor('util'),
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
   * Single-shot completion with a custom system prompt, no tools and no Mary persona.
   * Used for server-side synthesis such as the guest decision-record generation.
   */
  async complete(options: {
    system: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    // Manual override for local/testing: force OpenRouter without spending Anthropic credit.
    if (process.env.AI_PROVIDER?.trim() === 'openrouter') {
      if (isOpenRouterConfigured()) {
        return openRouterComplete(options);
      }
      console.warn('[Claude Client] AI_PROVIDER=openrouter but OPENROUTER_API_KEY is unset; using Anthropic.');
    }

    try {
      return await this.completeWithAnthropic(options);
    } catch (error) {
      // Anthropic is primary; OpenRouter is the fallback when Anthropic is unavailable
      // (credit exhausted, rate-limited, upstream 5xx, or missing key).
      if (isFallbackWorthy(error) && isOpenRouterConfigured()) {
        console.warn(
          `[Claude Client] Anthropic synthesis failed (${describeError(error)}); falling back to OpenRouter.`,
        );
        return openRouterComplete(options);
      }
      throw error;
    }
  }

  private async completeWithAnthropic(options: {
    system: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const client = getAnthropicClient();
    const model = modelFor('synthesis');
    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 2048,
      ...samplingFor(model, options.temperature ?? 0.4),
      ...effortConfigFor(model, 'synthesis'),
      system: options.system,
      messages: [{ role: 'user', content: options.prompt }],
    }, { timeout: 60_000 }); // Override the SDK's 10-minute default so a hung call cannot pin a serverless function.

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text += (block as TextBlock).text;
      }
    }
    return text;
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
      const model = modelFor('board');

      const response = await client.messages.create({
        model,
        max_tokens: options?.maxTokens || 4096,
        ...samplingFor(model, 0.7),
        ...effortConfigFor(model, 'board'),
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages,
        tools: tools,
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
        cost_estimate_usd: estimateCostUsd(model, response.usage.input_tokens, response.usage.output_tokens),
      };

      if (this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        textContent,
        toolUses,
        rawContent: response.content,
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
    coachingContext?: CoachingContext,
    options?: {
      tools?: Tool[];
      maxTokens?: number;
    }
  ): Promise<MessageWithToolUse> {
    try {
      const client = getAnthropicClient();
      const tools = options?.tools || MARY_TOOLS;
      const model = modelFor('board');

      // Conversation already includes tool results as the last user message
      const messages = [...conversationHistory];

      const response = await client.messages.create({
        model,
        max_tokens: options?.maxTokens || 4096,
        ...samplingFor(model, 0.7),
        ...effortConfigFor(model, 'board'),
        system: maryPersona.generateSystemPrompt(coachingContext),
        messages: messages as Anthropic.MessageParam[],
        tools: tools,
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
        cost_estimate_usd: estimateCostUsd(model, response.usage.input_tokens, response.usage.output_tokens),
      };

      if (this.tokenUsageCallback) {
        this.tokenUsageCallback(usage);
      }

      return {
        id: crypto.randomUUID(),
        textContent,
        toolUses,
        rawContent: response.content,
        stopReason: response.stop_reason as MessageWithToolUse['stopReason'],
        usage,
      };
    } catch (error) {
      console.error('Claude API Error (tool continuation):', error);
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