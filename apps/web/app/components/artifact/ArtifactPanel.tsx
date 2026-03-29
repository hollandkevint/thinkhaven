'use client';

/**
 * ArtifactPanel Component
 *
 * Full-height slide-in panel for viewing artifacts in expanded mode.
 * Slides in from the right with backdrop overlay.
 */

import { useEffect, useCallback, useState } from 'react';
import { useArtifacts } from '@/lib/artifact';
import { ARTIFACT_CONFIGS, getExportFormats, isArtifactEditable } from '@/lib/artifact/artifact-types';
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer';
import { ArtifactEditor } from './ArtifactEditor';

export function ArtifactPanel() {
  const {
    isPanelOpen,
    selectedArtifact,
    artifacts,
    closePanel,
    selectArtifact,
  } = useArtifacts();

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isRawView, setIsRawView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if current artifact is editable
  const canEdit = selectedArtifact ? isArtifactEditable(selectedArtifact.type) : false;

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, closePanel]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!selectedArtifact) return;

    try {
      await navigator.clipboard.writeText(selectedArtifact.content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [selectedArtifact]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!selectedArtifact) return;

    const formats = getExportFormats(selectedArtifact.type);
    if (formats.length === 0) return;

    // Default to markdown export
    const content = selectedArtifact.content;
    const filename = `${selectedArtifact.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedArtifact]);

  if (!isPanelOpen) return null;

  const config = selectedArtifact
    ? ARTIFACT_CONFIGS[selectedArtifact.type]
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-cream shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out"
        style={{ transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Artifact panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10 bg-parchment">
          <div className="flex items-center gap-3 min-w-0">
            {config && (
              <span className="text-lg">{config.icon}</span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink truncate">
                {selectedArtifact?.title || 'Artifact'}
              </h2>
              {config && (
                <span className="text-xs text-slate-blue">{config.label}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Edit toggle (only for editable types) */}
            {canEdit && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isEditMode
                    ? 'bg-terracotta/10 text-terracotta'
                    : 'text-slate-blue hover:text-ink hover:bg-parchment'
                }`}
                title={isEditMode ? 'Exit edit mode' : 'Edit'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Raw/Rendered toggle */}
            <button
              onClick={() => setIsRawView(!isRawView)}
              className="p-2 text-slate-blue hover:text-ink hover:bg-parchment rounded-lg transition-colors"
              title={isRawView ? 'Show rendered' : 'Show raw'}
              disabled={isEditMode}
            >
              {isRawView ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-2 text-slate-blue hover:text-ink hover:bg-parchment rounded-lg transition-colors relative"
              title="Copy to clipboard"
            >
              {copyFeedback ? (
                <svg className="w-4 h-4 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="p-2 text-slate-blue hover:text-ink hover:bg-parchment rounded-lg transition-colors"
              title="Export"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={closePanel}
              className="p-2 text-slate-blue hover:text-ink hover:bg-parchment rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedArtifact ? (
            isEditMode && canEdit ? (
              <ArtifactEditor
                artifactId={selectedArtifact.id}
                initialContent={selectedArtifact.content}
                className="h-full"
              />
            ) : isRawView ? (
              <pre className="font-mono text-sm text-ink whitespace-pre-wrap break-words bg-parchment p-4 rounded-lg border border-ink/8">
                {selectedArtifact.content}
              </pre>
            ) : (
              <MarkdownRenderer content={selectedArtifact.content} />
            )
          ) : (
            <div className="text-center text-slate-blue py-8">
              <p>Select an artifact to view</p>
            </div>
          )}
        </div>

        {/* Bottom artifact list (when multiple artifacts) */}
        {artifacts.length > 1 && (
          <div className="border-t border-ink/10 p-3 bg-parchment">
            <div className="text-xs text-slate-blue mb-2">
              {artifacts.length} artifacts in this session
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {artifacts.map((artifact) => {
                const artifactConfig = ARTIFACT_CONFIGS[artifact.type];
                const isSelected = artifact.id === selectedArtifact?.id;

                return (
                  <button
                    key={artifact.id}
                    onClick={() => selectArtifact(artifact.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap
                      transition-colors flex-shrink-0
                      ${isSelected
                        ? 'bg-terracotta/10 text-terracotta border border-terracotta/20'
                        : 'bg-cream text-ink border border-ink/10 hover:border-ink/20'
                      }
                    `}
                  >
                    <span>{artifactConfig?.icon || '📄'}</span>
                    <span className="truncate max-w-[100px]">{artifact.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ArtifactPanel;
