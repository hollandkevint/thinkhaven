import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkSupabaseReadiness } from '@/lib/beta/supabase-readiness';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

function adminQuery(error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data: [], error });
  const select = vi.fn(() => ({ limit }));
  return { select, limit };
}

describe('checkSupabaseReadiness', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
    };

    vi.mocked(createClient).mockResolvedValue({} as any);
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => adminQuery()),
    } as any);
  });

  it('passes required environment and table shape checks when Supabase is ready', async () => {
    const report = await checkSupabaseReadiness();

    expect(report.status).toBe('warn');
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'public-env', status: 'pass' }),
        expect.objectContaining({ id: 'service-role-env', status: 'pass' }),
        expect.objectContaining({ id: 'server-client', status: 'pass' }),
        expect.objectContaining({ id: 'admin-client', status: 'pass' }),
        expect.objectContaining({ id: 'custom-token-hook', status: 'warn' }),
      ])
    );
  });

  it('fails closed when service-role configuration is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.mocked(createAdminClient).mockReturnValue(null);

    const report = await checkSupabaseReadiness();

    expect(report.status).toBe('fail');
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'service-role-env', status: 'fail' }),
        expect.objectContaining({ id: 'admin-client', status: 'fail' }),
      ])
    );
  });
});
