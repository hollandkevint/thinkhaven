'use client';

/**
 * Mermaid Diagram Renderer
 * Renders Mermaid diagrams with syntax highlighting and error handling
 */

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export interface MermaidRendererProps {
  code: string;
  id?: string;
  className?: string;
  onError?: (error: Error) => void;
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  id,
  className = '',
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const diagramId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!code || isRendering) return;

    const renderDiagram = async () => {
      setIsRendering(true);
      setError(null);

      try {
        // Validate and render
        const { svg: renderedSvg } = await mermaid.render(diagramId, code);
        setSvg(renderedSvg);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to render diagram');
        setError(error.message);
        onError?.(error);
        console.error('Mermaid rendering error:', error);
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [code, diagramId, onError, isRendering]);

  if (error) {
    return (
      <div className={`mermaid-error border-2 border-red-300 bg-red-50 p-4 rounded ${className}`}>
        <div className="text-red-600 font-medium mb-2">⚠️ Diagram Rendering Error</div>
        <div className="text-sm text-red-500 font-mono whitespace-pre-wrap">{error}</div>
      </div>
    );
  }

  if (isRendering) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidRenderer;
