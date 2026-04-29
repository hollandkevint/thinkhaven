import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BetaAccessControlCenter from '@/app/components/admin/BetaAccessControlCenter';
import type { BetaAccessSummary } from '@/lib/beta/beta-access-types';

const pendingRecord: BetaAccessSummary = {
  id: 'pending-row',
  user_id: null,
  email: 'pending@example.com',
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
  signedUp: false,
  invited: false,
};

const approvedRecord: BetaAccessSummary = {
  ...pendingRecord,
  id: 'approved-row',
  user_id: 'user-1',
  email: 'approved@example.com',
  approved_at: '2026-04-28T13:00:00.000Z',
  status: 'approved',
  signedUp: true,
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

describe('BetaAccessControlCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/admin/beta-access') {
          return jsonResponse({ records: [pendingRecord, approvedRecord] });
        }

        if (url === '/api/admin/supabase-readiness') {
          return jsonResponse({
            status: 'warn',
            checkedAt: '2026-04-28T12:00:00.000Z',
            checks: [
              {
                id: 'public-env',
                label: 'Public Supabase env',
                status: 'pass',
                detail: 'Configured',
              },
              {
                id: 'custom-token-hook',
                label: 'Custom access-token hook',
                status: 'warn',
                detail: 'Verify in Supabase Dashboard',
              },
            ],
          });
        }

        if (url === '/api/admin/beta-access/pending-row' && init?.method === 'PATCH') {
          return jsonResponse({
            record: {
              ...pendingRecord,
              approved_at: '2026-04-28T14:00:00.000Z',
              status: 'approved',
            },
          });
        }

        if (url === '/api/admin/beta-access/approved-row/invite' && init?.method === 'POST') {
          return jsonResponse({
            record: {
              ...approvedRecord,
              invited: true,
              invite_copied_at: '2026-04-28T15:00:00.000Z',
              invite_count: 1,
            },
            inviteUrl: 'https://thinkhaven.co/try?beta_invite=approved-row&source=beta_invite',
          });
        }

        return jsonResponse({ error: 'not found' }, 404);
      })
    );
  });

  it('loads beta rows and exposes operational counts', async () => {
    render(<BetaAccessControlCenter />);

    await expect(screen.findByText('pending@example.com')).resolves.toBeInTheDocument();
    expect(screen.getByText('approved@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
  });

  it('filters rows by search text', async () => {
    render(<BetaAccessControlCenter />);

    await screen.findByText('pending@example.com');
    fireEvent.change(screen.getByLabelText('Search beta users'), {
      target: { value: 'approved' },
    });

    expect(screen.queryByText('pending@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('approved@example.com')).toBeInTheDocument();
  });

  it('approves a pending row and updates local state', async () => {
    render(<BetaAccessControlCenter />);

    await screen.findByText('pending@example.com');
    fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/beta-access/pending-row',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'approve' }),
        })
      );
    });
  });

  it('copies an invite link and records invite state', async () => {
    render(<BetaAccessControlCenter />);

    await screen.findByText('approved@example.com');
    fireEvent.click(screen.getByRole('button', { name: /^Invite$/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://thinkhaven.co/try?beta_invite=approved-row&source=beta_invite'
      );
    });
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('shows a retryable error state without rendering stale rows as fresh', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    );

    render(<BetaAccessControlCenter />);

    await expect(screen.findByText(/Beta access load failed/)).resolves.toBeInTheDocument();
    expect(screen.queryByText('pending@example.com')).not.toBeInTheDocument();
  });
});
