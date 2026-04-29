import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import {
  BetaAdminUnavailableError,
  approveBetaAccessRecord,
  createBetaInvite,
  listBetaAccessRecords,
  revokeBetaAccessRecord,
} from '@/lib/beta/beta-admin';
import type { BetaAccessSummary } from '@/lib/beta/beta-access-types';
import { GET } from '@/app/api/admin/beta-access/route';
import { PATCH } from '@/app/api/admin/beta-access/[id]/route';
import { POST as POSTInvite } from '@/app/api/admin/beta-access/[id]/invite/route';

vi.mock('@/lib/beta/beta-admin-auth', () => ({
  requireBetaAdmin: vi.fn(),
}));

vi.mock('@/lib/beta/beta-admin', () => {
  class BetaAdminUnavailableError extends Error {
    constructor() {
      super('Supabase admin client unavailable');
      this.name = 'BetaAdminUnavailableError';
    }
  }

  class BetaAccessNotFoundError extends Error {
    constructor(id: string) {
      super(`Beta access record not found: ${id}`);
      this.name = 'BetaAccessNotFoundError';
    }
  }

  return {
    BetaAdminUnavailableError,
    BetaAccessNotFoundError,
    listBetaAccessRecords: vi.fn(),
    approveBetaAccessRecord: vi.fn(),
    revokeBetaAccessRecord: vi.fn(),
    createBetaInvite: vi.fn(),
  };
});

const adminActor = { id: 'admin-user', email: 'kholland7@gmail.com' };

function mockAdmin() {
  vi.mocked(requireBetaAdmin).mockResolvedValue({
    ok: true,
    actor: adminActor,
  });
}

function mockForbidden() {
  vi.mocked(requireBetaAdmin).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  });
}

function routeContext(id = 'beta-row-1') {
  return { params: Promise.resolve({ id }) };
}

function request(body: unknown): NextRequest {
  return new Request('http://test.local/api/admin/beta-access/beta-row-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function betaSummary(overrides: Partial<BetaAccessSummary>): BetaAccessSummary {
  return {
    id: 'beta-row-1',
    user_id: 'user-1',
    email: 'person@example.com',
    created_at: '2026-04-28T12:00:00.000Z',
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
    status: 'pending',
    signedUp: true,
    invited: false,
    ...overrides,
  };
}

describe('admin beta access API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin();
  });

  it('lists beta records for admins', async () => {
    vi.mocked(listBetaAccessRecords).mockResolvedValue([
      betaSummary({ status: 'pending' }),
    ]);

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      records: [{ id: 'beta-row-1', status: 'pending' }],
    });
    expect(response.status).toBe(200);
  });

  it('blocks non-admin callers before listing records', async () => {
    mockForbidden();

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(response.status).toBe(403);
    expect(listBetaAccessRecords).not.toHaveBeenCalled();
  });

  it('approves and revokes beta access records through guarded mutations', async () => {
    vi.mocked(approveBetaAccessRecord).mockResolvedValue(betaSummary({ status: 'approved' }));
    vi.mocked(revokeBetaAccessRecord).mockResolvedValue(betaSummary({ status: 'revoked' }));

    const approveResponse = await PATCH(
      request({ action: 'approve' }),
      routeContext()
    );
    const revokeResponse = await PATCH(
      request({ action: 'revoke' }),
      routeContext()
    );

    await expect(approveResponse.json()).resolves.toMatchObject({
      record: { id: 'beta-row-1', status: 'approved' },
    });
    await expect(revokeResponse.json()).resolves.toMatchObject({
      record: { id: 'beta-row-1', status: 'revoked' },
    });
    expect(approveBetaAccessRecord).toHaveBeenCalledWith('beta-row-1', adminActor);
    expect(revokeBetaAccessRecord).toHaveBeenCalledWith('beta-row-1', adminActor);
  });

  it('rejects unsupported mutation actions', async () => {
    const response = await PATCH(
      request({ action: 'delete' }),
      routeContext()
    );

    await expect(response.json()).resolves.toEqual({
      error: 'Unsupported beta access action',
    });
    expect(response.status).toBe(400);
  });

  it('creates invite links and records invite state for admins', async () => {
    vi.mocked(createBetaInvite).mockResolvedValue({
      record: betaSummary({ status: 'approved', invited: true }),
      inviteUrl: 'https://thinkhaven.co/try?beta_invite=beta-row-1&source=beta_invite',
    });

    const response = await POSTInvite(
      new Request('http://test.local/api/admin/beta-access/beta-row-1/invite', {
        method: 'POST',
      }),
      routeContext()
    );

    await expect(response.json()).resolves.toMatchObject({
      record: { id: 'beta-row-1', invited: true },
      inviteUrl: expect.stringContaining('/try?beta_invite=beta-row-1'),
    });
    expect(createBetaInvite).toHaveBeenCalledWith('beta-row-1', adminActor);
  });

  it('returns service unavailable when the service-role boundary is unavailable', async () => {
    vi.mocked(listBetaAccessRecords).mockRejectedValue(new BetaAdminUnavailableError());

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      error: 'Beta admin service unavailable',
    });
    expect(response.status).toBe(503);
  });

});
