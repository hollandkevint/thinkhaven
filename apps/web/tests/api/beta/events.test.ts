import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logBetaEvent } from '@/lib/monitoring/beta-event-logger';
import { POST } from '@/app/api/beta/events/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/security/rate-limiter', () => ({
  RateLimiter: {
    checkRateLimit: vi.fn(() => ({ allowed: true, resetTime: Date.now() + 1000 })),
    createLimitResponse: vi.fn(),
  },
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  logBetaEvent: vi.fn().mockResolvedValue(true),
}));

const betaAccessId = '11111111-1111-4111-8111-111111111111';

function request(body: unknown) {
  return new Request('http://test.local/api/beta/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('beta event API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it('records public invite arrival without authentication', async () => {
    const response = await POST(
      request({
        eventType: 'invite_arrived',
        betaInviteId: betaAccessId,
        source: 'beta_invite',
      })
    );

    await expect(response.json()).resolves.toEqual({ success: true, recorded: true });
    expect(logBetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'invite_arrived',
        betaAccessId,
        metadata: expect.objectContaining({ source: 'beta_invite' }),
      })
    );
  });

  it('requires authentication for guest migration events', async () => {
    const response = await POST(
      request({
        eventType: 'guest_migration_attempted',
        betaInviteId: betaAccessId,
      })
    );

    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(response.status).toBe(401);
    expect(logBetaEvent).not.toHaveBeenCalled();
  });

  it('records authenticated guest migration metadata without raw content', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email: 'person@example.com',
            },
          },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const response = await POST(
      request({
        eventType: 'guest_migration_attempted',
        betaInviteId: betaAccessId,
        source: 'try',
        success: true,
        migratedMessages: 15,
        metadata: {
          transcript: 'do not persist',
          sessionToken: 'secret',
        },
      })
    );

    await expect(response.json()).resolves.toEqual({ success: true, recorded: true });
    expect(logBetaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'guest_migration_attempted',
        targetUserId: 'user-1',
        targetEmail: 'person@example.com',
        metadata: expect.objectContaining({
          source: 'try',
          success: true,
          migratedMessages: 10,
        }),
      })
    );
  });

  it('rejects unsupported event types', async () => {
    const response = await POST(request({ eventType: 'raw_email_logged' }));

    await expect(response.json()).resolves.toEqual({
      error: 'Unsupported beta event type',
    });
    expect(response.status).toBe(400);
  });
});
