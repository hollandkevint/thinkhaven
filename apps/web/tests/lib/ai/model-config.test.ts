import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  modelFor,
  rejectsSamplingParams,
  samplingFor,
  supportsEffort,
  effortFor,
  effortConfigFor,
  estimateCostUsd,
} from '@/lib/ai/model-config';

describe('model-config', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('modelFor — tier defaults', () => {
    it('defaults every user-facing workload to Sonnet 4.6 (cost preservation); util stays on Haiku', () => {
      expect(modelFor('synthesis')).toBe('claude-sonnet-4-6');
      expect(modelFor('board')).toBe('claude-sonnet-4-6');
      expect(modelFor('chat')).toBe('claude-sonnet-4-6');
      expect(modelFor('util')).toBe('claude-haiku-4-5');
    });

    it('never defaults any workload to a frontier model — frontier is env-opt-in only', () => {
      for (const workload of ['chat', 'board', 'synthesis', 'util'] as const) {
        expect(modelFor(workload)).not.toMatch(/fable|opus/);
      }
    });
  });

  describe('modelFor — precedence', () => {
    it('global ANTHROPIC_MODEL overrides every tier default (kill-switch / rollback)', () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
      expect(modelFor('synthesis')).toBe('claude-sonnet-4-6');
      expect(modelFor('board')).toBe('claude-sonnet-4-6');
      expect(modelFor('chat')).toBe('claude-sonnet-4-6');
    });

    it('per-workload override beats both the global and the default (frontier opt-in path)', () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-haiku-4-5');
      vi.stubEnv('ANTHROPIC_MODEL_SYNTHESIS', 'claude-fable-5');
      expect(modelFor('synthesis')).toBe('claude-fable-5'); // per-workload wins
      expect(modelFor('board')).toBe('claude-haiku-4-5'); // falls back to global
    });

    it('ignores blank/whitespace env values', () => {
      vi.stubEnv('ANTHROPIC_MODEL_BOARD', '   ');
      expect(modelFor('board')).toBe('claude-sonnet-4-6');
    });
  });

  describe('rejectsSamplingParams', () => {
    it('rejects sampling on frontier models (Fable 5, Opus 4.8/4.7)', () => {
      expect(rejectsSamplingParams('claude-fable-5')).toBe(true);
      expect(rejectsSamplingParams('claude-opus-4-8')).toBe(true);
      expect(rejectsSamplingParams('claude-opus-4-7')).toBe(true);
    });

    it('allows sampling on Opus 4.6, Sonnet 4.6, Haiku, and legacy Sonnet 4', () => {
      expect(rejectsSamplingParams('claude-opus-4-6')).toBe(false);
      expect(rejectsSamplingParams('claude-sonnet-4-6')).toBe(false);
      expect(rejectsSamplingParams('claude-haiku-4-5')).toBe(false);
      expect(rejectsSamplingParams('claude-sonnet-4-20250514')).toBe(false);
    });
  });

  describe('samplingFor', () => {
    it('drops temperature for frontier models (would 400)', () => {
      expect(samplingFor('claude-fable-5', 0.4)).toEqual({});
      expect(samplingFor('claude-opus-4-8', 0.7)).toEqual({});
    });

    it('keeps temperature for models that accept it', () => {
      expect(samplingFor('claude-sonnet-4-6', 0.7)).toEqual({ temperature: 0.7 });
      expect(samplingFor('claude-haiku-4-5', 0.4)).toEqual({ temperature: 0.4 });
    });
  });

  describe('supportsEffort', () => {
    it('supports effort on Fable 5, Opus 4.5+, and Sonnet 4.6', () => {
      expect(supportsEffort('claude-fable-5')).toBe(true);
      expect(supportsEffort('claude-opus-4-8')).toBe(true);
      expect(supportsEffort('claude-opus-4-5')).toBe(true);
      expect(supportsEffort('claude-sonnet-4-6')).toBe(true);
    });

    it('rejects effort on Haiku, Sonnet 4.5, and legacy models (would error)', () => {
      expect(supportsEffort('claude-haiku-4-5')).toBe(false);
      expect(supportsEffort('claude-sonnet-4-5')).toBe(false);
      expect(supportsEffort('claude-sonnet-4-20250514')).toBe(false);
    });
  });

  describe('effortFor', () => {
    it('defaults synthesis and board to high; chat and util get none', () => {
      expect(effortFor('synthesis')).toBe('high');
      expect(effortFor('board')).toBe('high');
      expect(effortFor('chat')).toBeUndefined();
      expect(effortFor('util')).toBeUndefined();
    });

    it('honors a valid env override (case-insensitive)', () => {
      vi.stubEnv('ANTHROPIC_EFFORT_SYNTHESIS', 'MAX');
      expect(effortFor('synthesis')).toBe('max');
    });

    it('ignores invalid env values and falls back to the default', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubEnv('ANTHROPIC_EFFORT_BOARD', 'xhigh'); // not in SDK 0.80.0's union
      expect(effortFor('board')).toBe('high');
      expect(warn).toHaveBeenCalledOnce();
      warn.mockRestore();
    });
  });

  describe('effortConfigFor', () => {
    it('emits output_config.effort for supported model + effort-bearing workload', () => {
      expect(effortConfigFor('claude-fable-5', 'synthesis')).toEqual({
        output_config: { effort: 'high' },
      });
      expect(effortConfigFor('claude-opus-4-8', 'board')).toEqual({
        output_config: { effort: 'high' },
      });
    });

    it('emits nothing when the model does not support effort (kill-switch safety)', () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-haiku-4-5');
      expect(effortConfigFor(modelFor('synthesis'), 'synthesis')).toEqual({});
    });

    it('emits nothing for workloads without an effort default', () => {
      expect(effortConfigFor('claude-sonnet-4-6', 'chat')).toEqual({});
      expect(effortConfigFor('claude-haiku-4-5', 'util')).toEqual({});
    });
  });

  describe('estimateCostUsd', () => {
    it('prices each tier from its own rate card', () => {
      // 1M in + 1M out
      expect(estimateCostUsd('claude-fable-5', 1_000_000, 1_000_000)).toBeCloseTo(60, 5);
      expect(estimateCostUsd('claude-opus-4-8', 1_000_000, 1_000_000)).toBeCloseTo(30, 5);
      expect(estimateCostUsd('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBeCloseTo(18, 5);
      expect(estimateCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(6, 5);
    });

    it('falls back to Sonnet-tier rates for unknown models', () => {
      expect(estimateCostUsd('some-future-model', 1_000_000, 1_000_000)).toBeCloseTo(18, 5);
    });
  });
});
