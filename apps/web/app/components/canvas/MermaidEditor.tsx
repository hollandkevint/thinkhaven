'use client';

/**
 * Mermaid Diagram Editor
 * Code editor with live preview for Mermaid diagrams
 */

import React, { useState, useCallback } from 'react';
import MermaidRenderer from './MermaidRenderer';

export interface MermaidEditorProps {
  initialCode?: string;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  height?: string;
}

// Mermaid diagram templates
const MERMAID_TEMPLATES = {
  flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,

  sequence: `sequenceDiagram
    participant U as User
    participant S as System
    participant D as Database

    U->>S: Request
    S->>D: Query
    D-->>S: Response
    S-->>U: Result`,

  gantt: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1           :a1, 2024-01-01, 30d
    Task 2           :after a1, 20d
    section Phase 2
    Task 3           :2024-02-01, 25d`,

  class: `classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Product {
        +String title
        +Number price
        +buy()
    }
    User "1" --> "*" Product : owns`,

  state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> [*]
    Error --> Idle: Retry`,

  journey: `journey
    title User Journey
    section Discovery
      Search Product: 5: User
      View Details: 4: User
    section Purchase
      Add to Cart: 5: User
      Checkout: 3: User, System
      Payment: 4: User, Payment Gateway
    section Post-Purchase
      Order Confirmation: 5: System
      Delivery: 4: Courier`
};

export const MermaidEditor: React.FC<MermaidEditorProps> = ({
  initialCode = MERMAID_TEMPLATES.flowchart,
  onChange,
  onSave,
  height = '600px'
}) => {
  const [code, setCode] = useState(initialCode);
  const [activeTemplate, setActiveTemplate] = useState<keyof typeof MERMAID_TEMPLATES>('flowchart');
  const [showPreview, setShowPreview] = useState(true);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange?.(newCode);
  }, [onChange]);

  const handleTemplateSelect = useCallback((template: keyof typeof MERMAID_TEMPLATES) => {
    setActiveTemplate(template);
    setCode(MERMAID_TEMPLATES[template]);
    onChange?.(MERMAID_TEMPLATES[template]);
  }, [onChange]);

  const handleSave = useCallback(() => {
    onSave?.(code);
  }, [code, onSave]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  return (
    <div className="flex flex-col h-full border border-ink/8 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-parchment border-b border-ink/8">
        <div className="flex items-center gap-1 mr-auto">
          <span className="text-sm text-ink-light mr-2">Template:</span>
          {Object.keys(MERMAID_TEMPLATES).map((template) => (
            <button
              key={template}
              onClick={() => handleTemplateSelect(template as keyof typeof MERMAID_TEMPLATES)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                activeTemplate === template
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'bg-white text-ink-light hover:bg-parchment'
              }`}
            >
              {template}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm bg-white rounded hover:bg-parchment"
          >
            {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm bg-white rounded hover:bg-parchment"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-terracotta text-white rounded hover:bg-terracotta-hover"
            >
              💾 Save
            </button>
          )}
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden" style={{ height }}>
        {/* Code Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-ink/8`}>
          <div className="flex items-center justify-between p-2 bg-parchment border-b border-ink/8">
            <span className="text-xs font-medium text-ink-light">Mermaid Code</span>
            <span className="text-xs text-slate-blue">{code.split('\n').length} lines</span>
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-inset"
            placeholder="Enter Mermaid diagram code..."
            spellCheck={false}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-parchment border-b border-ink/8">
              <span className="text-xs font-medium text-ink-light">Preview</span>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white">
              <MermaidRenderer code={code} />
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-2 bg-parchment border-t border-ink/8 text-xs text-slate-blue">
        💡 Tip: Select a template to get started, or write custom Mermaid syntax. Changes preview in real-time.
      </div>
    </div>
  );
};

export default MermaidEditor;
