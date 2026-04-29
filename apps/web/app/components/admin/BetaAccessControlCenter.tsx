'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, RotateCcw, Search, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  BetaAccessSummary,
  BetaLifecycleStatus,
} from '@/lib/beta/beta-access-types';
import BetaAccessStatusBadge from './BetaAccessStatusBadge';

type Filter = 'all' | BetaLifecycleStatus | 'signed-up' | 'invited';

interface BetaAccessResponse {
  records: BetaAccessSummary[];
}

interface InviteResponse {
  record: BetaAccessSummary;
  inviteUrl: string;
}

interface ReadinessReport {
  status: 'pass' | 'warn' | 'fail';
  checkedAt: string;
  checks: Array<{
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail: string;
  }>;
}

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'signed-up', label: 'Signed up' },
  { value: 'invited', label: 'Invited' },
];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function applyRecordUpdate(
  records: BetaAccessSummary[],
  updated: BetaAccessSummary
) {
  return records.map((record) => (record.id === updated.id ? updated : record));
}

export default function BetaAccessControlCenter() {
  const [records, setRecords] = useState<BetaAccessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/beta-access');

      if (!response.ok) {
        throw new Error(`Beta access load failed (${response.status})`);
      }

      const data = (await response.json()) as BetaAccessResponse;
      setRecords(data.records);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beta access load failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchReadiness = useCallback(async () => {
    const response = await fetch('/api/admin/supabase-readiness');
    if (!response.ok) return;
    setReadiness((await response.json()) as ReadinessReport);
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchReadiness();
  }, [fetchReadiness, fetchRecords]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        record.email.toLowerCase().includes(normalizedQuery) ||
        record.source.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === 'all' ||
        record.status === filter ||
        (filter === 'signed-up' && record.signedUp) ||
        (filter === 'invited' && record.invited);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, records]);

  const counts = useMemo(
    () => ({
      pending: records.filter((record) => record.status === 'pending').length,
      approved: records.filter((record) => record.status === 'approved').length,
      revoked: records.filter((record) => record.status === 'revoked').length,
      invited: records.filter((record) => record.invited).length,
    }),
    [records]
  );

  async function mutateRecord(id: string, action: 'approve' | 'revoke') {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/beta-access/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`${action} failed (${response.status})`);
      }

      const data = (await response.json()) as { record: BetaAccessSummary };
      setRecords((current) => applyRecordUpdate(current, data.record));
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusyId(null);
    }
  }

  async function copyInvite(record: BetaAccessSummary) {
    setBusyId(record.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/beta-access/${record.id}/invite`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`invite failed (${response.status})`);
      }

      const data = (await response.json()) as InviteResponse;
      await navigator.clipboard.writeText(data.inviteUrl);
      setRecords((current) => applyRecordUpdate(current, data.record));
      setCopiedId(record.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'invite failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink-light">
        <RefreshCw className="mr-2 size-4 animate-spin" />
        Loading beta access
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-ink/10 bg-cream p-4">
          <p className="text-xs font-medium text-ink-light">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-mustard">{counts.pending}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-cream p-4">
          <p className="text-xs font-medium text-ink-light">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-forest">{counts.approved}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-cream p-4">
          <p className="text-xs font-medium text-ink-light">Revoked</p>
          <p className="mt-1 text-2xl font-semibold text-rust">{counts.revoked}</p>
        </div>
        <div className="rounded-lg border border-ink/10 bg-cream p-4">
          <p className="text-xs font-medium text-ink-light">Invited</p>
          <p className="mt-1 text-2xl font-semibold text-slate-blue">{counts.invited}</p>
        </div>
      </div>

      {readiness && (
        <div className="rounded-lg border border-ink/10 bg-cream p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Supabase readiness</p>
              <p className="mt-1 text-sm text-ink-light">
                {readiness.checks.filter((check) => check.status === 'pass').length} of{' '}
                {readiness.checks.length} checks passing
              </p>
            </div>
            <BetaAccessStatusBadge
              status={
                readiness.status === 'fail'
                  ? 'revoked'
                  : readiness.status === 'warn'
                    ? 'pending'
                    : 'approved'
              }
            />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {readiness.checks.map((check) => (
              <div key={check.id} className="rounded-md bg-parchment/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{check.label}</p>
                  <span className="text-xs font-medium uppercase text-ink-light">
                    {check.status}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-light">
                  {check.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-ink/10 bg-cream">
        <div className="flex flex-col gap-4 border-b border-ink/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-light" />
            <Input
              aria-label="Search beta users"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email or source"
              className="pl-9 bg-parchment/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-md bg-parchment p-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 ${
                    filter === item.value
                      ? 'bg-cream text-ink shadow-sm'
                      : 'text-ink-light hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                fetchRecords();
                fetchReadiness();
              }}
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="border-b border-rust/20 bg-rust/10 px-4 py-3 text-sm text-rust">
            {error}
          </div>
        )}

        {visibleRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-medium text-ink">No beta users match this view</p>
            <p className="mt-1 text-sm text-ink-light">
              Adjust the filters or refresh after new waitlist requests arrive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-parchment/70 text-left text-xs uppercase tracking-wide text-ink-light">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Invite</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {visibleRecords.map((record) => {
                  const rowBusy = busyId === record.id;
                  return (
                    <tr key={record.id} className="align-middle">
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-ink" title={record.email}>
                          {record.email}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-light">
                          {record.signedUp ? 'Signed up' : 'Email only'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <BetaAccessStatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-light">{record.source}</td>
                      <td className="px-4 py-3 text-ink-light">{formatDate(record.created_at)}</td>
                      <td className="px-4 py-3 text-ink-light">
                        {record.invited ? (
                          <span>{formatDate(record.invite_copied_at || record.last_invited_at)}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {record.status !== 'approved' && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => mutateRecord(record.id, 'approve')}
                              disabled={rowBusy}
                            >
                              <Check />
                              Approve
                            </Button>
                          )}
                          {record.status === 'approved' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => copyInvite(record)}
                              disabled={rowBusy}
                            >
                              <Copy />
                              {copiedId === record.id ? 'Copied' : 'Invite'}
                            </Button>
                          )}
                          {record.status === 'revoked' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => mutateRecord(record.id, 'approve')}
                              disabled={rowBusy}
                            >
                              <RotateCcw />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => mutateRecord(record.id, 'revoke')}
                              disabled={rowBusy || record.status === 'pending'}
                            >
                              <ShieldOff />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
