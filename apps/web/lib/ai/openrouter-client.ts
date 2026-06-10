/**
 * OpenRouter transport — single-shot completion fallback for ClaudeClient.complete().
 *
 * OpenRouter speaks the OpenAI chat-completions format, so this is a thin raw-fetch
 * client (no SDK dependency). It is used ONLY for the no-tools, non-streaming synthesis
 * path; the streaming/tool chat paths stay on the Anthropic SDK. See
 * docs/plans/2026-06-04-001-feat-openrouter-fallback-plan.md.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Degraded fallback for synthesis when Anthropic is unavailable. Synthesis primary is now
// the frontier tier (Fable 5) via model-config.ts; this is intentionally a cheaper, widely
// available model for the down-path. Override with OPENROUTER_MODEL to match the primary tier.
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4';

const REQUEST_TIMEOUT_MS = 60_000; // Mirrors the Anthropic complete() timeout override.

export class OpenRouterError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OpenRouterError';
    this.status = status;
  }
}

/** True only when a usable OPENROUTER_API_KEY is present. Read at call-time. */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim();
}

/**
 * Single-shot completion against OpenRouter using the OpenAI chat-completions format.
 * Mirrors the contract of ClaudeClient.complete(): a system prompt + a user prompt in,
 * the assistant's text out.
 */
export async function openRouterComplete(options: {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenRouterError('OPENROUTER_API_KEY is not configured');
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter attribution headers (optional but recommended).
        'HTTP-Referer': 'https://thinkhaven.co',
        'X-Title': 'ThinkHaven',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.prompt },
        ],
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.4,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new OpenRouterError(`OpenRouter request failed: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.text()).slice(0, 300);
    } catch {
      // body already consumed or unreadable — status alone is enough to classify.
    }
    throw new OpenRouterError(
      `OpenRouter returned ${response.status}${detail ? `: ${detail}` : ''}`,
      response.status,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new OpenRouterError('OpenRouter returned a non-JSON response');
  }

  const text = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;

  if (typeof text !== 'string' || text.trim() === '') {
    throw new OpenRouterError('OpenRouter returned empty content');
  }

  return text;
}
