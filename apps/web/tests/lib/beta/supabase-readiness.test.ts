import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDatabasePool } from '@/lib/db/pool';
import { checkRailwayReadiness } from '@/lib/beta/supabase-readiness';

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}));

const query = vi.fn();

describe('checkRailwayReadiness', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://test',
    };
    query.mockResolvedValue({ rows: [] });
    vi.mocked(getDatabasePool).mockReturnValue({ query } as never);
  });

  it('passes the database and beta table checks when Railway is ready', async () => {
    const report = await checkRailwayReadiness();

    expect(report.status).toBe('pass');
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'database-env', status: 'pass' }),
        expect.objectContaining({ id: 'database-connection', status: 'pass' }),
        expect.objectContaining({ id: 'beta-table-shape', status: 'pass' }),
        expect.objectContaining({ id: 'event-table-shape', status: 'pass' }),
      ])
    );
    expect(query).toHaveBeenCalledWith('select 1');
  });

  it('fails closed when the Railway database configuration is missing', async () => {
    delete process.env.DATABASE_URL;

    const report = await checkRailwayReadiness();

    expect(report.status).toBe('fail');
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'database-env', status: 'fail' }),
        expect.objectContaining({ id: 'database-connection', status: 'fail' }),
        expect.objectContaining({ id: 'beta-table-shape', status: 'fail' }),
      ])
    );
    expect(getDatabasePool).not.toHaveBeenCalled();
  });

  it('does not probe beta tables after the database health query fails', async () => {
    query.mockRejectedValueOnce(new Error('offline'));

    const report = await checkRailwayReadiness();

    expect(report.status).toBe('fail');
    expect(query).toHaveBeenCalledTimes(1);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'database-connection', status: 'fail' }),
        expect.objectContaining({ id: 'beta-table-shape', status: 'fail' }),
        expect.objectContaining({ id: 'event-table-shape', status: 'fail' }),
      ])
    );
  });
});
