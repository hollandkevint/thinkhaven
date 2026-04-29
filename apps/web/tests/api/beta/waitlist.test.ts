import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/beta/waitlist/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  logBetaEvent: vi.fn().mockResolvedValue(true),
}));

function request(body: unknown) {
  return new Request('http://test.local/api/beta/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

function mockInsert(result: unknown) {
  const single = vi.fn().mockResolvedValue(result);
  const selectAfterInsert = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select: selectAfterInsert }));
  return { insert, selectAfterInsert, single };
}

describe('beta waitlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a waitlist row and records a durable event', async () => {
    const insertChain = mockInsert({
      data: { id: 'beta-1', user_id: null, email: 'person@example.com' },
      error: null,
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({ insert: insertChain.insert })),
    } as any);

    const response = await POST(request({ email: ' Person@Example.com ' }));

    await expect(response.json()).resolves.toMatchObject({
      success: true,
      duplicate: false,
    });
    expect(insertChain.insert).toHaveBeenCalledWith({
      email: 'person@example.com',
      source: 'landing_page',
    });
    expect(logBetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'waitlist_joined',
        betaAccessId: 'beta-1',
        targetEmail: 'person@example.com',
      })
    );
  });

  it('returns friendly success for duplicate waitlist emails', async () => {
    const insertChain = mockInsert({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'beta-existing', user_id: 'user-1', email: 'person@example.com' },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        insert: insertChain.insert,
        select,
      })),
    } as any);

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
    const from = vi.fn();
    vi.mocked(createAdminClient).mockReturnValue({ from } as any);

    const response = await POST(request({ email: 'not-an-email' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Enter a valid email address',
    });
    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it('returns service unavailable when the admin client is missing', async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);

    const response = await POST(request({ email: 'person@example.com' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Waitlist service unavailable',
    });
    expect(response.status).toBe(503);
  });
});
