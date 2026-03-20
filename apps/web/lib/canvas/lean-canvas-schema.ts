/**
 * Lean Canvas Schema — Single source of truth for canvas fields, types, and helpers.
 * Used by the RPC (key validation), tool handler (input validation),
 * and UI component (rendering).
 */

export const LEAN_CANVAS_FIELDS = [
  'problem', 'customer_segments', 'unique_value_proposition',
  'solution', 'channels', 'revenue_streams',
  'cost_structure', 'key_metrics', 'unfair_advantage',
] as const;

export type LeanCanvasField = typeof LEAN_CANVAS_FIELDS[number];

export interface LeanCanvas {
  problem?: string;
  customer_segments?: string;
  unique_value_proposition?: string;
  solution?: string;
  channels?: string;
  revenue_streams?: string;
  cost_structure?: string;
  key_metrics?: string;
  unfair_advantage?: string;
}

export function isNonEmptyCanvas(canvas: LeanCanvas | null | undefined): canvas is LeanCanvas {
  if (!canvas) return false;
  return Object.values(canvas).some(v => typeof v === 'string' && v.trim().length > 0);
}

export function getFilledBoxes(canvas: LeanCanvas): LeanCanvasField[] {
  return LEAN_CANVAS_FIELDS.filter(f => {
    const val = canvas[f];
    return val != null && val.trim().length > 0;
  });
}

export function getEmptyBoxes(canvas: LeanCanvas): LeanCanvasField[] {
  return LEAN_CANVAS_FIELDS.filter(f => {
    const val = canvas[f];
    return val == null || val.trim().length === 0;
  });
}
