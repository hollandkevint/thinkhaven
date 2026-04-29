import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  approveBetaAccessRecord,
  BetaAccessNotFoundError,
} from '@/lib/beta/beta-admin';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  logBetaEvent: vi.fn().mockResolvedValue(true),
}));

function mockUpdateResult(result: unknown) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };

  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn(() => query),
  } as unknown as NonNullable<ReturnType<typeof createAdminClient>>);

  return query;
}

describe('beta admin service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws a not-found error when an approve update matches no beta record', async () => {
    mockUpdateResult({ data: null, error: null });

    await expect(
      approveBetaAccessRecord('missing-record', {
        id: 'admin-user',
        email: 'kholland7@gmail.com',
      })
    ).rejects.toBeInstanceOf(BetaAccessNotFoundError);
  });
});
