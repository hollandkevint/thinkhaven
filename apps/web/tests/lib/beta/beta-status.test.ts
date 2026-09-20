import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDatabasePool } from '@/lib/db/pool';
import { getUserBetaAccessStatus } from '@/lib/beta/beta-status';

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}));

const query = vi.fn();

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
  last_invited_at: '2026-09-19T12:01:00.000Z',
  invite_copied_at: null,
  invite_count: 1,
  last_gate_at: null,
  last_gate_status: null,
  first_access_at: null,
  last_access_at: null,
};

describe('getUserBetaAccessStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never);
    query.mockResolvedValue({ rows: [] });
  });

  it('uses a parameterized Railway lookup and derives the invited state', async () => {
    query.mockResolvedValueOnce({ rows: [record] });

    await expect(
      getUserBetaAccessStatus({ id: 'user-1', email: 'Person@Example.com' }),
    ).resolves.toMatchObject({
      status: 'invited',
      record,
      unavailable: false,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('where "user_id" = $1'),
      ['user-1'],
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('falls back to the normalized email when the user id is not linked', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [{ ...record, user_id: null }],
    });

    await expect(
      getUserBetaAccessStatus({ id: 'user-2', email: ' Person@Example.com ' }),
    ).resolves.toMatchObject({
      status: 'invited',
      record: { user_id: null },
      unavailable: false,
    });
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining('where "email" = $1'),
      ['person@example.com'],
    );
  });

  it('reports the Railway service as unavailable on database errors', async () => {
    query.mockRejectedValue(new Error('database unavailable'));

    await expect(
      getUserBetaAccessStatus({ id: 'user-1', email: 'person@example.com' }),
    ).resolves.toEqual({
      status: 'missing',
      record: null,
      unavailable: true,
    });
  });
});
