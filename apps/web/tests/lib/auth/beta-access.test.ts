import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { checkBetaAccess } from '@/lib/auth/beta-access';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring/beta-event-logger', () => ({
  recordBetaGateEvaluation: vi.fn().mockResolvedValue(true),
}));

const mockGetClaims = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
  auth: {
    getClaims: mockGetClaims,
    getUser: mockGetUser,
  },
  from: mockFrom,
};

function mockBetaLookup(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };

  mockFrom.mockReturnValue(query);
  return query;
}

describe('checkBetaAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
    );
    mockGetClaims.mockResolvedValue({ data: null, error: null });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockBetaLookup({ data: null, error: null });
  });

  it('returns unavailable when the Supabase server client cannot be created', async () => {
    vi.mocked(createClient).mockResolvedValue(null);

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: null,
      betaApproved: false,
      status: 'unavailable',
      isAdmin: false,
      error: 'No Supabase client',
    });
  });

  it('approves a user with a validated beta_approved claim after checking revocation state', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-1',
          email: 'approved@example.com',
          beta_approved: true,
        },
      },
      error: null,
    });
    const query = mockBetaLookup({ data: null, error: null });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-1', email: 'approved@example.com' },
      betaApproved: true,
      status: 'approved',
      isAdmin: false,
      error: null,
    });
    expect(mockFrom).toHaveBeenCalledWith('beta_access');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('approves an admin email without requiring a beta row', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'admin-1',
          email: 'kholland7@gmail.com',
          beta_approved: false,
        },
      },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'admin-1', email: 'kholland7@gmail.com' },
      betaApproved: true,
      status: 'admin',
      isAdmin: true,
      error: null,
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('uses the beta_access table fallback when a validated claim is stale', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-2',
          email: 'stale@example.com',
          beta_approved: false,
        },
      },
      error: null,
    });
    const query = mockBetaLookup({
      data: { approved_at: '2026-04-28T12:00:00.000Z' },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-2', email: 'stale@example.com' },
      betaApproved: true,
      status: 'approved',
      error: null,
    });
    expect(mockFrom).toHaveBeenCalledWith('beta_access');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-2');
  });

  it('returns pending when an authenticated user has no approved beta row', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-3',
          email: 'pending@example.com',
          beta_approved: false,
        },
      },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-3', email: 'pending@example.com' },
      betaApproved: false,
      status: 'pending',
      error: null,
    });
  });

  it('does not approve a revoked user with historical approval', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-5',
          email: 'revoked@example.com',
          beta_approved: false,
        },
      },
      error: null,
    });
    mockBetaLookup({
      data: {
        approved_at: '2026-04-28T12:00:00.000Z',
        revoked_at: '2026-04-28T13:00:00.000Z',
      },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-5', email: 'revoked@example.com' },
      betaApproved: false,
      status: 'revoked',
      error: null,
    });
  });

  it('does not approve a revoked user with a stale approved claim', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-6',
          email: 'stale-revoked@example.com',
          beta_approved: true,
        },
      },
      error: null,
    });
    mockBetaLookup({
      data: {
        approved_at: '2026-04-28T12:00:00.000Z',
        revoked_at: '2026-04-28T13:00:00.000Z',
      },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-6', email: 'stale-revoked@example.com' },
      betaApproved: false,
      status: 'revoked',
      error: null,
    });
  });

  it('returns unavailable when beta access state cannot be checked', async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'user-7',
          email: 'lookup-error@example.com',
          beta_approved: true,
        },
      },
      error: null,
    });
    mockBetaLookup({
      data: null,
      error: new Error('database unavailable'),
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-7', email: 'lookup-error@example.com' },
      betaApproved: false,
      status: 'unavailable',
      error: 'Beta access lookup failed',
    });
  });

  it('falls back to getUser when getClaims is unavailable', async () => {
    mockGetClaims.mockResolvedValue({ data: null, error: new Error('claims unavailable') });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-4',
          email: 'fallback@example.com',
          app_metadata: { beta_approved: true },
        },
      },
      error: null,
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: { id: 'user-4', email: 'fallback@example.com' },
      betaApproved: true,
      status: 'approved',
      error: null,
    });
  });

  it('returns unauthenticated for invalid or missing auth state', async () => {
    mockGetClaims.mockResolvedValue({ data: null, error: new Error('invalid token') });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('invalid token'),
    });

    await expect(checkBetaAccess()).resolves.toMatchObject({
      user: null,
      betaApproved: false,
      status: 'unauthenticated',
      isAdmin: false,
      error: 'No authenticated user',
    });
  });
});
