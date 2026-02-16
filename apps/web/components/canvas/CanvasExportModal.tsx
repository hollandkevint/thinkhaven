/**
 * Canvas Export Modal
 *
 * Modal dialog for exporting canvas content as PNG or SVG
 */

'use client'

import { useState, useEffect } from 'react'
import {
  ExportOptions,
  ExportResult,
  ExportMetadata,
  exportTldrawAsPNG,
  exportTldrawAsSVG,
  exportMermaidAsPNG,
  exportMermaidAsSVG,
  downloadExport,
  copyToClipboard,
  generateFilename,
} from '@/lib/canvas/canvas-export'

interface CanvasExportModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'draw' | 'diagram'
  tldrawEditor?: any // Tldraw editor instance
  diagramCode?: string
  workspaceId: string
  workspaceName: string
  sessionInfo?: {
    messageCount: number
    duration?: string
  }
}

const RESOLUTION_PRESETS = [
  { label: 'HD (1920×1080)', width: 1920, height: 1080 },
  { label: '4K (3840×2160)', width: 3840, height: 2160 },
  { label: 'Full HD (1080×1920)', width: 1080, height: 1920 },
  { label: 'Social (1200×630)', width: 1200, height: 630 },
  { label: 'Custom', width: 0, height: 0 },
]

const SCALE_OPTIONS = [
  { label: '1x (Standard)', value: 1 },
  { label: '2x (Retina)', value: 2 },
  { label: '3x (High DPI)', value: 3 },
]

export default function CanvasExportModal({
  isOpen,
  onClose,
  mode,
  tldrawEditor,
  diagramCode,
  workspaceId,
  workspaceName,
  sessionInfo,
}: CanvasExportModalProps) {
  const [format, setFormat] = useState<'png' | 'svg'>('png')
  const [resolutionPreset, setResolutionPreset] = useState(0) // HD by default
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [scale, setScale] = useState(2) // 2x for retina
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportResult(null)
      setPreviewUrl(null)
      setIsExporting(false)
    }
  }, [isOpen])

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!isOpen) return null

  const selectedResolution = RESOLUTION_PRESETS[resolutionPreset]
  const isCustomResolution = resolutionPreset === RESOLUTION_PRESETS.length - 1

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)
    setPreviewUrl(null)

    try {
      const options: Partial<ExportOptions> = {
        format,
        scale: format === 'png' ? scale : 1,
        includeMetadata,
        backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
        filename: generateFilename(mode, format, workspaceName),
      }

      if (format === 'png' && !isCustomResolution) {
        options.resolution = {
          width: selectedResolution.width,
          height: selectedResolution.height,
        }
      } else if (format === 'png' && isCustomResolution) {
        options.resolution = {
          width: customWidth,
          height: customHeight,
        }
      }

      const metadata: ExportMetadata = {
        workspaceId,
        workspaceName,
        exportedAt: new Date(),
        canvasMode: mode,
        sessionInfo,
      }

      let result: ExportResult

      if (mode === 'draw') {
        if (!tldrawEditor) {
          throw new Error('Tldraw editor not available')
        }
        result = format === 'png'
          ? await exportTldrawAsPNG(tldrawEditor, options, metadata)
          : await exportTldrawAsSVG(tldrawEditor, options, metadata)
      } else {
        if (!diagramCode) {
          throw new Error('Diagram code not available')
        }
        result = format === 'png'
          ? await exportMermaidAsPNG(diagramCode, options, metadata)
          : await exportMermaidAsSVG(diagramCode, options, metadata)
      }

      setExportResult(result)

      if (result.success && result.dataUrl) {
        setPreviewUrl(result.dataUrl)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setExportResult({
        success: false,
        filename: `export.${format}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (exportResult) {
      downloadExport(exportResult)
    }
  }

  const handleCopyToClipboard = async () => {
    if (exportResult) {
      const success = await copyToClipboard(exportResult)
      if (success) {
        alert('Copied to clipboard!')
      } else {
        alert('Failed to copy to clipboard. Only PNG images can be copied.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-cream rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Export Canvas</h2>
              <p className="text-sm text-ink-light mt-1">
                {mode === 'draw' ? 'Export your drawing' : 'Export your diagram'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-blue hover:text-ink-light hover:bg-parchment rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Export Format
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  format === 'png'
                    ? 'border-terracotta bg-terracotta/5 text-terracotta'
                    : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                <div className="font-medium">PNG</div>
                <div className="text-xs text-ink-light mt-1">Raster image, best for sharing</div>
              </button>
              <button
                onClick={() => setFormat('svg')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  format === 'svg'
                    ? 'border-terracotta bg-terracotta/5 text-terracotta'
                    : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                <div className="font-medium">SVG</div>
                <div className="text-xs text-ink-light mt-1">Vector image, scalable quality</div>
              </button>
            </div>
          </div>

          {/* PNG-specific options */}
          {format === 'png' && (
            <>
              {/* Resolution Preset */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Resolution
                </label>
                <select
                  value={resolutionPreset}
                  onChange={(e) => setResolutionPreset(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:border-terracotta focus:ring-1 focus:ring-terracotta"
                >
                  {RESOLUTION_PRESETS.map((preset, index) => (
                    <option key={index} value={index}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Resolution */}
              {isCustomResolution && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      min={100}
                      max={7680}
                      className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:border-terracotta focus:ring-1 focus:ring-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      min={100}
                      max={7680}
                      className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:border-terracotta focus:ring-1 focus:ring-terracotta"
                    />
                  </div>
                </div>
              )}

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Quality Scale
                </label>
                <div className="flex gap-2">
                  {SCALE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScale(option.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        scale === option.value
                          ? 'border-terracotta bg-terracotta/5 text-terracotta'
                          : 'border-ink/10 hover:border-ink/20'
                      }`}
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Background
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setBackgroundColor('#ffffff')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  backgroundColor === '#ffffff'
                    ? 'border-terracotta bg-terracotta/5 text-terracotta'
                    : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setBackgroundColor('transparent')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  backgroundColor === 'transparent'
                    ? 'border-terracotta bg-terracotta/5 text-terracotta'
                    : 'border-ink/10 hover:border-ink/20'
                }`}
              >
                Transparent
              </button>
              <input
                type="color"
                value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-10 rounded-lg border border-ink/15 cursor-pointer"
              />
            </div>
          </div>

          {/* Metadata */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="w-4 h-4 text-terracotta border-ink/15 rounded focus:ring-terracotta"
              />
              <span className="text-sm text-ink">
                Include metadata (workspace name, date, session info)
              </span>
            </label>
          </div>

          {/* Preview */}
          {previewUrl && exportResult?.success && (
            <div className="border border-ink/10 rounded-lg p-4 bg-parchment">
              <div className="text-sm font-medium text-ink mb-3">Preview</div>
              <div className="max-h-64 overflow-auto bg-cream rounded border border-ink/10 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Export preview"
                  className="max-w-full max-h-60 object-contain"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {exportResult && !exportResult.success && (
            <div className="p-4 bg-rust/10 border border-rust/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-rust flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <div>
                  <div className="font-medium text-rust">Export Failed</div>
                  <div className="text-sm text-rust mt-1">{exportResult.error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink/10 bg-parchment rounded-b-xl">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-ink hover:bg-parchment rounded-lg transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {exportResult?.success && (
                <>
                  {format === 'png' && (
                    <button
                      onClick={handleCopyToClipboard}
                      className="px-4 py-2 text-terracotta hover:bg-terracotta/5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-forest text-white hover:bg-forest/90 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </>
              )}

              {!exportResult && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-terracotta text-cream hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Export
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
