/**
 * Pathway labels — safe to import from client components.
 * Separated from session-primitives.ts which imports server-only modules.
 */

export type PathwayType = 'decision' | 'product-idea' | 'strategy-review' | 'explore';

export const PATHWAY_LABELS: Record<string, string> = {
  'decision': 'Decision',
  'product-idea': 'Product Idea',
  'strategy-review': 'Strategy Review',
  'explore': 'Exploration',
  // Legacy pathways (still stored in existing sessions)
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
