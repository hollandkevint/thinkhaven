import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {} })),
}));

describe('createAdminClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('can be imported without service-role env and returns null lazily', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    const { createClient } = await import('@supabase/supabase-js');
    const { createAdminClient } = await import('@/lib/supabase/admin');

    expect(createAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
