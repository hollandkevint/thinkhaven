/**
 * Document Generation Tools
 *
 * Implements document generation capabilities for Mary.
 * Generates structured outputs like Lean Canvas, PRD, Feature Brief, etc.
 */

import { createClient } from '@/lib/supabase/server';
import type { GenerateDocumentInput, GenerateDocumentResult } from './index';

// =============================================================================
// Document Templates
// =============================================================================

interface DocumentTemplate {
  type: string;
  name: string;
  sections: string[];
  description: string;
}

const DOCUMENT_ARTIFACT_TYPES: Record<string, string> = {
  domain_context: 'domain-context',
  decision_record: 'decision-record',
};

const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  lean_canvas: {
    type: 'lean_canvas',
    name: 'Lean Canvas',
    sections: [
      'Problem',
      'Customer Segments',
      'Unique Value Proposition',
      'Solution',
      'Channels',
      'Revenue Streams',
      'Cost Structure',
      'Key Metrics',
      'Unfair Advantage',
    ],
    description: 'One-page business model canvas for lean startups',
  },
  business_model_canvas: {
    type: 'business_model_canvas',
    name: 'Business Model Canvas',
    sections: [
      'Key Partners',
      'Key Activities',
      'Key Resources',
      'Value Propositions',
      'Customer Relationships',
      'Channels',
      'Customer Segments',
      'Cost Structure',
      'Revenue Streams',
    ],
    description: 'Strategic management template for business model design',
  },
  prd: {
    type: 'prd',
    name: 'Product Requirements Document',
    sections: [
      'Executive Summary',
      'Problem Statement',
      'Goals & Success Metrics',
      'User Stories',
      'Functional Requirements',
      'Non-Functional Requirements',
      'Technical Considerations',
      'Timeline & Milestones',
      'Risks & Mitigations',
      'Open Questions',
    ],
    description: 'Comprehensive product requirements specification',
  },
  feature_brief: {
    type: 'feature_brief',
    name: 'Feature Brief',
    sections: [
      'Feature Overview',
      'User Problem',
      'Proposed Solution',
      'User Flow',
      'Acceptance Criteria',
      'Technical Notes',
      'Dependencies',
      'Success Metrics',
    ],
    description: 'Focused specification for a single feature',
  },
  concept_document: {
    type: 'concept_document',
    name: 'Concept Document',
    sections: [
      'Concept Overview',
      'Target Audience',
      'Core Value Proposition',
      'Key Differentiators',
      'Market Opportunity',
      'Competitive Landscape',
      'Initial Assumptions',
      'Validation Approach',
      'Next Steps',
    ],
    description: 'High-level concept exploration document',
  },
  domain_context: {
    type: 'domain_context',
    name: 'Domain Context',
    sections: [
      'Language',
      'Relationships',
      'Example Dialogue',
      'Flagged Ambiguities',
    ],
    description: 'Glossary and domain-language context for a plan or project, without implementation details',
  },
  decision_record: {
    type: 'decision_record',
    name: 'Decision Record',
    sections: [
      'Resolved Decisions',
      'Open Questions',
      'Assumptions',
      'Risks',
      'ADR-Worthy Decisions',
      'Recommended Next Action',
    ],
    description: 'Sparse record of resolved decisions, open questions, assumptions, risks, and durable trade-offs',
  },
};

// =============================================================================
// Document Generation
// =============================================================================

/**
 * Generate a structured document based on session insights
 */
export async function generateDocument(
  sessionId: string,
  userId: string,
  input: GenerateDocumentInput
): Promise<GenerateDocumentResult> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: 'Service unavailable' };

    // Get the template
    const template = DOCUMENT_TEMPLATES[input.document_type];
    if (!template) {
      return {
        success: false,
        error: `Unknown document type: ${input.document_type}`,
      };
    }

    // Get session data and insights
    const { data: session, error: sessionError } = await supabase
      .from('bmad_sessions')
      .select('pathway, current_phase')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: `Failed to fetch session: ${sessionError?.message || 'Session not found'}`,
      };
    }

    // Get all insights from the session
    const { data: outputs } = await supabase
      .from('bmad_phase_outputs')
      .select('output_data, phase_id, output_name')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Collect insights by category
    const insights: Record<string, string[]> = {
      market: [],
      product: [],
      competition: [],
      risk: [],
      opportunity: [],
      domain: [],
      decision: [],
      assumption: [],
      general: [],
    };

    outputs?.forEach(output => {
      const data = output.output_data as Record<string, unknown>;
      if (data?.insight && typeof data.insight === 'string') {
        const category = (data.category as string) || 'general';
        if (insights[category]) {
          insights[category].push(data.insight);
        }
      }
    });

    // Determine which sections to include
    const sectionsToInclude = input.sections_to_include?.length
      ? template.sections.filter(s => input.sections_to_include!.includes(s))
      : template.sections;

    // Build document structure
    const documentTitle = input.title || `${template.name} - Session ${sessionId.slice(0, 8)}`;
    const documentContent = buildDocumentContent(template, sectionsToInclude, insights);

    // Store the document
    const { data: documentRow, error: insertError } = await supabase.from('bmad_generated_documents').insert({
      session_id: sessionId,
      document_name: documentTitle,
      document_type: input.document_type,
      content: documentContent,
      format: 'markdown',
    }).select('id').single();

    if (insertError || !documentRow) {
      return {
        success: false,
        error: `Failed to save document: ${insertError?.message || 'No document id returned'}`,
      };
    }

    const artifactType = DOCUMENT_ARTIFACT_TYPES[input.document_type] || 'working-document';
    const { error: artifactError } = await supabase.from('session_artifacts').insert({
      id: documentRow.id,
      session_id: sessionId,
      type: artifactType,
      title: documentTitle,
      content: documentContent,
      metadata: {
        source: 'generate_document',
        document_type: input.document_type,
        generated_document_id: documentRow.id,
      },
      view_mode: 'inline',
      render_mode: 'rendered',
    });

    if (artifactError) {
      return {
        success: false,
        error: `Failed to save document artifact: ${artifactError.message}`,
      };
    }

    // Generate preview (first 500 chars)
    const preview = documentContent.slice(0, 500) + (documentContent.length > 500 ? '...' : '');

    return {
      success: true,
      data: {
        documentType: input.document_type,
        documentId: documentRow.id,
        title: documentTitle,
        preview,
        artifact: {
          type: artifactType,
          title: documentTitle,
          content: documentContent,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build document content from template and insights
 */
function buildDocumentContent(
  template: DocumentTemplate,
  sections: string[],
  insights: Record<string, string[]>
): string {
  const lines: string[] = [];

  lines.push(`# ${template.name}`);
  lines.push('');
  lines.push(`> ${template.description}`);
  lines.push('');
  lines.push(`*Generated: ${new Date().toISOString().split('T')[0]}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Map sections to relevant insight categories
  const sectionInsightMap: Record<string, string[]> = {
    // Lean Canvas / BMC mappings
    'Problem': ['market', 'risk'],
    'Customer Segments': ['market', 'general'],
    'Unique Value Proposition': ['product', 'opportunity'],
    'Solution': ['product', 'general'],
    'Channels': ['market', 'general'],
    'Revenue Streams': ['opportunity', 'general'],
    'Cost Structure': ['risk', 'general'],
    'Key Metrics': ['product', 'general'],
    'Unfair Advantage': ['competition', 'opportunity'],
    'Key Partners': ['general'],
    'Key Activities': ['product', 'general'],
    'Key Resources': ['general'],
    'Value Propositions': ['product', 'opportunity'],
    'Customer Relationships': ['market', 'general'],

    // PRD mappings
    'Executive Summary': ['general', 'product'],
    'Problem Statement': ['market', 'risk'],
    'Goals & Success Metrics': ['product', 'general'],
    'User Stories': ['market', 'product'],
    'Functional Requirements': ['product'],
    'Non-Functional Requirements': ['risk', 'product'],
    'Technical Considerations': ['risk', 'general'],
    'Timeline & Milestones': ['general'],
    'Risks & Mitigations': ['risk'],
    'Open Questions': ['assumption', 'risk', 'general'],

    // Feature Brief mappings
    'Feature Overview': ['product'],
    'User Problem': ['market', 'risk'],
    'Proposed Solution': ['product'],
    'User Flow': ['product'],
    'Acceptance Criteria': ['product'],
    'Technical Notes': ['risk', 'general'],
    'Dependencies': ['risk'],
    'Success Metrics': ['product', 'general'],

    // Concept Document mappings
    'Concept Overview': ['product', 'general'],
    'Target Audience': ['market'],
    'Core Value Proposition': ['product', 'opportunity'],
    'Key Differentiators': ['competition', 'opportunity'],
    'Market Opportunity': ['market', 'opportunity'],
    'Competitive Landscape': ['competition'],
    'Initial Assumptions': ['general', 'risk'],
    'Validation Approach': ['general'],
    'Next Steps': ['general'],

    // Domain Context mappings
    'Language': ['domain', 'general'],
    'Relationships': ['domain', 'decision', 'general'],
    'Example Dialogue': ['domain', 'general'],
    'Flagged Ambiguities': ['domain', 'risk', 'assumption'],

    // Decision Record mappings
    'Resolved Decisions': ['decision', 'general'],
    'Assumptions': ['assumption', 'risk'],
    'Risks': ['risk'],
    'ADR-Worthy Decisions': ['decision', 'risk'],
    'Recommended Next Action': ['decision', 'assumption', 'general'],
  };

  for (const section of sections) {
    lines.push(`## ${section}`);
    lines.push('');

    // Get relevant insights for this section
    const relevantCategories = sectionInsightMap[section] || ['general'];
    const relevantInsights: string[] = [];

    for (const category of relevantCategories) {
      if (insights[category]) {
        relevantInsights.push(...insights[category]);
      }
    }

    if (relevantInsights.length > 0) {
      // Include up to 5 relevant insights
      const limitedInsights = relevantInsights.slice(0, 5);
      for (const insight of limitedInsights) {
        lines.push(`- ${insight}`);
      }
    } else {
      lines.push('*No insights captured yet for this section.*');
    }

    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*This document was generated by Mary, your AI Business Strategist, based on your session insights.*');

  return lines.join('\n');
}

/**
 * Get available document types
 */
export function getAvailableDocumentTypes(): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES);
}

/**
 * Get template by type
 */
export function getDocumentTemplate(type: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES[type];
}
