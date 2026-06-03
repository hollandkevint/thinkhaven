import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/session/route';
import { hasCredits, deductCredit } from '@/lib/monetization/credit-manager';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  insertedSessions: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/monetization/credit-manager', () => ({
  hasCredits: vi.fn(),
  deductCredit: vi.fn(),
}));

function buildSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: {
          user: {
            id: 'user-plan-grill',
            email: 'planner@example.com',
          },
        },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table !== 'bmad_sessions') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert: vi.fn((session: Record<string, unknown>) => {
          mocks.insertedSessions.push(session);
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { id: 'session-plan-grill' },
                error: null,
              })),
            })),
          };
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      };
    }),
  };
}

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/session', () => {
  beforeEach(() => {
    mocks.insertedSessions.length = 0;
    mocks.createClient.mockResolvedValue(buildSupabaseMock());
    vi.mocked(hasCredits).mockResolvedValue(true);
    vi.mocked(deductCredit).mockResolvedValue({
      success: true,
      balance: 9,
      message: 'ok',
    });
  });

  it('creates plan-grill sessions with the plan-grill config', async () => {
    const response = await POST(request({ pathway: 'plan-grill' }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 'session-plan-grill' });
    expect(mocks.insertedSessions[0]).toMatchObject({
      pathway: 'plan-grill',
      title: 'Plan Grill',
      current_phase: 'intake',
      message_limit: 20,
    });
  });
});
