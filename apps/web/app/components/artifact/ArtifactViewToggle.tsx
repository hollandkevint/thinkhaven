'use client';

/**
 * ArtifactViewToggle Component
 *
 * Segmented control for switching between raw (markdown source) and rendered views.
 */

import { type ArtifactRenderMode } from '@/lib/artifact/artifact-types';

interface ArtifactViewToggleProps {
  mode: ArtifactRenderMode;
  onChange: (mode: ArtifactRenderMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ArtifactViewToggle({
  mode,
  onChange,
  disabled = false,
  className = '',
}: ArtifactViewToggleProps) {
  return (
    <div
      className={`inline-flex rounded-md bg-parchment p-0.5 ${className}`}
      role="radiogroup"
      aria-label="View mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'rendered'}
        disabled={disabled}
        onClick={() => onChange('rendered')}
        className={`
          px-2.5 py-1 text-xs font-medium rounded transition-colors
          ${
            mode === 'rendered'
              ? 'bg-cream text-ink shadow-sm'
              : 'text-ink-light hover:text-ink'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Rendered
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'raw'}
        disabled={disabled}
        onClick={() => onChange('raw')}
        className={`
          px-2.5 py-1 text-xs font-medium rounded transition-colors
          ${
            mode === 'raw'
              ? 'bg-cream text-ink shadow-sm'
              : 'text-ink-light hover:text-ink'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Raw
      </button>
    </div>
  );
}

export default ArtifactViewToggle;
