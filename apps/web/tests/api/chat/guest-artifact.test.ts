import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/chat/guest/artifact/route';
import { claudeClient } from '@/lib/ai/claude-client';

vi.mock('@/lib/ai/claude-client', () => ({
  claudeClient: {
    complete: vi.fn(),
  },
}));

function request(body: unknown) {
  return new Request('http://test.local/api/chat/guest/artifact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

describe('guest decision-record synthesis API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an empty transcript', async () => {
    const res = await POST(request({ transcript: [] }));
    expect(res.status).toBe(400);
  });

  it('rejects a transcript with no user messages', async () => {
    const res = await POST(request({ transcript: [{ role: 'assistant', content: 'Hello' }] }));
    expect(res.status).toBe(400);
  });

  it('synthesizes a decision record and derives the title from the H1', async () => {
    vi.mocked(claudeClient.complete).mockResolvedValue(
      '# Pivot to mid-market\n\n> Leaning toward mid-market.\n\n## Resolved Decisions\n- Target mid-market\n\n## Open Questions\n- Pricing?'
    );

    const res = await POST(request({
      transcript: [
        { role: 'user', content: 'Should we pivot to mid-market?' },
        { role: 'assistant', content: 'What breaks if you do?' },
        { role: 'user', content: 'Sales cycle shortens.' },
      ],
      pathway: 'plan-grill',
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Pivot to mid-market');
    expect(body.content).toContain('## Resolved Decisions');
    expect(claudeClient.complete).toHaveBeenCalledOnce();
  });

  it('falls back to a default title when no H1 is present', async () => {
    vi.mocked(claudeClient.complete).mockResolvedValue('## Resolved Decisions\n- None surfaced yet.');

    const res = await POST(request({
      transcript: [{ role: 'user', content: 'A vague idea' }],
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Decision Record');
  });
});
