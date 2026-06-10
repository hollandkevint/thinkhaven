/**
 * Per-workload model router.
 *
 * ThinkHaven used to point one global `ANTHROPIC_MODEL` at every Anthropic call.
 * That burned frontier-tier cost (and latency) on conversational chat while
 * under-powering the decision-record synthesis — the reputation-bearing artifact
 * that the product actually ships. This module maps each workload to the right
 * tier and shapes model-specific request params.
 *
 * Tiers (see STRATEGY.md):
 *   - synthesis → Fable 5   : the decision-record artifact; batch, low-volume, highest-stakes reasoning.
 *   - board     → Opus 4.8  : the multi-round adversarial board loop (the moat), but volume + some latency.
 *   - chat      → Sonnet 4.6: latency-sensitive streaming elicitation (authed + guest).
 *   - util      → Haiku 4.5 : connection tests, throwaway/utility calls.
 *
 * Model-id precedence (most specific wins):
 *   ANTHROPIC_MODEL_<WORKLOAD>  >  ANTHROPIC_MODEL (global kill-switch / rollback)  >  built-in tier default.
 *
 * The global `ANTHROPIC_MODEL` is a deliberate escape hatch: set it to one known-good
 * model (e.g. `claude-sonnet-4-6`) to force every workload onto it — useful for rollback,
 * or before the account has Fable 5 / Opus 4.8 access enabled.
 */

export type Workload = 'chat' | 'board' | 'synthesis' | 'util';

/** Built-in tier map. Overridable per-workload or globally via env (see precedence above). */
const TIER_DEFAULTS: Record<Workload, string> = {
  chat: 'claude-sonnet-4-6',
  board: 'claude-opus-4-8',
  synthesis: 'claude-fable-5',
  util: 'claude-haiku-4-5',
};

const ENV_KEYS: Record<Workload, string> = {
  chat: 'ANTHROPIC_MODEL_CHAT',
  board: 'ANTHROPIC_MODEL_BOARD',
  synthesis: 'ANTHROPIC_MODEL_SYNTHESIS',
  util: 'ANTHROPIC_MODEL_UTIL',
};

/** Resolve the Anthropic model id for a workload, honoring env overrides. */
export function modelFor(workload: Workload): string {
  const perWorkload = process.env[ENV_KEYS[workload]]?.trim();
  if (perWorkload) return perWorkload;

  const global = process.env.ANTHROPIC_MODEL?.trim();
  if (global) return global;

  return TIER_DEFAULTS[workload];
}

/**
 * Frontier models (Fable 5, Opus 4.8, Opus 4.7) reject `temperature` / `top_p` / `top_k`
 * and `budget_tokens` — sending any of them returns a 400. Opus 4.6 and Sonnet 4.6 still
 * accept `temperature`, so they are intentionally excluded here.
 */
export function rejectsSamplingParams(model: string): boolean {
  return /^claude-(fable-5|opus-4-(7|8))/.test(model);
}

/**
 * Build the sampling slice for `messages.create()`. Spread the result into the request:
 * it carries `temperature` for models that accept it, and nothing for models that 400 on it.
 */
export function samplingFor(model: string, temperature: number): { temperature?: number } {
  return rejectsSamplingParams(model) ? {} : { temperature };
}

/** Per-token USD prices, matched by model-id prefix (input/output). */
const PRICES: Array<{ test: RegExp; input: number; output: number }> = [
  { test: /^claude-fable-5/, input: 10e-6, output: 50e-6 },
  { test: /^claude-opus-4-(5|6|7|8)/, input: 5e-6, output: 25e-6 },
  { test: /^claude-sonnet-4/, input: 3e-6, output: 15e-6 },
  { test: /^claude-haiku-4/, input: 1e-6, output: 5e-6 },
];

/** Unknown models fall back to Sonnet-tier rates so the estimate is never wildly low. */
const FALLBACK_PRICE = { input: 3e-6, output: 15e-6 };

/** Rough USD cost estimate for a single call, priced by the resolved model. */
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICES.find((p) => p.test.test(model)) ?? FALLBACK_PRICE;
  return inputTokens * price.input + outputTokens * price.output;
}
