/**
 * Client-safe pathway configuration.
 *
 * Keep session labels, initial phases, limits, and phase order in one place so
 * API routes, client entry points, and session primitives do not drift.
 */

export interface PathwayConfig {
  id: string;
  label: string;
  phase: string;
  messageLimit: number;
  defaultTitle: string;
  phaseOrder: string[];
}

export type PathwayType =
  | 'decision'
  | 'product-idea'
  | 'strategy-review'
  | 'explore'
  | 'plan-grill';

export const ACTIVE_PATHWAYS: Record<PathwayType, PathwayConfig> = {
  decision: {
    id: 'decision',
    label: 'Decision',
    phase: 'discovery',
    messageLimit: 15,
    defaultTitle: 'New Decision',
    phaseOrder: ['discovery'],
  },
  'product-idea': {
    id: 'product-idea',
    label: 'Product Idea',
    phase: 'discovery',
    messageLimit: 20,
    defaultTitle: 'New Product Idea',
    phaseOrder: ['discovery'],
  },
  'strategy-review': {
    id: 'strategy-review',
    label: 'Strategy Review',
    phase: 'discovery',
    messageLimit: 25,
    defaultTitle: 'Strategy Review',
    phaseOrder: ['discovery'],
  },
  explore: {
    id: 'explore',
    label: 'Exploration',
    phase: 'discovery',
    messageLimit: 20,
    defaultTitle: 'New Session',
    phaseOrder: ['discovery'],
  },
  'plan-grill': {
    id: 'plan-grill',
    label: 'Plan Grill',
    phase: 'intake',
    messageLimit: 20,
    defaultTitle: 'Plan Grill',
    phaseOrder: ['intake'],
  },
};

export const LEGACY_SESSION_PATHWAYS: Record<string, PathwayConfig> = {
  'quick-decision': {
    id: 'quick-decision',
    label: 'Quick Decision',
    phase: 'discovery',
    messageLimit: 10,
    defaultTitle: 'Quick Decision',
    phaseOrder: ['discovery'],
  },
  'deep-analysis': {
    id: 'deep-analysis',
    label: 'Deep Analysis',
    phase: 'discovery',
    messageLimit: 30,
    defaultTitle: 'Deep Analysis',
    phaseOrder: ['discovery'],
  },
  'board-of-directors': {
    id: 'board-of-directors',
    label: 'Board Session',
    phase: 'discovery',
    messageLimit: 40,
    defaultTitle: 'Board Session',
    phaseOrder: ['discovery'],
  },
  'strategy-sprint': {
    id: 'strategy-sprint',
    label: 'Strategy Sprint',
    phase: 'discovery',
    messageLimit: 20,
    defaultTitle: 'Strategy Sprint',
    phaseOrder: ['discovery'],
  },
};

export const LEGACY_PATHWAY_LABELS: Record<string, string> = {
  'new-idea': 'New Idea',
  'business-model': 'Business Model',
  'business-model-problem': 'Business Problem',
  'feature-refinement': 'Feature Refinement',
  'strategic-optimization': 'Strategic Optimization',
  'quick-decision': 'Quick Decision',
  'deep-analysis': 'Deep Analysis',
  'board-of-directors': 'Board Session',
  'strategy-sprint': 'Strategy Sprint',
};

export const LEGACY_PHASE_ORDER: Record<string, string[]> = {
  'new-idea': ['discovery', 'ideation', 'validation', 'planning'],
  'business-model': ['analysis', 'revenue', 'customer', 'validation', 'planning'],
  'strategic-optimization': ['assessment', 'analysis', 'strategy', 'implementation'],
};

export const PATHWAY_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(ACTIVE_PATHWAYS).map(pathway => [pathway.id, pathway.label])
  ),
  ...Object.fromEntries(
    Object.values(LEGACY_SESSION_PATHWAYS).map(pathway => [pathway.id, pathway.label])
  ),
  ...LEGACY_PATHWAY_LABELS,
};

export const PATHWAY_PHASE_ORDER: Record<string, string[]> = {
  ...Object.fromEntries(
    Object.values(ACTIVE_PATHWAYS).map(pathway => [pathway.id, pathway.phaseOrder])
  ),
  ...Object.fromEntries(
    Object.values(LEGACY_SESSION_PATHWAYS).map(pathway => [pathway.id, pathway.phaseOrder])
  ),
  ...LEGACY_PHASE_ORDER,
};

export function getPathwayConfig(pathwayId: string): PathwayConfig | undefined {
  return ACTIVE_PATHWAYS[pathwayId as PathwayType] || LEGACY_SESSION_PATHWAYS[pathwayId];
}
