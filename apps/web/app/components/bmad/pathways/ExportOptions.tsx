'use client'

import { useState } from 'react'
import { FeatureBrief, ExportFormat } from '@/lib/bmad/types'
import { downloadFile, copyToClipboard } from '@/lib/bmad/exports/brief-formatters'

interface ExportOptionsProps {
  brief: FeatureBrief
  sessionId: string
  onExport?: (format: ExportFormat) => void
  className?: string
}

export default function ExportOptions({
  brief,
  sessionId,
  onExport,
  className = ''
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: 'markdown' | 'text' | 'pdf') => {
    setIsExporting(true)
    setExportingFormat(format)
    setError(null)

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export as ${format}`)
      }

      // Handle PDF binary response differently
      if (format === 'pdf') {
        // PDF returns binary data directly
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${brief.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-brief.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Text formats return JSON with content
        const data = await response.json()
        downloadFile(data.data.content, data.data.filename, data.data.mimeType)
      }

      // Notify parent
      onExport?.({ content: '', filename: '', mimeType: '', format } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format: 'markdown'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate markdown')
      }

      const data = await response.json()
      await copyToClipboard(data.data.content)

      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed')
    }
  }

  const handleEmailShare = async () => {
    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_feature_brief',
          sessionId,
          briefId: brief.id,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate email content')
      }

      const data = await response.json()
      const subject = encodeURIComponent(`Feature Brief: ${brief.title}`)
      const body = encodeURIComponent(data.data.content)

      window.location.href = `mailto:?subject=${subject}&body=${body}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email share failed')
    }
  }

  return (
    <div className={`export-options ${className}`}>
      <div className="bg-cream rounded-lg border border-ink/8 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-ink mb-2">
            Export & Share Options
          </h3>
          <p className="text-sm text-ink-light">
            Download your feature brief in multiple formats or share with your team
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-rust/5 border border-rust/20 rounded-lg p-3">
            <p className="text-sm text-rust">{error}</p>
          </div>
        )}

        {/* Download Options */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold text-ink-light uppercase tracking-wider">
            Download
          </h4>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Markdown Download */}
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-terracotta/20 rounded-lg hover:border-terracotta hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📄</span>
              <span className="text-sm font-semibold text-ink">Markdown</span>
              <span className="text-xs text-slate-blue text-center mt-1">
                For documentation & wikis
              </span>
              {isExporting && exportingFormat === 'markdown' && (
                <span className="text-xs text-terracotta mt-2">Exporting...</span>
              )}
            </button>

            {/* Text Download */}
            <button
              onClick={() => handleExport('text')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-forest/20 rounded-lg hover:border-forest hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📝</span>
              <span className="text-sm font-semibold text-ink">Plain Text</span>
              <span className="text-xs text-slate-blue text-center mt-1">
                For emails & basic docs
              </span>
              {isExporting && exportingFormat === 'text' && (
                <span className="text-xs text-forest mt-2">Exporting...</span>
              )}
            </button>

            {/* PDF Download */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex flex-col items-center p-4 bg-white border-2 border-terracotta/20 rounded-lg hover:border-terracotta hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl mb-2">📑</span>
              <span className="text-sm font-semibold text-ink">PDF</span>
              <span className="text-xs text-slate-blue text-center mt-1">
                Professional format with branding
              </span>
              {isExporting && exportingFormat === 'pdf' && (
                <span className="text-xs text-terracotta mt-2">Exporting...</span>
              )}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink-light uppercase tracking-wider">
            Share
          </h4>

          <div className="flex flex-wrap gap-3">
            {/* Copy Markdown to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg transition-all ${
                copySuccess
                  ? 'border-forest bg-forest/5'
                  : 'border-terracotta/20 hover:border-terracotta hover:bg-terracotta/5'
              }`}
            >
              <span className="text-lg">{copySuccess ? '✓' : '📋'}</span>
              <span className="text-sm font-medium text-ink-light">
                {copySuccess ? 'Copied as Markdown!' : 'Copy as Markdown'}
              </span>
            </button>

            {/* Email Share */}
            <button
              onClick={handleEmailShare}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-ink/8 rounded-lg hover:bg-parchment transition-colors"
            >
              <span className="text-lg">📧</span>
              <span className="text-sm font-medium text-ink-light">
                Share via Email
              </span>
            </button>
          </div>
        </div>

        {/* Format Guide */}
        <div className="mt-6 pt-4 border-t border-ink/8">
          <details className="text-sm">
            <summary className="font-medium text-ink-light cursor-pointer hover:text-ink">
              Format Guide
            </summary>
            <div className="mt-3 space-y-2 text-ink-light">
              <div>
                <span className="font-semibold">Markdown:</span> Best for GitHub, Notion, Confluence, and other documentation platforms. Preserves formatting and links.
              </div>
              <div>
                <span className="font-semibold">Plain Text:</span> Universal format for email, Slack, or any basic text editor. Simple and widely compatible.
              </div>
              <div>
                <span className="font-semibold">PDF:</span> Professional format for presentations, formal sharing, or archiving. Maintains exact layout and styling.
              </div>
            </div>
          </details>
        </div>

        {/* Integration Note */}
        <div className="mt-4 p-3 bg-terracotta/5 border border-terracotta/20 rounded-lg">
          <p className="text-xs text-ink">
            <span className="font-semibold">💡 Tip:</span> Use Markdown format to import directly into Jira, Linear, or Asana. Copy the content and paste into your issue tracker.
          </p>
        </div>
      </div>
    </div>
  )
}