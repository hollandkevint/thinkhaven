import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isOpenRouterConfigured,
  openRouterComplete,
  OpenRouterError,
} from '@/lib/ai/openrouter-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function okArtifact(content: string): Response {
  return jsonResponse({ choices: [{ message: { content } }] });
}

describe('openrouter-client', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.stubEnv('OPENROUTER_API_KEY', 'or-test-key');
    vi.stubEnv('OPENROUTER_MODEL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('isOpenRouterConfigured', () => {
    it('is true when a non-empty key is present', () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'or-test-key');
      expect(isOpenRouterConfigured()).toBe(true);
    });

    it('is false when the key is unset or whitespace-only', () => {
      vi.stubEnv('OPENROUTER_API_KEY', '   ');
      expect(isOpenRouterConfigured()).toBe(false);
      vi.stubEnv('OPENROUTER_API_KEY', '');
      expect(isOpenRouterConfigured()).toBe(false);
    });
  });

  describe('openRouterComplete', () => {
    it('returns the assistant content on a 200 response', async () => {
      const fetchMock = vi.fn().mockResolvedValue(okArtifact('# Decision\n\nbody'));
      vi.stubGlobal('fetch', fetchMock);

      const text = await openRouterComplete({ system: 'sys', prompt: 'hi' });

      expect(text).toBe('# Decision\n\nbody');
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('defaults to anthropic/claude-sonnet-4 and honors OPENROUTER_MODEL', async () => {
      // Fresh Response per call — a Response body can only be read once.
      const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okArtifact('ok')));
      vi.stubGlobal('fetch', fetchMock);

      await openRouterComplete({ system: 'sys', prompt: 'hi' });
      let body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
      expect(body.model).toBe('anthropic/claude-sonnet-4');
      expect(body.messages).toEqual([
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' },
      ]);

      vi.stubEnv('OPENROUTER_MODEL', 'anthropic/claude-3.5-haiku');
      await openRouterComplete({ system: 'sys', prompt: 'hi' });
      body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.model).toBe('anthropic/claude-3.5-haiku');
    });

    it('throws OpenRouterError with the status on a non-200 response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'no credit' }, 402)));

      await expect(openRouterComplete({ system: 's', prompt: 'p' })).rejects.toMatchObject({
        name: 'OpenRouterError',
        status: 402,
      });
    });

    it('throws when the response has empty content', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okArtifact('   ')));
      await expect(openRouterComplete({ system: 's', prompt: 'p' })).rejects.toBeInstanceOf(
        OpenRouterError,
      );
    });

    it('throws when choices are missing entirely', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));
      await expect(openRouterComplete({ system: 's', prompt: 'p' })).rejects.toBeInstanceOf(
        OpenRouterError,
      );
    });

    it('throws (does not hang) when fetch rejects, e.g. an abort/timeout', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('aborted')));
      await expect(openRouterComplete({ system: 's', prompt: 'p' })).rejects.toBeInstanceOf(
        OpenRouterError,
      );
    });

    it('throws when no API key is configured', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', '');
      vi.stubGlobal('fetch', vi.fn());
      await expect(openRouterComplete({ system: 's', prompt: 'p' })).rejects.toBeInstanceOf(
        OpenRouterError,
      );
    });
  });
});
