import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDatabasePool } from '@/lib/db/pool';
import {
  approveBetaAccessRecord,
  BetaAccessNotFoundError,
  BetaAdminUnavailableError,
  listBetaAccessRecords,
} from '@/lib/beta/beta-admin';

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  logBetaEvent: vi.fn().mockResolvedValue(true),
}));

const query = vi.fn();

describe('beta admin service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never);
  });

  it('throws a not-found error when an approve update matches no beta record', async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(
      approveBetaAccessRecord('missing-record', {
        id: 'admin-user',
        email: 'kholland7@gmail.com',
      })
    ).rejects.toBeInstanceOf(BetaAccessNotFoundError);
  });

  it('lists records with a parameterized Railway database query', async () => {
    query.mockResolvedValue({
      rows: [{
        id: 'beta-1',
        user_id: null,
        email: 'person@example.com',
        created_at: '2026-09-19T12:00:00.000Z',
        approved_at: null,
        approved_by: null,
        source: 'landing_page',
        revoked_at: null,
        revoked_by: null,
        last_invited_at: null,
        invite_copied_at: null,
        invite_count: 0,
        last_gate_at: null,
        last_gate_status: null,
        first_access_at: null,
        last_access_at: null,
      }],
    });

    await expect(listBetaAccessRecords()).resolves.toMatchObject([
      { id: 'beta-1', status: 'pending', signedUp: false, invited: false },
    ]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('order by "created_at" desc'),
    );
  });

  it('approves a record with parameterized Railway updates', async () => {
    const record = {
      id: 'beta-1',
      user_id: 'user-1',
      email: 'person@example.com',
      created_at: '2026-09-19T12:00:00.000Z',
      approved_at: null,
      approved_by: null,
      source: 'landing_page',
      revoked_at: null,
      revoked_by: null,
      last_invited_at: null,
      invite_copied_at: null,
      invite_count: 0,
      last_gate_at: null,
      last_gate_status: null,
      first_access_at: null,
      last_access_at: null,
    };
    query
      .mockResolvedValueOnce({ rows: [record] })
      .mockResolvedValueOnce({
        rows: [{ ...record, approved_at: '2026-09-19T12:01:00.000Z', approved_by: 'admin@example.com' }],
      });

    await expect(
      approveBetaAccessRecord('beta-1', { id: 'admin-1', email: 'admin@example.com' }),
    ).resolves.toMatchObject({ id: 'beta-1', status: 'approved' });
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('update "public"."beta_access"'),
      [expect.any(String), 'admin@example.com', null, null, 'beta-1'],
    );
  });

  it('maps missing Railway database configuration to the unavailable error', async () => {
    vi.mocked(getDatabasePool).mockImplementation(() => {
      throw new Error('DATABASE_URL is missing');
    });

    await expect(listBetaAccessRecords()).rejects.toBeInstanceOf(
      BetaAdminUnavailableError,
    );
  });
});
