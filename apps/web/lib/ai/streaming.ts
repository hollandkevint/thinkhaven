import { CoachingContext } from './mary-persona';
import type { MessageLimitStatus } from '@/lib/bmad/message-limit-manager';
import type { BoardMemberId } from './board-types';

export interface StreamChunk {
  type: 'metadata' | 'content' | 'complete' | 'error' | 'typing' | 'speaker_change';
  content?: string;
  error?: string;
  metadata?: {
    coachingContext?: CoachingContext;
    messageId?: string;
    timestamp?: string;
    isGuest?: boolean;
    subPersona?: {
      currentMode: string;
      detectedUserState: string;
      exchangeCount: number;
      userControlEnabled: boolean;
    };
    boardState?: {
      activeSpeaker: BoardMemberId;
      taylorOptedIn: boolean;
    };
    speaker?: BoardMemberId;
    handoffReason?: string;
  };
  errorDetails?: {
    retryable?: boolean;
    suggestion?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_estimate_usd: number;
  };
  limitStatus?: MessageLimitStatus | null;
  // Additional data to return on completion (e.g., updated sub-persona state)
  additionalData?: Record<string, unknown>;
}

export class StreamEncoder {
  private encoder = new TextEncoder();

  encodeChunk(chunk: StreamChunk): Uint8Array {
    const data = JSON.stringify(chunk);
    return this.encoder.encode(`data: ${data}\n\n`);
  }

  encodeMetadata(metadata: StreamChunk['metadata']): Uint8Array {
    const chunk: StreamChunk = { type: 'metadata', metadata };
    return this.encodeChunk(chunk);
  }

  encodeContent(content: string, speaker?: BoardMemberId): Uint8Array {
    const chunk: StreamChunk = {
      type: 'content',
      content,
      metadata: speaker ? { speaker } : undefined,
    };
    return this.encodeChunk(chunk);
  }

  encodeSpeakerChange(speaker: BoardMemberId, handoffReason: string): Uint8Array {
    const chunk: StreamChunk = {
      type: 'speaker_change',
      metadata: { speaker, handoffReason },
    };
    return this.encodeChunk(chunk);
  }

  encodeTyping(isTyping: boolean = true): Uint8Array {
    const chunk: StreamChunk = { type: 'typing', content: isTyping ? 'start' : 'stop' };
    return this.encodeChunk(chunk);
  }

  encodeError(error: string, errorDetails?: StreamChunk['errorDetails']): Uint8Array {
    const chunk: StreamChunk = { type: 'error', error, errorDetails };
    return this.encodeChunk(chunk);
  }

  encodeComplete(
    usage?: StreamChunk['usage'],
    limitStatus?: MessageLimitStatus | null,
    additionalData?: Record<string, unknown>
  ): Uint8Array {
    const chunk: StreamChunk = { type: 'complete', usage, limitStatus, additionalData };
    return this.encodeChunk(chunk);
  }

  encodeDone(): Uint8Array {
    return this.encoder.encode('data: [DONE]\n\n');
  }
}

export class StreamDecoder {
  private decoder = new TextDecoder();
  private buffer = '';

  decode(value: Uint8Array): StreamChunk[] {
    this.buffer += this.decoder.decode(value, { stream: true });
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    const chunks: StreamChunk[] = [];
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        // Check for completion signal
        if (data === '[DONE]') {
          chunks.push({ type: 'complete' });
          continue;
        }
        
        try {
          const chunk = JSON.parse(data) as StreamChunk;
          chunks.push(chunk);
        } catch (error) {
          console.error('Failed to parse stream chunk:', error);
          // Skip malformed chunks rather than failing
        }
      }
    }
    return chunks;
  }

  reset(): void {
    this.buffer = '';
  }
}

// Connection retry utilities
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class StreamConnectionManager {
  private config: RetryConfig;
  private abortController?: AbortController;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      ...config
    };
  }

  async connectWithRetry<T>(
    fetchFn: (signal: AbortSignal) => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.abortController = new AbortController();
        return await fetchFn(this.abortController.signal);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort or auth errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw error;
          }
          if (error.message.toLowerCase().includes('unauthorized') || 
              error.message.toLowerCase().includes('forbidden')) {
            throw error;
          }
        }
        
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(
            this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
            this.config.maxDelay
          );
          
          onRetry?.(attempt, lastError);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  abort(): void {
    this.abortController?.abort();
  }
}

export function createStreamHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}