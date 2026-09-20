import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/session/route';
import { createSession } from '@/lib/db/repositories/session-repository';

const mocks = vi.hoisted(() => ({
  getRailwaySession: vi.fn(),
}));

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: mocks.getRailwaySession,
}));

vi.mock('@/lib/db/repositories/session-repository', () => ({
  createSession: vi.fn(),
}));

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRailwaySession.mockResolvedValue({
      user: { id: 'user-plan-grill', email: 'planner@example.com' },
    });
    vi.mocked(createSession).mockResolvedValue({
      status: 'created',
      id: 'session-plan-grill',
    });
  });

  it('creates plan-grill sessions with the plan-grill config', async () => {
    const response = await POST(request({ pathway: 'plan-grill' }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 'session-plan-grill' });
    expect(createSession).toHaveBeenCalledWith({
      userId: 'user-plan-grill',
      pathway: 'plan-grill',
      title: 'Plan Grill',
      currentPhase: 'intake',
      messageLimit: 20,
      chargeCredit: false,
    });
  });

  it('rejects requests without a Railway session', async () => {
    mocks.getRailwaySession.mockResolvedValue(null);

    const response = await POST(request({ pathway: 'plan-grill' }));

    expect(response.status).toBe(401);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('returns payment required when the locked balance is insufficient', async () => {
    vi.mocked(createSession).mockResolvedValue({ status: 'insufficient-credits' });

    const response = await POST(request({ pathway: 'plan-grill' }));

    expect(response.status).toBe(402);
  });
});
