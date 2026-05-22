import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateDocument } from '@/lib/ai/tools/document-tools';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  insertedDocuments: [] as Record<string, unknown>[],
  insertedArtifacts: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

function buildSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'bmad_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { pathway: 'plan-grill', current_phase: 'intake' },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'bmad_phase_outputs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
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
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'bmad_generated_documents') {
        return {
          insert: vi.fn((document: Record<string, unknown>) => {
            mocks.insertedDocuments.push(document);
            return {
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'document-123' },
                  error: null,
                })),
              })),
            };
          }),
        };
      }

      if (table === 'session_artifacts') {
        return {
          insert: vi.fn((artifact: Record<string, unknown>) => {
            mocks.insertedArtifacts.push(artifact);
            return Promise.resolve({ error: null });
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function sectionContent(content: string, heading: string): string {
  const start = content.indexOf(`## ${heading}`);
  if (start === -1) return '';

  const next = content.indexOf('\n## ', start + heading.length + 4);
  return content.slice(start, next === -1 ? undefined : next);
}

describe('generateDocument', () => {
  beforeEach(() => {
    mocks.insertedDocuments.length = 0;
    mocks.insertedArtifacts.length = 0;
    mocks.createClient.mockResolvedValue(buildSupabaseMock());
  });

  it('generates a domain context document from domain insights', async () => {
    const result = await generateDocument('session-123', 'user-123', {
      document_type: 'domain_context',
      title: 'Plan Glossary',
    });

    expect(result.success).toBe(true);
    const document = mocks.insertedDocuments[0];
    const artifact = mocks.insertedArtifacts[0];
    expect(document.document_type).toBe('domain_context');
    expect(artifact).toMatchObject({
      id: 'document-123',
      type: 'domain-context',
      title: 'Plan Glossary',
    });
    expect(result.data?.artifact?.type).toBe('domain-context');
    expect(document.content).toContain('# Domain Context');
    expect(document.content).toContain('## Language');
    expect(document.content).toContain('## Flagged Ambiguities');
    expect(sectionContent(document.content as string, 'Language')).toContain('Use Customer for the buyer');
    expect(sectionContent(document.content as string, 'Flagged Ambiguities')).toContain('Users will paste enough context');
    expect(sectionContent(document.content as string, 'Flagged Ambiguities')).not.toContain('Use pasted docs only');
  });

  it('generates a decision record document from decision and assumption insights', async () => {
    const result = await generateDocument('session-123', 'user-123', {
      document_type: 'decision_record',
      title: 'Plan Decisions',
    });

    expect(result.success).toBe(true);
    const document = mocks.insertedDocuments[0];
    const artifact = mocks.insertedArtifacts[0];
    expect(document.document_type).toBe('decision_record');
    expect(artifact).toMatchObject({
      id: 'document-123',
      type: 'decision-record',
      title: 'Plan Decisions',
    });
    expect(result.data?.artifact?.type).toBe('decision-record');
    expect(document.content).toContain('# Decision Record');
    expect(document.content).toContain('## Resolved Decisions');
    expect(document.content).toContain('## ADR-Worthy Decisions');
    expect(sectionContent(document.content as string, 'Resolved Decisions')).toContain('Use pasted docs only');
    expect(sectionContent(document.content as string, 'Assumptions')).toContain('Users will paste enough context');
    expect(sectionContent(document.content as string, 'Risks')).toContain('*No insights captured yet for this section.*');
  });
});
