import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/supabase-readiness/route';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import { checkSupabaseReadiness } from '@/lib/beta/supabase-readiness';

vi.mock('@/lib/beta/beta-admin-auth', () => ({
  requireBetaAdmin: vi.fn(),
}));

vi.mock('@/lib/beta/supabase-readiness', () => ({
  checkSupabaseReadiness: vi.fn(),
}));

describe('admin Supabase readiness API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireBetaAdmin).mockResolvedValue({
      ok: true,
      actor: { id: 'admin-1', email: 'kholland7@gmail.com' },
    });
    vi.mocked(checkSupabaseReadiness).mockResolvedValue({
      status: 'warn',
      checkedAt: '2026-04-28T12:00:00.000Z',
      checks: [{ id: 'custom-token-hook', label: 'Hook', status: 'warn', detail: 'Verify' }],
    });
  });

  it('returns readiness reports to admins', async () => {
    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      status: 'warn',
      checks: [{ id: 'custom-token-hook' }],
    });
  });

  it('blocks non-admin callers before running checks', async () => {
    vi.mocked(requireBetaAdmin).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(response.status).toBe(403);
    expect(checkSupabaseReadiness).not.toHaveBeenCalled();
  });
});
