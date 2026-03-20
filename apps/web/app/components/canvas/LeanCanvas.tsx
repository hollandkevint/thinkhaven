'use client';

import React from 'react';
import type { LeanCanvas as LeanCanvasType, LeanCanvasField } from '@/lib/canvas/lean-canvas-schema';

interface LeanCanvasProps {
  canvas: LeanCanvasType;
}

const CANVAS_LAYOUT: Array<{
  field: LeanCanvasField;
  label: string;
  row: number;
  col: number;
}> = [
  { field: 'problem', label: 'Problem', row: 1, col: 1 },
  { field: 'unique_value_proposition', label: 'Unique Value Prop', row: 1, col: 2 },
  { field: 'customer_segments', label: 'Customer Segments', row: 1, col: 3 },
  { field: 'solution', label: 'Solution', row: 2, col: 1 },
  { field: 'unfair_advantage', label: 'Unfair Advantage', row: 2, col: 2 },
  { field: 'channels', label: 'Channels', row: 2, col: 3 },
  { field: 'cost_structure', label: 'Cost Structure', row: 3, col: 1 },
  { field: 'key_metrics', label: 'Key Metrics', row: 3, col: 2 },
  { field: 'revenue_streams', label: 'Revenue Streams', row: 3, col: 3 },
];

function CanvasBox({ label, content }: { label: string; content?: string }) {
  const filled = content != null && content.trim().length > 0;

  return (
    <div
      className={`p-3 rounded-lg min-h-[80px] flex flex-col gap-1 ${
        filled
          ? 'border border-ink/12 border-l-2 border-l-terracotta bg-cream'
          : 'border border-dashed border-ink/20 bg-parchment/50'
      }`}
    >
      <span className="text-[11px] font-display font-medium uppercase tracking-wider text-ink-light/70">
        {label}
      </span>
      {filled ? (
        <p className="text-xs text-ink leading-relaxed">{content}</p>
      ) : (
        <p className="text-xs text-ink-light/40 italic">Pending...</p>
      )}
    </div>
  );
}

function LeanCanvasInner({ canvas }: LeanCanvasProps) {
  return (
    <div className="p-4">
      <h3 className="font-display text-sm font-semibold text-ink mb-3">Lean Canvas</h3>
      <div className="grid grid-cols-3 gap-2">
        {CANVAS_LAYOUT.map(({ field, label }) => (
          <CanvasBox key={field} label={label} content={canvas[field]} />
        ))}
      </div>
    </div>
  );
}

export default React.memo(LeanCanvasInner, (prev, next) => {
  for (const { field } of CANVAS_LAYOUT) {
    if (prev.canvas[field] !== next.canvas[field]) return false;
  }
  return true;
});
