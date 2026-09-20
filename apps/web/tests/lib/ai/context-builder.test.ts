import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextBuilder } from '@/lib/ai/context-builder';

const mocks = vi.hoisted(() => ({
  countCompletedSessions: vi.fn(),
  getLastCompletedSession: vi.fn(),
  getOwnedContextInsights: vi.fn(),
  getOwnedContextSession: vi.fn(),
  getUserWorkspace: vi.fn(),
}));

vi.mock('@/lib/db/repositories/context-repository', () => mocks);

describe('ContextBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOwnedContextSession.mockResolvedValue({
      id: 'session-123',
      pathway: 'plan-grill',
      current_phase: 'intake',
      overall_completion: 0,
      sub_persona_state: {
        currentMode: 'devil_advocate',
        detectedUserState: 'neutral',
        exchangeCount: 2,
      },
    });
    mocks.getOwnedContextInsights.mockResolvedValue([
      {
        output_data: {
          insight: 'Customer means the buyer; User means the authenticated identity.',
          category: 'domain',
        },
      },
      { output_data: { insights: ['Keep paste-driven V1 scope.', 42, null] } },
    ]);
  });

  it('includes actor-scoped session insights in dynamic session context', async () => {
    const context = await ContextBuilder.buildSessionContext('session-123', 'user-123');

    expect(mocks.getOwnedContextSession).toHaveBeenCalledWith('session-123', 'user-123');
    expect(mocks.getOwnedContextInsights).toHaveBeenCalledWith('session-123', 'user-123');
    expect(context?.recentInsights).toContain(
      'domain: Customer means the buyer; User means the authenticated identity.'
    );
    expect(context?.recentInsights).toContain('Keep paste-driven V1 scope.');
    expect(context?.recentInsights).not.toContain(42);
  });

  it('does not read a session without an authenticated actor', async () => {
    const context = await ContextBuilder.buildDynamicContext('session-123');

    expect(context.session).toBeUndefined();
    expect(mocks.getOwnedContextSession).not.toHaveBeenCalled();
  });

  it('builds user context from actor-scoped workspace and session history', async () => {
    mocks.getUserWorkspace.mockResolvedValue({
      workspace_state: {
        userName: 'Kevin',
        industry: 'Healthcare',
        role: 'Product lead',
        preferences: { communicationStyle: 'direct' },
      },
    });
    mocks.countCompletedSessions.mockResolvedValue(2);
    mocks.getLastCompletedSession.mockResolvedValue({
      pathway: 'plan-grill',
      overall_completion: 80,
    });

    await expect(ContextBuilder.buildUserContext('user-123')).resolves.toMatchObject({
      userId: 'user-123',
      name: 'Kevin',
      experienceLevel: 'intermediate',
      previousSessionCount: 2,
      lastSessionSummary: 'plan-grill session (80% complete)',
    });
    expect(mocks.getUserWorkspace).toHaveBeenCalledWith('user-123');
    expect(mocks.countCompletedSessions).toHaveBeenCalledWith('user-123');
    expect(mocks.getLastCompletedSession).toHaveBeenCalledWith('user-123');
  });
});
