import { afterEach, describe, expect, it, vi } from 'vitest';

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  vi.resetModules();
  if (originalUrl) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (originalAnonKey) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
});

describe('Supabase browser client fallback', () => {
  it('returns a no-op auth object when public env vars are absent', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    vi.resetModules();

    const { supabase } = await import('@/lib/supabase/client');

    await expect(supabase.auth.getSession()).resolves.toEqual({
      data: { session: null },
      error: null,
    });
    expect(() => supabase.auth.onAuthStateChange(() => {})).not.toThrow();
  });
});
