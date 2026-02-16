'use client';

/**
 * ArtifactHeader Component
 *
 * Header bar for artifacts with title, type indicator, and action buttons.
 */

import {
  type ArtifactType,
  type ArtifactViewMode,
  type ArtifactRenderMode,
  ARTIFACT_CONFIGS,
} from '@/lib/artifact/artifact-types';
import { ArtifactViewToggle } from './ArtifactViewToggle';

// Icon components (simplified inline SVGs)
const icons: Record<string, React.ReactNode> = {
  LayoutGrid: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  FileText: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Briefcase: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  GitBranch: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 17h.01M17 7h.01M5 7a2 2 0 114 0v10a2 2 0 11-4 0V7zm12 0a2 2 0 10-4 0M7 17a2 2 0 100-4h10a2 2 0 100 4H7z" />
    </svg>
  ),
  Lightbulb: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  ChevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  ExternalLink: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Copy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

function getIcon(iconName: string): React.ReactNode {
  return icons[iconName] || icons.FileText;
}

interface ArtifactHeaderProps {
  title: string;
  type: ArtifactType;
  viewMode: ArtifactViewMode;
  renderMode: ArtifactRenderMode;
  supportsRawView: boolean;
  onToggleExpand: () => void;
  onToggleRenderMode: () => void;
  onPopOut?: () => void;
  onCopy: () => void;
  onExport?: () => void;
  className?: string;
}

export function ArtifactHeader({
  title,
  type,
  viewMode,
  renderMode,
  supportsRawView,
  onToggleExpand,
  onToggleRenderMode,
  onPopOut,
  onCopy,
  onExport,
  className = '',
}: ArtifactHeaderProps) {
  const config = ARTIFACT_CONFIGS[type];
  const isCollapsed = viewMode === 'collapsed';

  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2
        bg-parchment border-b border-ink/10 rounded-t-lg
        ${className}
      `}
    >
      {/* Left side: Icon, Type badge, Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-blue flex-shrink-0">
          {getIcon(config.icon)}
        </span>

        <span className="text-xs font-medium text-slate-blue bg-ink/10 px-1.5 py-0.5 rounded flex-shrink-0">
          {config.label}
        </span>

        <h3 className="text-sm font-medium text-ink truncate">
          {title}
        </h3>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Raw/Rendered toggle (only when expanded and supported) */}
        {!isCollapsed && supportsRawView && (
          <ArtifactViewToggle
            mode={renderMode}
            onChange={onToggleRenderMode}
          />
        )}

        {/* Copy button */}
        <button
          type="button"
          onClick={onCopy}
          className="p-1.5 text-slate-blue hover:text-ink hover:bg-parchment rounded transition-colors"
          title="Copy content"
        >
          {icons.Copy}
        </button>

        {/* Pop-out button (only when inline) */}
        {viewMode === 'inline' && onPopOut && (
          <button
            type="button"
            onClick={onPopOut}
            className="p-1.5 text-slate-blue hover:text-ink hover:bg-parchment rounded transition-colors"
            title="Pop out to panel"
          >
            {icons.ExternalLink}
          </button>
        )}

        {/* Export button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="p-1.5 text-slate-blue hover:text-ink hover:bg-parchment rounded transition-colors"
            title="Export"
          >
            {icons.Download}
          </button>
        )}

        {/* Expand/Collapse toggle */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 text-slate-blue hover:text-ink hover:bg-parchment rounded transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? icons.ChevronDown : icons.ChevronUp}
        </button>
      </div>
    </div>
  );
}

export default ArtifactHeader;
