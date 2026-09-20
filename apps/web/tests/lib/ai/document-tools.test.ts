import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateDocument } from '@/lib/ai/tools/document-tools';

const mocks = vi.hoisted(() => ({
  getDatabasePool: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: mocks.getDatabasePool,
}));

function buildPoolMock() {
  mocks.query
    .mockResolvedValueOnce({ rows: [{ pathway: 'plan-grill', current_phase: 'intake' }] })
    .mockResolvedValueOnce({
      rows: [
        {
          output_data: {
            insight: 'Use Customer for the buyer and User for the authenticated identity.',
            category: 'domain',
          },
          phase_id: 'intake',
          output_name: 'Session Insight',
        },
        {
          output_data: {
            insight: 'Use pasted docs only; no repo ingestion in V1.',
            category: 'decision',
          },
          phase_id: 'intake',
          output_name: 'Session Insight',
        },
        {
          output_data: {
            insight: 'Users will paste enough context to make terminology checks useful.',
            category: 'assumption',
          },
          phase_id: 'intake',
          output_name: 'Session Insight',
        },
      ],
    })
    .mockResolvedValueOnce({ rows: [{ id: 'document-123' }] });

  return { query: mocks.query };
}

function sectionContent(content: string, heading: string): string {
  const start = content.indexOf(`## ${heading}`);
  if (start === -1) return '';

  const next = content.indexOf('\n## ', start + heading.length + 4);
  return content.slice(start, next === -1 ? undefined : next);
}

describe('generateDocument', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.getDatabasePool.mockReturnValue(buildPoolMock());
  });

  it('generates a domain context document from domain insights', async () => {
    const result = await generateDocument('session-123', 'user-123', {
      document_type: 'domain_context',
      title: 'Plan Glossary',
    });

    expect(result.success).toBe(true);
    const documentInsert = mocks.query.mock.calls[2];
    expect(documentInsert[1]).toEqual([
      'session-123',
      'Plan Glossary',
      'domain_context',
      expect.any(String),
      'user-123',
    ]);
    expect(documentInsert[0]).toContain('bmad_generated_documents');
    expect(documentInsert[0]).not.toContain('session_artifacts');
    expect(result.data?.artifact?.type).toBe('domain-context');
    const content = result.data?.artifact?.content || '';
    expect(content).toContain('# Domain Context');
    expect(content).toContain('## Language');
    expect(content).toContain('## Flagged Ambiguities');
    expect(sectionContent(content, 'Language')).toContain('Use Customer for the buyer');
    expect(sectionContent(content, 'Flagged Ambiguities')).toContain('Users will paste enough context');
    expect(sectionContent(content, 'Flagged Ambiguities')).not.toContain('Use pasted docs only');
  });

  it('generates a decision record document from decision and assumption insights', async () => {
    const result = await generateDocument('session-123', 'user-123', {
      document_type: 'decision_record',
      title: 'Plan Decisions',
    });

    expect(result.success).toBe(true);
    const documentInsert = mocks.query.mock.calls[2];
    expect(documentInsert[1]).toEqual([
      'session-123',
      'Plan Decisions',
      'decision_record',
      expect.any(String),
      'user-123',
    ]);
    expect(documentInsert[0]).toContain('bmad_generated_documents');
    expect(documentInsert[0]).not.toContain('session_artifacts');
    expect(result.data?.artifact?.type).toBe('decision-record');
    const content = result.data?.artifact?.content || '';
    expect(content).toContain('# Decision Record');
    expect(content).toContain('## Resolved Decisions');
    expect(content).toContain('## ADR-Worthy Decisions');
    expect(sectionContent(content, 'Resolved Decisions')).toContain('Use pasted docs only');
    expect(sectionContent(content, 'Assumptions')).toContain('Users will paste enough context');
    expect(sectionContent(content, 'Risks')).toContain('*No insights captured yet for this section.*');
  });
});
