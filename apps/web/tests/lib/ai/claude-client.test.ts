import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CoachingContext } from '@/lib/ai/mary-persona';

// Vitest-native coverage for ClaudeClient streaming chat (sendMessage) and testConnection.
// Ported from the legacy jest version; expectations match the per-workload model router
// (lib/ai/model-config.ts): chat -> claude-sonnet-4-6, util -> claude-haiku-4-5.

const mockCreate = vi.fn();
const mockGenerateSystemPrompt = vi.fn().mockReturnValue('Mock system prompt');

vi.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}));

vi.mock('@/lib/ai/mary-persona', () => ({
  maryPersona: { generateSystemPrompt: (ctx: unknown) => mockGenerateSystemPrompt(ctx) },
}));

vi.mock('@/lib/ai/tools/index', () => ({ MARY_TOOLS: [] }));

function streamOf(...chunks: unknown[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const c of chunks) yield c;
    },
  };
}

function textDelta(text: string) {
  return { type: 'content_block_delta', delta: { text } };
}

async function drain(content: AsyncIterable<string>): Promise<string> {
  let out = '';
  for await (const piece of content) out += piece;
  return out;
}

async function freshClient() {
  // Re-import so the lazy Anthropic singleton inside the module is rebuilt per test.
  vi.resetModules();
  const mod = await import('@/lib/ai/claude-client');
  return mod.claudeClient;
}

describe('ClaudeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateSystemPrompt.mockReturnValue('Mock system prompt');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('sendMessage', () => {
    it('sends the chat-tier request shape (model, sampling, system, stream)', async () => {
      mockCreate.mockResolvedValue(streamOf(textDelta('Hello'), textDelta(' world')));
      const client = await freshClient();

      const response = await client.sendMessage('Test message');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        temperature: 0.7,
        system: 'Mock system prompt',
        messages: [{ role: 'user', content: 'Test message' }],
        stream: true,
      });
      expect(response).toHaveProperty('id');
      await expect(drain(response.content)).resolves.toBe('Hello world');
    });

    it('includes conversation history before the new message', async () => {
      mockCreate.mockResolvedValue(streamOf(textDelta('Response')));
      const client = await freshClient();

      await client.sendMessage('New message', [
        { role: 'user', content: 'Previous user message' },
        { role: 'assistant', content: 'Previous assistant response' },
      ]);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Previous user message' },
            { role: 'assistant', content: 'Previous assistant response' },
            { role: 'user', content: 'New message' },
          ],
        })
      );
    });

    it('passes coaching context to the persona prompt generator', async () => {
      mockCreate.mockResolvedValue(streamOf(textDelta('Response')));
      const client = await freshClient();

      const coachingContext: CoachingContext = {
        workspaceId: 'workspace-123',
        userProfile: { experienceLevel: 'intermediate' },
      };
      await client.sendMessage('Test message', [], coachingContext);

      expect(mockGenerateSystemPrompt).toHaveBeenCalledWith(coachingContext);
    });

    it('wraps API errors in ClaudeApiError', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));
      const client = await freshClient();

      await expect(client.sendMessage('Test message')).rejects.toThrow(
        'Failed to send message: API Error'
      );
    });

    it('reports token usage via callback after the stream is consumed', async () => {
      mockCreate.mockResolvedValue(
        streamOf(textDelta('Hello'), {
          type: 'message_delta',
          usage: { input_tokens: 100, output_tokens: 50 },
        })
      );
      const client = await freshClient();
      const usageCallback = vi.fn();
      client.setTokenUsageCallback(usageCallback);

      const response = await client.sendMessage('Test message');
      // Usage arrives in the final stream chunks, so the callback fires on completion.
      expect(usageCallback).not.toHaveBeenCalled();
      await drain(response.content);

      expect(usageCallback).toHaveBeenCalledWith({
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        cost_estimate_usd: expect.any(Number),
      });
      expect(usageCallback.mock.calls[0][0].cost_estimate_usd).toBeGreaterThan(0);
    });

    it('skips malformed chunks without breaking the stream', async () => {
      mockCreate.mockResolvedValue(
        streamOf({ type: 'invalid_chunk' }, textDelta('Valid text'), { malformed: 'chunk' })
      );
      const client = await freshClient();

      const response = await client.sendMessage('Test message');

      await expect(drain(response.content)).resolves.toBe('Valid text');
    });
  });

  describe('testConnection', () => {
    it('returns true on success using the util tier', async () => {
      mockCreate.mockResolvedValue({ id: 'test-response' });
      const client = await freshClient();

      await expect(client.testConnection()).resolves.toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-haiku-4-5',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
    });

    it('returns false on failure', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));
      const client = await freshClient();

      await expect(client.testConnection()).resolves.toBe(false);
    });
  });
});
