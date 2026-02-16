'use client';

/**
 * Canvas Workspace Component
 * Main container for visual canvas with drawing tools
 * Manages canvas state and provides drawing interface
 */

import React, { useState, useCallback, useEffect } from 'react';

export interface CanvasElement {
  id: string;
  type: 'shape' | 'text' | 'connector' | 'image';
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  style: ElementStyle;
  data: any;
  linkedToConversation?: string; // Message ID from chat
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
}

export interface CanvasWorkspaceState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  viewport: {
    zoom: number;
    pan: { x: number; y: number };
  };
}

export interface CanvasWorkspaceProps {
  sessionId: string;
  initialState?: CanvasWorkspaceState;
  onStateChange?: (state: CanvasWorkspaceState) => void;
  onElementsChange?: (elements: CanvasElement[]) => void;
  readOnly?: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  sessionId,
  initialState,
  onStateChange,
  onElementsChange,
  readOnly = false
}) => {
  const [canvasState, setCanvasState] = useState<CanvasWorkspaceState>(
    initialState || {
      elements: [],
      selectedElementIds: [],
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 }
      }
    }
  );

  const [currentTool, setCurrentTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'connector'>('select');
  const [isDirty, setIsDirty] = useState(false);

  // Notify parent of state changes
  useEffect(() => {
    if (isDirty) {
      onStateChange?.(canvasState);
      setIsDirty(false);
    }
  }, [canvasState, isDirty, onStateChange]);

  // Notify parent of element changes
  useEffect(() => {
    onElementsChange?.(canvasState.elements);
  }, [canvasState.elements, onElementsChange]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (readOnly) return;

    const autoSaveInterval = setInterval(() => {
      if (canvasState.elements.length > 0) {
        saveCanvasState();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [canvasState, readOnly]);

  const saveCanvasState = useCallback(async () => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_canvas_state',
          sessionId,
          canvasState
        })
      });

      if (!response.ok) {
        console.error('Failed to save canvas state');
      }
    } catch (error) {
      console.error('Error saving canvas state:', error);
    }
  }, [sessionId, canvasState]);

  const addElement = useCallback((element: Omit<CanvasElement, 'id'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setCanvasState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setIsDirty(true);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    }));
    setIsDirty(true);
  }, []);

  const deleteElement = useCallback((id: string) => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElementIds: prev.selectedElementIds.filter(sid => sid !== id)
    }));
    setIsDirty(true);
  }, []);

  const selectElement = useCallback((id: string, multi: boolean = false) => {
    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: multi
        ? [...prev.selectedElementIds, id]
        : [id]
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      selectedElementIds: []
    }));
  }, []);

  const deleteSelected = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => !prev.selectedElementIds.includes(el.id)),
      selectedElementIds: []
    }));
    setIsDirty(true);
  }, []);

  const handleZoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.min(prev.viewport.zoom * 1.2, 3)
      }
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.max(prev.viewport.zoom / 1.2, 0.25)
      }
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: 1
      }
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;

      // Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvasState.selectedElementIds.length > 0) {
        e.preventDefault();
        deleteSelected();
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setCanvasState(prev => ({
          ...prev,
          selectedElementIds: prev.elements.map(el => el.id)
        }));
      }

      // Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCanvasState();
      }

      // Zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState.selectedElementIds, readOnly, deleteSelected, saveCanvasState, handleZoomIn, handleZoomOut, handleResetZoom]);

  return (
    <div className="flex flex-col h-full w-full bg-parchment">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-3 bg-white border-b border-ink/8 shadow-sm">
          <div className="flex items-center gap-1 mr-4">
            <ToolButton
              icon="↖"
              label="Select"
              active={currentTool === 'select'}
              onClick={() => setCurrentTool('select')}
            />
            <ToolButton
              icon="▭"
              label="Rectangle"
              active={currentTool === 'rectangle'}
              onClick={() => setCurrentTool('rectangle')}
            />
            <ToolButton
              icon="○"
              label="Circle"
              active={currentTool === 'circle'}
              onClick={() => setCurrentTool('circle')}
            />
            <ToolButton
              icon="T"
              label="Text"
              active={currentTool === 'text'}
              onClick={() => setCurrentTool('text')}
            />
            <ToolButton
              icon="→"
              label="Connector"
              active={currentTool === 'connector'}
              onClick={() => setCurrentTool('connector')}
            />
          </div>

          <div className="h-6 w-px bg-ink/20" />

          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-parchment rounded"
              title="Zoom Out (Ctrl+-)"
            >
              🔍-
            </button>
            <span className="text-sm text-ink-light min-w-[60px] text-center">
              {Math.round(canvasState.viewport.zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-parchment rounded"
              title="Zoom In (Ctrl++)"
            >
              🔍+
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-parchment rounded text-sm"
              title="Reset Zoom (Ctrl+0)"
            >
              ↺
            </button>
          </div>

          <div className="h-6 w-px bg-ink/20 ml-auto" />

          <button
            onClick={saveCanvasState}
            className="px-3 py-1.5 bg-terracotta text-white rounded hover:bg-terracotta-hover text-sm"
            title="Save (Ctrl+S)"
          >
            💾 Save
          </button>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Placeholder for actual canvas implementation */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${canvasState.viewport.zoom}) translate(${canvasState.viewport.pan.x}px, ${canvasState.viewport.pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          <div className="text-center text-slate-blue/60 p-8">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-lg font-medium">Canvas Workspace</p>
            <p className="text-sm mt-2">Canvas library integration coming next</p>
            <p className="text-xs mt-4 text-slate-blue">
              {canvasState.elements.length} element{canvasState.elements.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-ink/8 px-4 py-2 text-xs text-ink-light flex justify-between">
          <span>
            {canvasState.selectedElementIds.length > 0
              ? `${canvasState.selectedElementIds.length} selected`
              : 'No selection'}
          </span>
          <span>Session: {sessionId}</span>
        </div>
      </div>
    </div>
  );
};

// Helper component for toolbar buttons
const ToolButton: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded transition-colors ${
      active
        ? 'bg-terracotta/10 text-terracotta'
        : 'hover:bg-parchment text-ink-light'
    }`}
    title={label}
  >
    {icon}
  </button>
);

export default CanvasWorkspace;
