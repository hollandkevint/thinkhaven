import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '@/app/api/beta/waitlist/route';
import { getDatabasePool } from '@/lib/db/pool';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  logBetaEvent: vi.fn().mockResolvedValue(true),
}));

function request(body: unknown) {
  return new Request('http://test.local/api/beta/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const query = vi.fn();

describe('beta waitlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never);
  });

  it('creates a waitlist row and records a durable event', async () => {
    query.mockResolvedValueOnce({
      rows: [{ id: 'beta-1', user_id: null, email: 'person@example.com' }],
    });

    const response = await POST(request({ email: ' Person@Example.com ' }));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      duplicate: false,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('insert into "public"."beta_access"'),
      ['person@example.com', 'landing_page'],
    );
    expect(logBetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'waitlist_joined',
        betaAccessId: 'beta-1',
        targetEmail: 'person@example.com',
      })
    );
  });

  it('returns friendly success for duplicate waitlist emails', async () => {
    query.mockRejectedValueOnce({ code: '23505', message: 'duplicate' });
    query.mockResolvedValueOnce({
      rows: [{ id: 'beta-existing', user_id: 'user-1', email: 'person@example.com' }],
    });

    const response = await POST(request({ email: 'person@example.com' }));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      duplicate: true,
    });
    expect(logBetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'waitlist_duplicate',
        betaAccessId: 'beta-existing',
      })
    );
  });

  it('rejects malformed email before database insert', async () => {
    const response = await POST(request({ email: 'not-an-email' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Enter a valid email address',
    });
    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns service unavailable when the database is missing', async () => {
    vi.mocked(getDatabasePool).mockImplementation(() => {
      throw new Error('DATABASE_URL is missing');
    });

    const response = await POST(request({ email: 'person@example.com' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Waitlist service unavailable',
    });
    expect(response.status).toBe(503);
  });
});
