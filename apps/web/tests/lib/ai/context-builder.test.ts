import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextBuilder } from '@/lib/ai/context-builder';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

function buildSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'bmad_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'session-123',
                  pathway: 'plan-grill',
                  current_phase: 'intake',
                  overall_completion: 0,
                  sub_persona_state: {
                    currentMode: 'devil_advocate',
                    detectedUserState: 'neutral',
                    exchangeCount: 2,
                  },
                },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'bmad_phase_outputs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      output_data: {
                        insight: 'Customer means the buyer; User means the authenticated identity.',
                        category: 'domain',
                      },
                    },
                    {
                      output_data: {
                        insights: ['Keep paste-driven V1 scope.', 42, null],
                      },
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('ContextBuilder', () => {
  beforeEach(() => {
    mocks.createClient.mockResolvedValue(buildSupabaseMock());
  });

  it('includes singular update_session_context insights in dynamic session context', async () => {
    const context = await ContextBuilder.buildSessionContext('session-123');

    expect(context?.recentInsights).toContain(
      'domain: Customer means the buyer; User means the authenticated identity.'
    );
    expect(context?.recentInsights).toContain('Keep paste-driven V1 scope.');
    expect(context?.recentInsights).not.toContain(42);
  });
});
