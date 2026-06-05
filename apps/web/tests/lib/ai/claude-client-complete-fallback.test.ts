import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Vitest-native coverage for ClaudeClient.complete() provider selection + OpenRouter fallback.
// (The legacy claude-client.test.ts is jest-based and does not run under the vitest runner.)

const mockCreate = vi.fn();
const mockORComplete = vi.fn();
const mockORConfigured = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}));

vi.mock('@/lib/ai/openrouter-client', () => ({
  openRouterComplete: (opts: unknown) => mockORComplete(opts),
  isOpenRouterConfigured: () => mockORConfigured(),
  OpenRouterError: class OpenRouterError extends Error {},
}));

vi.mock('@/lib/ai/mary-persona', () => ({
  maryPersona: { generateSystemPrompt: () => 'system' },
}));

vi.mock('@/lib/ai/tools/index', () => ({ MARY_TOOLS: [] }));

function anthropicText(text: string) {
  return { content: [{ type: 'text', text }] };
}

function withStatus(status: number) {
  return Object.assign(new Error(`anthropic ${status}`), { status });
}

async function freshClient() {
  // Re-import so the lazy Anthropic singleton inside the module is rebuilt per test.
  vi.resetModules();
  const mod = await import('@/lib/ai/claude-client');
  return mod.claudeClient;
}

const OPTS = { system: 'sys', prompt: 'plan' };

describe('ClaudeClient.complete fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    vi.stubEnv('AI_PROVIDER', '');
    mockORConfigured.mockReturnValue(true);
    mockORComplete.mockResolvedValue('openrouter text');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns Anthropic text on success and never calls OpenRouter', async () => {
    mockCreate.mockResolvedValue(anthropicText('anthropic text'));
    const client = await freshClient();

    await expect(client.complete(OPTS)).resolves.toBe('anthropic text');
    expect(mockORComplete).not.toHaveBeenCalled();
  });

  it('falls back to OpenRouter on a 402 (credit exhausted)', async () => {
    mockCreate.mockRejectedValue(withStatus(402));
    const client = await freshClient();

    await expect(client.complete(OPTS)).resolves.toBe('openrouter text');
    expect(mockORComplete).toHaveBeenCalledWith(OPTS);
  });

  it('falls back on 429 and on 503', async () => {
    mockCreate.mockRejectedValueOnce(withStatus(429)).mockRejectedValueOnce(withStatus(503));
    let client = await freshClient();
    await expect(client.complete(OPTS)).resolves.toBe('openrouter text');
    client = await freshClient();
    await expect(client.complete(OPTS)).resolves.toBe('openrouter text');
  });

  it('falls back when the Anthropic key is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const client = await freshClient();

    await expect(client.complete(OPTS)).resolves.toBe('openrouter text');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockORComplete).toHaveBeenCalledOnce();
  });

  it('re-throws when fallback-worthy but OpenRouter is not configured', async () => {
    mockCreate.mockRejectedValue(withStatus(402));
    mockORConfigured.mockReturnValue(false);
    const client = await freshClient();

    await expect(client.complete(OPTS)).rejects.toMatchObject({ status: 402 });
    expect(mockORComplete).not.toHaveBeenCalled();
  });

  it('re-throws non-fallback-worthy errors without calling OpenRouter (e.g. 400)', async () => {
    mockCreate.mockRejectedValue(withStatus(400));
    const client = await freshClient();

    await expect(client.complete(OPTS)).rejects.toMatchObject({ status: 400 });
    expect(mockORComplete).not.toHaveBeenCalled();
  });

  it('routes straight to OpenRouter when AI_PROVIDER=openrouter', async () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    const client = await freshClient();

    await expect(client.complete(OPTS)).resolves.toBe('openrouter text');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockORComplete).toHaveBeenCalledWith(OPTS);
  });

  it('uses Anthropic when AI_PROVIDER=openrouter but no key is set', async () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    mockORConfigured.mockReturnValue(false);
    mockCreate.mockResolvedValue(anthropicText('anthropic text'));
    const client = await freshClient();

    await expect(client.complete(OPTS)).resolves.toBe('anthropic text');
    expect(mockORComplete).not.toHaveBeenCalled();
  });

  it('surfaces the error when both providers fail', async () => {
    mockCreate.mockRejectedValue(withStatus(402));
    mockORComplete.mockRejectedValue(new Error('openrouter down'));
    const client = await freshClient();

    await expect(client.complete(OPTS)).rejects.toThrow('openrouter down');
  });
});
