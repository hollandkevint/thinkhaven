'use client';

/**
 * Artifact Component
 *
 * Base component for displaying artifacts in ThinkHaven.
 * Supports collapsed, inline, and panel view modes with raw/rendered content.
 */

import { useState, useCallback } from 'react';
import { type Artifact as ArtifactType } from '@/lib/artifact/artifact-types';
import { useArtifact } from '@/lib/artifact/useArtifact';
import { ArtifactHeader } from './ArtifactHeader';
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer';

interface ArtifactProps {
  artifact: ArtifactType;
  onPopOut?: (id: string) => void;
  className?: string;
}

export function Artifact({ artifact, onPopOut, className = '' }: ArtifactProps) {
  const {
    isEditable,
    canToggleRaw,
    toggleViewMode,
    toggleRenderMode,
    setViewMode,
    setRenderMode,
    copyToClipboard,
    exportArtifact,
    availableExportFormats,
  } = useArtifact(artifact.id);

  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard();
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [copyToClipboard]);

  const handleExport = useCallback(async () => {
    // Default to first available format
    const format = availableExportFormats[0];
    if (format) {
      await exportArtifact(format);
    }
  }, [availableExportFormats, exportArtifact]);

  const handlePopOut = useCallback(() => {
    if (onPopOut) {
      onPopOut(artifact.id);
      setViewMode('panel');
    }
  }, [artifact.id, onPopOut, setViewMode]);

  const isCollapsed = artifact.viewMode === 'collapsed';
  const isRaw = artifact.renderMode === 'raw';

  return (
    <div
      className={`
        border border-ink/10 rounded-lg overflow-hidden
        bg-cream shadow-sm
        ${className}
      `}
    >
      {/* Header */}
      <ArtifactHeader
        title={artifact.title}
        type={artifact.type}
        viewMode={artifact.viewMode}
        renderMode={artifact.renderMode}
        supportsRawView={canToggleRaw}
        onToggleExpand={toggleViewMode}
        onToggleRenderMode={toggleRenderMode}
        onPopOut={onPopOut ? handlePopOut : undefined}
        onCopy={handleCopy}
        onExport={availableExportFormats.length > 0 ? handleExport : undefined}
      />

      {/* Copy feedback */}
      {copyFeedback && (
        <div className="px-3 py-1 bg-forest/10 text-forest text-xs">
          Copied to clipboard
        </div>
      )}

      {/* Content (only shown when not collapsed) */}
      {!isCollapsed && (
        <div className="p-4">
          {isRaw ? (
            // Raw mode: show markdown source
            <pre className="font-mono text-sm text-ink whitespace-pre-wrap break-words bg-parchment p-3 rounded border border-ink/8 overflow-auto max-h-96">
              {artifact.content}
            </pre>
          ) : (
            // Rendered mode: use MarkdownRenderer
            <div className="max-h-96 overflow-auto">
              <MarkdownRenderer content={artifact.content} />
            </div>
          )}

          {/* Editable indicator */}
          {isEditable && (
            <div className="mt-2 text-xs text-slate-blue flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editable
            </div>
          )}
        </div>
      )}

      {/* Collapsed preview */}
      {isCollapsed && (
        <div className="px-3 py-2 text-sm text-slate-blue truncate">
          {artifact.content.slice(0, 100)}
          {artifact.content.length > 100 && '...'}
        </div>
      )}
    </div>
  );
}

export default Artifact;
