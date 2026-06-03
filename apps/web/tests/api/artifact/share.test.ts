import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/artifact/share/route';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

function request(body: unknown) {
  return new Request('http://test.local/api/artifact/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

function adminWithInsert(result: { error: unknown }) {
  const insert = vi.fn().mockResolvedValue(result);
  return {
    client: { from: vi.fn(() => ({ insert })) } as never,
    insert,
  };
}

describe('artifact share API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an empty artifact', async () => {
    const res = await POST(request({ title: 'X', content: '   ', source: 'guest' }));
    expect(res.status).toBe(400);
  });

  it('rejects an oversized artifact', async () => {
    const res = await POST(request({ content: 'a'.repeat(50001), source: 'guest' }));
    expect(res.status).toBe(413);
  });

  it('returns 503 when the admin client is unavailable', async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);
    const res = await POST(request({ content: '# Decision\n- ok', source: 'guest' }));
    expect(res.status).toBe(503);
  });

  it('creates a public artifact and returns a /share token URL', async () => {
    const { client, insert } = adminWithInsert({ error: null });
    vi.mocked(createAdminClient).mockReturnValue(client);

    const res = await POST(request({
      title: 'Pivot to mid-market',
      content: '# Pivot\n\n## Resolved Decisions\n- Focus mid-market',
      pathway: 'plan-grill',
      source: 'guest',
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^\/share\/[A-Za-z0-9_-]+$/);
    expect(body.absoluteUrl).toMatch(/^https?:\/\/.+\/share\/.+$/);
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Pivot to mid-market',
      source: 'guest',
      pathway: 'plan-grill',
    }));
  });

  it('coerces an unknown source to guest', async () => {
    const { client, insert } = adminWithInsert({ error: null });
    vi.mocked(createAdminClient).mockReturnValue(client);

    await POST(request({ content: '# D', source: 'totally-made-up' }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ source: 'guest' }));
  });

  it('reuses an existing token without inserting a new row', async () => {
    const { client, insert } = adminWithInsert({ error: null });
    vi.mocked(createAdminClient).mockReturnValue(client);

    const token = 'a'.repeat(22);
    const res = await POST(request({ content: '# D', source: 'guest', token }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe(token);
    expect(insert).not.toHaveBeenCalled();
  });

  it('drops a malformed email rather than storing it', async () => {
    const { client, insert } = adminWithInsert({ error: null });
    vi.mocked(createAdminClient).mockReturnValue(client);

    await POST(request({ content: '# D', source: 'guest', email: 'not-an-email' }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email: null }));
  });
});
