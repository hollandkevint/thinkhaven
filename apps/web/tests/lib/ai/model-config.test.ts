import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  modelFor,
  rejectsSamplingParams,
  samplingFor,
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
    it('maps each workload to its frontier-aware tier default', () => {
      expect(modelFor('synthesis')).toBe('claude-fable-5');
      expect(modelFor('board')).toBe('claude-opus-4-8');
      expect(modelFor('chat')).toBe('claude-sonnet-4-6');
      expect(modelFor('util')).toBe('claude-haiku-4-5');
    });
  });

  describe('modelFor — precedence', () => {
    it('global ANTHROPIC_MODEL overrides every tier default (kill-switch / rollback)', () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
      expect(modelFor('synthesis')).toBe('claude-sonnet-4-6');
      expect(modelFor('board')).toBe('claude-sonnet-4-6');
      expect(modelFor('chat')).toBe('claude-sonnet-4-6');
    });

    it('per-workload override beats both the global and the default', () => {
      vi.stubEnv('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
      vi.stubEnv('ANTHROPIC_MODEL_SYNTHESIS', 'claude-fable-5');
      expect(modelFor('synthesis')).toBe('claude-fable-5'); // per-workload wins
      expect(modelFor('board')).toBe('claude-sonnet-4-6'); // falls back to global
    });

    it('ignores blank/whitespace env values', () => {
      vi.stubEnv('ANTHROPIC_MODEL_BOARD', '   ');
      expect(modelFor('board')).toBe('claude-opus-4-8');
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
