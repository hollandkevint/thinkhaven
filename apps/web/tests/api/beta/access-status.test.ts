import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import { GET } from '@/app/api/beta/access-status/route';

vi.mock('@/lib/auth/beta-access', () => ({
  checkBetaAccess: vi.fn(),
}));

describe('beta access status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the approved redirect contract for approved users', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: { id: 'user-1', email: 'approved@example.com' },
      betaApproved: true,
      status: 'approved',
      isAdmin: false,
      error: null,
    });

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      status: 'approved',
      betaApproved: true,
      redirectTo: '/app',
    });
    expect(checkBetaAccess).toHaveBeenCalledWith({ recordGate: false });
  });

  it('returns the waitlist redirect contract for pending users', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: { id: 'user-2', email: 'pending@example.com' },
      betaApproved: false,
      status: 'pending',
      isAdmin: false,
      error: null,
    });

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      status: 'pending',
      betaApproved: false,
      redirectTo: '/waitlist',
    });
  });

  it('requires authentication', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      isAdmin: false,
      error: 'No authenticated user',
    });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(response.status).toBe(401);
  });

  it('fails closed when beta access is unavailable', async () => {
    vi.mocked(checkBetaAccess).mockResolvedValue({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      isAdmin: false,
      error: 'No Supabase client',
    });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      error: 'Beta access service unavailable',
    });
    expect(response.status).toBe(503);
  });
});
