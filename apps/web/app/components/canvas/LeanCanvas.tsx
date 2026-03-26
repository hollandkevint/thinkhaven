'use client';

import React from 'react';
import type { LeanCanvas as LeanCanvasType, LeanCanvasField } from '@/lib/canvas/lean-canvas-schema';
import { isNonEmptyCanvas } from '@/lib/canvas/lean-canvas-schema';
import { downloadCanvasMarkdown } from '@/lib/export/canvas-export-md';

interface LeanCanvasProps {
  canvas: LeanCanvasType;
  title?: string;
}

const CANVAS_LAYOUT: Array<{ field: LeanCanvasField; label: string }> = [
  { field: 'problem', label: 'Problem' },
  { field: 'unique_value_proposition', label: 'Unique Value Prop' },
  { field: 'customer_segments', label: 'Customer Segments' },
  { field: 'solution', label: 'Solution' },
  { field: 'unfair_advantage', label: 'Unfair Advantage' },
  { field: 'channels', label: 'Channels' },
  { field: 'cost_structure', label: 'Cost Structure' },
  { field: 'key_metrics', label: 'Key Metrics' },
  { field: 'revenue_streams', label: 'Revenue Streams' },
];

function CanvasBox({ label, content }: { label: string; content?: string }) {
  const filled = content != null && content.trim().length > 0;

  return (
    <div
      className={`p-3 rounded-lg min-h-[60px] flex flex-col gap-1 ${
        filled
          ? 'border border-ink/12 border-l-2 border-l-terracotta bg-cream'
          : 'border border-dashed border-ink/20 bg-parchment/50'
      }`}
    >
      <span className="text-[11px] font-display font-medium uppercase tracking-wider text-ink-light/70 flex-shrink-0">
        {label}
      </span>
      {filled ? (
        <p className="text-xs text-ink leading-relaxed overflow-y-auto">{content}</p>
      ) : (
        <p className="text-xs text-ink-light/40 italic">Pending...</p>
      )}
    </div>
  );
}

function LeanCanvasInner({ canvas, title }: LeanCanvasProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-semibold text-ink">Lean Canvas</h3>
        {isNonEmptyCanvas(canvas) && (
          <button
            onClick={() => downloadCanvasMarkdown(canvas, title)}
            className="text-xs text-terracotta hover:text-terracotta-hover font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CANVAS_LAYOUT.map(({ field, label }) => (
          <CanvasBox key={field} label={label} content={canvas[field]} />
        ))}
      </div>
    </div>
  );
}

export default React.memo(LeanCanvasInner, (prev, next) => {
  if (prev.title !== next.title) return false;
  for (const { field } of CANVAS_LAYOUT) {
    if (prev.canvas[field] !== next.canvas[field]) return false;
  }
  return true;
});
