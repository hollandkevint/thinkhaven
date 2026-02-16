'use client';

/**
 * ArtifactEditor Component
 *
 * Simple textarea editor for editable artifact types (working-document).
 * Features debounced auto-save and visual save indicator.
 */

import { useState, useEffect, useRef } from 'react';
import { useArtifacts } from '@/lib/artifact';

interface ArtifactEditorProps {
  artifactId: string;
  initialContent: string;
  className?: string;
}

export function ArtifactEditor({
  artifactId,
  initialContent,
  className = '',
}: ArtifactEditorProps) {
  const { updateArtifact } = useArtifacts();
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Sync initial content when it changes externally
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Debounced save effect
  useEffect(() => {
    // Don't save if content hasn't changed from initial
    if (content === initialContent) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce save by 500ms
    timeoutRef.current = setTimeout(() => {
      updateArtifact(artifactId, { content });
      setSaveStatus('saved');

      // Reset to idle after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, artifactId, updateArtifact, initialContent]);

  return (
    <div className={`relative ${className}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 p-4 font-mono text-sm border border-ink/8 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent bg-parchment"
        placeholder="Start typing..."
        spellCheck={false}
      />

      {/* Save status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 text-xs">
        {saveStatus === 'saving' && (
          <>
            <div className="w-2 h-2 bg-mustard rounded-full animate-pulse" />
            <span className="text-mustard">Saving...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <svg className="w-3 h-3 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-forest">Saved</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ArtifactEditor;
