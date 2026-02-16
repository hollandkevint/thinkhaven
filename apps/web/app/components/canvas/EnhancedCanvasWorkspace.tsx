'use client';

/**
 * Enhanced Canvas Workspace
 * Integrates tldraw for drawing and Mermaid for diagrams
 */

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Editor } from 'tldraw';
import MermaidEditor from './MermaidEditor';
import CanvasExportModal from '../../../components/canvas/CanvasExportModal';

// Dynamically import tldraw to avoid SSR issues
const TldrawCanvas = dynamic(() => import('./TldrawCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
    </div>
  ),
});

export interface EnhancedCanvasWorkspaceProps {
  workspaceId: string;
  sessionId?: string;
  initialMode?: 'draw' | 'diagram';
  initialDiagramCode?: string;
  initialDiagramType?: string;
  onStateChange?: (state: any) => void;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

type CanvasMode = 'draw' | 'diagram';

export const EnhancedCanvasWorkspace: React.FC<EnhancedCanvasWorkspaceProps> = ({
  workspaceId,
  sessionId,
  initialMode = 'draw',
  initialDiagramCode = '',
  initialDiagramType,
  onStateChange,
  onSave,
  readOnly = false
}) => {
  console.log('[EnhancedCanvasWorkspace] Component mounted/updated:', {
    workspaceId,
    sessionId,
    initialMode,
    hasInitialDiagramCode: !!initialDiagramCode,
    readOnly
  });

  const [mode, setMode] = useState<CanvasMode>(initialMode);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [mermaidCode, setMermaidCode] = useState(initialDiagramCode);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  // Handle tldraw mount
  const handleTldrawMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  // Listen for canvas highlight events
  useEffect(() => {
    const handleHighlight = (event: CustomEvent) => {
      const { suggestionId } = event.detail;
      setHighlightedElement(suggestionId);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedElement(null);
      }, 3000);
    };

    window.addEventListener('canvas:highlight' as any, handleHighlight as EventListener);

    return () => {
      window.removeEventListener('canvas:highlight' as any, handleHighlight as EventListener);
    };
  }, []);

  // Handle tldraw save
  const handleTldrawSave = useCallback(async (snapshot: any) => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_canvas_state',
          sessionId,
          canvasState: {
            mode: 'draw',
            snapshot
          }
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        onSave?.({ mode: 'draw', snapshot });
      }
    } catch (error) {
      console.error('Failed to save tldraw state:', error);
    }
  }, [sessionId, onSave]);

  // Handle Mermaid save
  const handleMermaidSave = useCallback(async (code: string) => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_canvas_state',
          sessionId,
          canvasState: {
            mode: 'diagram',
            mermaidCode: code
          }
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        onSave?.({ mode: 'diagram', mermaidCode: code });
      }
    } catch (error) {
      console.error('Failed to save Mermaid diagram:', error);
    }
  }, [sessionId, onSave]);

  // Handle Mermaid code change
  const handleMermaidChange = useCallback((code: string) => {
    setMermaidCode(code);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle between draw and diagram mode (Ctrl+Shift+M)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault();
        setMode(prev => prev === 'draw' ? 'diagram' : 'draw');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load initial state
  useEffect(() => {
    const loadCanvasState = async () => {
      // Skip loading if no sessionId
      if (!sessionId) {
        console.log('[EnhancedCanvasWorkspace] No sessionId, skipping canvas state load');
        return;
      }

      try {
        console.log('[EnhancedCanvasWorkspace] Loading canvas state for session:', sessionId);

        const response = await fetch('/api/bmad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load_canvas_state',
            sessionId
          })
        });

        if (response.ok) {
          const { data } = await response.json();
          console.log('[EnhancedCanvasWorkspace] Loaded canvas state:', data);

          if (data?.canvasState) {
            if (data.canvasState.mode === 'diagram' && data.canvasState.mermaidCode) {
              setMermaidCode(data.canvasState.mermaidCode);
              setMode('diagram');
            }
          }
        } else {
          console.warn('[EnhancedCanvasWorkspace] Failed to load canvas state:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[EnhancedCanvasWorkspace] Error loading canvas state:', error);
        // Don't set error state for load failures - just log them
        // Canvas can still work without loaded state
      }
    };

    loadCanvasState();
  }, [sessionId]);

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-parchment p-4">
        <div className="max-w-md text-center">
          <div className="text-rust mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Canvas Error</h3>
          <p className="text-ink-light mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-terracotta text-white rounded hover:bg-terracotta-hover"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-parchment">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-3 bg-white border-b border-ink/8 shadow-sm">
          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={() => setMode('draw')}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'draw'
                  ? 'bg-terracotta/10 text-terracotta font-medium'
                  : 'text-ink-light hover:bg-parchment'
              }`}
              title="Freeform Drawing (Ctrl+Shift+M)"
            >
              ✏️ Draw
            </button>
            <button
              onClick={() => setMode('diagram')}
              className={`px-3 py-1.5 rounded transition-colors ${
                mode === 'diagram'
                  ? 'bg-terracotta/10 text-terracotta font-medium'
                  : 'text-ink-light hover:bg-parchment'
              }`}
              title="Mermaid Diagrams (Ctrl+Shift+M)"
            >
              📊 Diagram
            </button>
          </div>

          <div className="h-6 w-px bg-ink/20" />

          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 text-ink-light hover:bg-parchment rounded transition-colors flex items-center gap-1.5"
            title="Export canvas as PNG or SVG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-blue">
            {lastSaved && (
              <span>
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {sessionId && (
              <>
                <span className="text-slate-blue/60">•</span>
                <span>Session: {sessionId.slice(0, 8)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        className={`flex-1 overflow-hidden relative transition-all duration-300 ${
          highlightedElement ? 'ring-4 ring-green-500 ring-opacity-50 shadow-lg' : ''
        }`}
        data-canvas-container
      >
        {highlightedElement && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-forest text-white text-sm font-medium rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            ✨ New content added here
          </div>
        )}
        {mode === 'draw' ? (
          <TldrawCanvas
            sessionId={sessionId}
            onMount={handleTldrawMount}
            onSave={handleTldrawSave}
            readOnly={readOnly}
          />
        ) : (
          <MermaidEditor
            initialCode={mermaidCode}
            onChange={handleMermaidChange}
            onSave={handleMermaidSave}
          />
        )}
      </div>

      {/* Help Text */}
      {!readOnly && (
        <div className="p-2 bg-white border-t border-ink/8 text-xs text-slate-blue flex items-center gap-4">
          <span>💡 Press <kbd className="px-1 py-0.5 bg-parchment rounded text-ink-light">Ctrl+Shift+M</kbd> to toggle between drawing and diagrams</span>
          <span className="text-slate-blue/60">•</span>
          <span>Auto-save every 30 seconds</span>
        </div>
      )}

      {/* Export Modal */}
      <CanvasExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode={mode}
        tldrawEditor={editor}
        diagramCode={mermaidCode}
        workspaceId={workspaceId}
        workspaceName={`Workspace ${workspaceId.slice(0, 8)}`}
      />
    </div>
  );
};

export default EnhancedCanvasWorkspace;
