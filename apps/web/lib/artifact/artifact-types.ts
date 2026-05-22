/**
 * Artifact Types for ThinkHaven
 *
 * Defines types for rich content artifacts that can be displayed alongside
 * the AI agent conversation. Supports both structured outputs (read-only)
 * and working documents (editable).
 */

// Supported artifact types
export type ArtifactType =
  | 'lean-canvas'
  | 'product-brief'
  | 'project-brief'
  | 'working-document'
  | 'domain-context'
  | 'decision-record'
  | 'mermaid-diagram'
  | 'brainstorm-summary';

// View modes for artifact display
export type ArtifactViewMode = 'collapsed' | 'inline' | 'panel';

// Render modes for content display
export type ArtifactRenderMode = 'raw' | 'rendered';

// Export formats supported
export type ExportFormat = 'pdf' | 'markdown' | 'png' | 'svg' | 'json';

/**
 * Core artifact interface
 */
export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  sessionId: string;
  viewMode: ArtifactViewMode;
  renderMode: ArtifactRenderMode;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for each artifact type
 */
export interface ArtifactConfig {
  type: ArtifactType;
  editable: boolean;
  supportsRawView: boolean;
  exportFormats: ExportFormat[];
  icon: string;
  label: string;
  description: string;
}

/**
 * Configuration mapping for all artifact types
 */
export const ARTIFACT_CONFIGS: Record<ArtifactType, ArtifactConfig> = {
  'lean-canvas': {
    type: 'lean-canvas',
    editable: false,
    supportsRawView: false,
    exportFormats: ['pdf', 'png'],
    icon: 'LayoutGrid',
    label: 'Lean Canvas',
    description: 'One-page business model canvas',
  },
  'product-brief': {
    type: 'product-brief',
    editable: false,
    supportsRawView: true,
    exportFormats: ['pdf', 'markdown'],
    icon: 'FileText',
    label: 'Product Brief',
    description: 'Product requirements document',
  },
  'project-brief': {
    type: 'project-brief',
    editable: false,
    supportsRawView: true,
    exportFormats: ['pdf', 'markdown'],
    icon: 'Briefcase',
    label: 'Project Brief',
    description: 'Formal project documentation',
  },
  'working-document': {
    type: 'working-document',
    editable: true,
    supportsRawView: true,
    exportFormats: ['markdown', 'pdf'],
    icon: 'Edit',
    label: 'Working Document',
    description: 'Collaborative document',
  },
  'domain-context': {
    type: 'domain-context',
    editable: false,
    supportsRawView: true,
    exportFormats: ['markdown', 'pdf'],
    icon: 'FileText',
    label: 'Domain Context',
    description: 'Glossary and domain-language context',
  },
  'decision-record': {
    type: 'decision-record',
    editable: false,
    supportsRawView: true,
    exportFormats: ['markdown', 'pdf'],
    icon: 'Briefcase',
    label: 'Decision Record',
    description: 'Resolved decisions, assumptions, risks, and trade-offs',
  },
  'mermaid-diagram': {
    type: 'mermaid-diagram',
    editable: true,
    supportsRawView: true,
    exportFormats: ['png', 'svg'],
    icon: 'GitBranch',
    label: 'Diagram',
    description: 'Mermaid diagram',
  },
  'brainstorm-summary': {
    type: 'brainstorm-summary',
    editable: false,
    supportsRawView: true,
    exportFormats: ['markdown', 'pdf'],
    icon: 'Lightbulb',
    label: 'Brainstorm Summary',
    description: 'Session insights and action items',
  },
};

/**
 * Helper to check if an artifact type is editable
 */
export function isArtifactEditable(type: ArtifactType): boolean {
  return ARTIFACT_CONFIGS[type].editable;
}

/**
 * Helper to check if an artifact supports raw view
 */
export function supportsRawView(type: ArtifactType): boolean {
  return ARTIFACT_CONFIGS[type].supportsRawView;
}

/**
 * Helper to get export formats for an artifact type
 */
export function getExportFormats(type: ArtifactType): ExportFormat[] {
  return ARTIFACT_CONFIGS[type].exportFormats;
}

/**
 * Create a new artifact with defaults
 */
export function createArtifact(
  params: Pick<Artifact, 'type' | 'title' | 'content' | 'sessionId'> & Partial<Artifact>
): Artifact {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    viewMode: 'inline',
    renderMode: 'rendered',
    createdAt: now,
    updatedAt: now,
    ...params,
  };
}
