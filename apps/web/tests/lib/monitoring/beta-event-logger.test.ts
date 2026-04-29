import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getBetaEventCounts,
  logBetaEvent,
  recordBetaGateEvaluation,
} from '@/lib/monitoring/beta-event-logger';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

const insert = vi.fn();
const select = vi.fn();
const gte = vi.fn();
const from = vi.fn();

describe('beta event logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    gte.mockResolvedValue({ data: [], error: null });
    select.mockReturnValue({ gte });
    from.mockReturnValue({ insert, select });
    vi.mocked(createAdminClient).mockReturnValue(
      { from } as unknown as NonNullable<ReturnType<typeof createAdminClient>>
    );
  });

  it('persists sanitized durable beta events', async () => {
    await expect(
      logBetaEvent({
        eventType: 'invite_copied',
        actorUserId: 'admin-1',
        targetUserId: 'user-1',
        betaAccessId: 'beta-1',
        targetEmail: 'Person@Example.com',
        requestPath: '/api/admin/beta-access/beta-1/invite',
        metadata: {
          destination: '/try',
          accessToken: 'secret',
          nested: { unsafe: true },
        },
      })
    ).resolves.toBe(true);

    expect(from).toHaveBeenCalledWith('beta_auth_events');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'invite_copied',
        actor_user_id: 'admin-1',
        target_user_id: 'user-1',
        beta_access_id: 'beta-1',
        request_path: '/api/admin/beta-access/beta-1/invite',
        metadata: { destination: '/try' },
      })
    );
    expect(insert.mock.calls[0][0].target_email_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is non-fatal when the admin client is unavailable', async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);

    await expect(logBetaEvent({ eventType: 'waitlist_joined' })).resolves.toBe(false);
  });

  it('aggregates beta event counts for admin monitoring', async () => {
    gte.mockResolvedValue({
      data: [
        { event_type: 'invite_copied' },
        { event_type: 'invite_copied' },
        { event_type: 'beta_gate_pending' },
      ],
      error: null,
    });

    await expect(getBetaEventCounts(60_000)).resolves.toEqual({
      invite_copied: 2,
      beta_gate_pending: 1,
    });
  });

  it('records gate state and first approved app access', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'beta-1',
        email: 'person@example.com',
        first_access_at: null,
      },
      error: null,
    });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));
    const betaSelectEq = vi.fn(() => ({ maybeSingle }));
    const betaSelect = vi.fn(() => ({ eq: betaSelectEq }));
    const gateInsert = vi.fn().mockResolvedValue({ error: null });
    const gateFrom = vi.fn((table: string) => {
      if (table === 'beta_access') {
        return { select: betaSelect, update };
      }

      return { insert: gateInsert };
    });
    vi.mocked(createAdminClient).mockReturnValue(
      { from: gateFrom } as unknown as NonNullable<ReturnType<typeof createAdminClient>>
    );

    await expect(
      recordBetaGateEvaluation({
        userId: 'user-1',
        email: 'person@example.com',
        status: 'approved',
      })
    ).resolves.toBe(true);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_gate_status: 'approved',
        first_access_at: expect.any(String),
      })
    );
    expect(updateEq).toHaveBeenCalledWith('id', 'beta-1');
    expect(gateInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'beta_gate_approved' })
    );
    expect(gateInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'first_app_access' })
    );
  });
});
