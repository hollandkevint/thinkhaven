'use client';

/**
 * ArtifactList Component
 *
 * Compact list view of artifacts for displaying in headers or sidebars.
 * Can be used as a badge (shows count) or full list (shows all artifacts).
 */

import { useArtifacts } from '@/lib/artifact';
import { ARTIFACT_CONFIGS } from '@/lib/artifact/artifact-types';

interface ArtifactListProps {
  /** Display mode: 'badge' shows count, 'list' shows full list */
  mode?: 'badge' | 'list';
  /** Callback when an artifact is selected */
  onSelect?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ArtifactList({
  mode = 'badge',
  onSelect,
  className = '',
}: ArtifactListProps) {
  const { artifacts, selectArtifact, selectedArtifactId, openPanel } = useArtifacts();

  const handleSelect = (id: string) => {
    selectArtifact(id);
    openPanel();
    onSelect?.(id);
  };

  if (artifacts.length === 0) {
    return null;
  }

  // Badge mode - just show count
  if (mode === 'badge') {
    return (
      <button
        onClick={() => {
          if (artifacts.length === 1) {
            handleSelect(artifacts[0].id);
          } else {
            openPanel();
          }
        }}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
          bg-terracotta/10 text-terracotta text-xs font-medium
          hover:bg-terracotta/15 transition-colors
          ${className}
        `}
        title={`${artifacts.length} artifact${artifacts.length === 1 ? '' : 's'}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{artifacts.length}</span>
      </button>
    );
  }

  // List mode - show full list
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-xs text-slate-blue font-medium mb-2">
        Artifacts ({artifacts.length})
      </div>
      {artifacts.map((artifact) => {
        const config = ARTIFACT_CONFIGS[artifact.type];
        const isSelected = artifact.id === selectedArtifactId;

        return (
          <button
            key={artifact.id}
            onClick={() => handleSelect(artifact.id)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
              transition-colors
              ${isSelected
                ? 'bg-terracotta/10 text-terracotta'
                : 'hover:bg-parchment text-ink-light'
              }
            `}
          >
            <span className="text-base">{config?.icon || '📄'}</span>
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{artifact.title}</div>
              <div className="text-xs text-slate-blue">{config?.label || artifact.type}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ArtifactList;
