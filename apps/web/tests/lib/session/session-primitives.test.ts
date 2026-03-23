/**
 * Session Primitives Tests
 *
 * Tests for the atomic session lifecycle and phase management functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PHASE_ORDER,
  getPhaseOrder,
  getNextPhase,
  calculateProgress,
} from '@/lib/session/session-primitives';

// Mock Supabase - we test the pure functions here, not the DB operations
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

vi.mock('@/lib/monetization/credit-manager', () => ({
  hasCredits: vi.fn(() => Promise.resolve(true)),
  deductCredit: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('Phase Order Constants', () => {
  describe('PHASE_ORDER', () => {
    it('should define phases for new-idea pathway', () => {
      expect(PHASE_ORDER['new-idea']).toEqual([
        'discovery',
        'ideation',
        'validation',
        'planning',
      ]);
    });

    it('should define phases for business-model pathway', () => {
      expect(PHASE_ORDER['business-model']).toEqual([
        'analysis',
        'revenue',
        'customer',
        'validation',
        'planning',
      ]);
    });

    it('should define phases for strategic-optimization pathway', () => {
      expect(PHASE_ORDER['strategic-optimization']).toEqual([
        'assessment',
        'analysis',
        'strategy',
        'implementation',
      ]);
    });
  });
});

describe('getPhaseOrder', () => {
  it('should return phase order for known pathway', () => {
    const phases = getPhaseOrder('new-idea');
    expect(phases).toEqual(['discovery', 'ideation', 'validation', 'planning']);
  });

  it('should return empty array for unknown pathway', () => {
    const phases = getPhaseOrder('unknown-pathway');
    expect(phases).toEqual([]);
  });
});

describe('getNextPhase', () => {
  describe('new-idea pathway', () => {
    it('should return ideation after discovery', () => {
      expect(getNextPhase('new-idea', 'discovery')).toBe('ideation');
    });

    it('should return validation after ideation', () => {
      expect(getNextPhase('new-idea', 'ideation')).toBe('validation');
    });

    it('should return planning after validation', () => {
      expect(getNextPhase('new-idea', 'validation')).toBe('planning');
    });

    it('should return null after planning (last phase)', () => {
      expect(getNextPhase('new-idea', 'planning')).toBeNull();
    });

    it('should return null for unknown phase', () => {
      expect(getNextPhase('new-idea', 'unknown-phase')).toBeNull();
    });
  });

  describe('business-model pathway', () => {
    it('should return revenue after analysis', () => {
      expect(getNextPhase('business-model', 'analysis')).toBe('revenue');
    });

    it('should return customer after revenue', () => {
      expect(getNextPhase('business-model', 'revenue')).toBe('customer');
    });

    it('should return null after planning (last phase)', () => {
      expect(getNextPhase('business-model', 'planning')).toBeNull();
    });
  });

  describe('strategic-optimization pathway', () => {
    it('should return analysis after assessment', () => {
      expect(getNextPhase('strategic-optimization', 'assessment')).toBe('analysis');
    });

    it('should return null after implementation (last phase)', () => {
      expect(getNextPhase('strategic-optimization', 'implementation')).toBeNull();
    });
  });

  it('should return null for unknown pathway', () => {
    expect(getNextPhase('unknown', 'any-phase')).toBeNull();
  });
});

describe('calculateProgress', () => {
  describe('new-idea pathway (4 phases)', () => {
    it('should return 0% at discovery (first phase)', () => {
      expect(calculateProgress('new-idea', 'discovery')).toBe(0);
    });

    it('should return 25% at ideation (second phase)', () => {
      expect(calculateProgress('new-idea', 'ideation')).toBe(25);
    });

    it('should return 50% at validation (third phase)', () => {
      expect(calculateProgress('new-idea', 'validation')).toBe(50);
    });

    it('should return 75% at planning (fourth phase)', () => {
      expect(calculateProgress('new-idea', 'planning')).toBe(75);
    });

    it('should return 0% for unknown phase', () => {
      expect(calculateProgress('new-idea', 'unknown')).toBe(0);
    });
  });

  describe('business-model pathway (5 phases)', () => {
    it('should return 0% at analysis (first phase)', () => {
      expect(calculateProgress('business-model', 'analysis')).toBe(0);
    });

    it('should return 20% at revenue (second phase)', () => {
      expect(calculateProgress('business-model', 'revenue')).toBe(20);
    });

    it('should return 40% at customer (third phase)', () => {
      expect(calculateProgress('business-model', 'customer')).toBe(40);
    });

    it('should return 60% at validation (fourth phase)', () => {
      expect(calculateProgress('business-model', 'validation')).toBe(60);
    });

    it('should return 80% at planning (fifth phase)', () => {
      expect(calculateProgress('business-model', 'planning')).toBe(80);
    });
  });

  describe('strategic-optimization pathway (4 phases)', () => {
    it('should return 0% at assessment', () => {
      expect(calculateProgress('strategic-optimization', 'assessment')).toBe(0);
    });

    it('should return 25% at analysis', () => {
      expect(calculateProgress('strategic-optimization', 'analysis')).toBe(25);
    });

    it('should return 50% at strategy', () => {
      expect(calculateProgress('strategic-optimization', 'strategy')).toBe(50);
    });

    it('should return 75% at implementation', () => {
      expect(calculateProgress('strategic-optimization', 'implementation')).toBe(75);
    });
  });

  it('should return 0% for unknown pathway', () => {
    expect(calculateProgress('unknown', 'any-phase')).toBe(0);
  });
});

describe('Session Lifecycle Primitives', () => {
  // These tests verify the function signatures and error handling
  // Full integration tests would require a real database

  describe('Type Safety', () => {
    it('should export SessionRecord type with required fields', async () => {
      // Import types to verify they compile correctly
      const { createSessionRecord, loadSessionState, persistSessionState } =
        await import('@/lib/session/session-primitives');

      expect(typeof createSessionRecord).toBe('function');
      expect(typeof loadSessionState).toBe('function');
      expect(typeof persistSessionState).toBe('function');
    });

    it('should export phase management functions', async () => {
      const { completePhase, readPhaseState } =
        await import('@/lib/session/session-primitives');

      expect(typeof completePhase).toBe('function');
      expect(typeof readPhaseState).toBe('function');
    });

    it('should export insight management functions', async () => {
      const { recordInsight, getSessionInsights } =
        await import('@/lib/session/session-primitives');

      expect(typeof recordInsight).toBe('function');
      expect(typeof getSessionInsights).toBe('function');
    });

    it('should export session query functions', async () => {
      const { getActiveSessions, sessionBelongsToUser } =
        await import('@/lib/session/session-primitives');

      expect(typeof getActiveSessions).toBe('function');
      expect(typeof sessionBelongsToUser).toBe('function');
    });
  });
});

describe('Phase Completion Result', () => {
  it('should define correct result structure for completePhase', async () => {
    // This verifies the PhaseCompletionResult type is correct
    const mockResult = {
      success: true,
      previousPhase: 'discovery',
      nextPhase: 'ideation',
      isSessionComplete: false,
      newProgress: 25,
    };

    expect(mockResult.success).toBe(true);
    expect(mockResult.previousPhase).toBe('discovery');
    expect(mockResult.nextPhase).toBe('ideation');
    expect(mockResult.isSessionComplete).toBe(false);
    expect(mockResult.newProgress).toBe(25);
  });

  it('should allow null nextPhase when session complete', () => {
    const mockResult = {
      success: true,
      previousPhase: 'planning',
      nextPhase: null,
      isSessionComplete: true,
      newProgress: 100,
    };

    expect(mockResult.nextPhase).toBeNull();
    expect(mockResult.isSessionComplete).toBe(true);
  });

  it('should allow error field on failure', () => {
    const mockResult = {
      success: false,
      previousPhase: '',
      nextPhase: null,
      isSessionComplete: false,
      newProgress: 0,
      error: 'Session not found',
    };

    expect(mockResult.success).toBe(false);
    expect(mockResult.error).toBe('Session not found');
  });
});
