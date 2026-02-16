'use client'

import { useState, useEffect } from 'react'
import { ExportFormat } from '@/lib/ai/conversation-export'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  conversationIds?: string[]
  onExport: (options: ExportOptions) => void
  className?: string
}

interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeBookmarks: boolean
  includeReferences: boolean
  includeContext: boolean
  includeSummaries: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  maxMessages?: number
}

interface ExportFormat {
  key: ExportFormat
  name: string
  description: string
  extension: string
  supports: string[]
  note?: string
}

interface ExportPreview {
  conversationCount: number
  messageCount: number
  estimatedSize: string
  dateRange?: { start: Date; end: Date }
}

export default function ExportDialog({
  isOpen,
  onClose,
  workspaceId,
  conversationIds,
  onExport,
  className = ''
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeBookmarks: true,
    includeReferences: true,
    includeContext: true,
    includeSummaries: true
  })
  const [availableFormats, setAvailableFormats] = useState<Record<string, ExportFormat>>({})
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false)
  const [maxMessagesEnabled, setMaxMessagesEnabled] = useState(false)

  // Load available formats
  useEffect(() => {
    const loadFormats = async () => {
      try {
        const response = await fetch('/api/export?action=formats')
        const data = await response.json()
        
        if (data.success) {
          setAvailableFormats(data.data.formats)
        }
      } catch (error) {
        console.error('Failed to load export formats:', error)
      }
    }

    if (isOpen) {
      loadFormats()
    }
  }, [isOpen])

  // Load preview when options change
  useEffect(() => {
    const loadPreview = async () => {
      if (!isOpen) return

      try {
        setPreviewLoading(true)
        
        const previewRequest = {
          format: selectedFormat,
          dateRange: dateRangeEnabled && options.dateRange ? {
            start: options.dateRange.start.toISOString(),
            end: options.dateRange.end.toISOString()
          } : undefined,
          conversationIds,
          maxMessages: maxMessagesEnabled ? options.maxMessages : undefined
        }

        const response = await fetch(`/api/export?action=preview&workspaceId=${workspaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(previewRequest)
        })

        const data = await response.json()
        
        if (data.success) {
          setPreview(data.data)
        }
      } catch (error) {
        console.error('Failed to load export preview:', error)
      } finally {
        setPreviewLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadPreview, 300)
    return () => clearTimeout(debounceTimer)
  }, [isOpen, selectedFormat, options.dateRange, options.maxMessages, dateRangeEnabled, maxMessagesEnabled, workspaceId, conversationIds])

  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format)
    setOptions(prev => ({ ...prev, format }))
  }

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value)
    setOptions(prev => ({
      ...prev,
      dateRange: prev.dateRange ? {
        ...prev.dateRange,
        [field]: date
      } : {
        start: field === 'start' ? date : new Date(),
        end: field === 'end' ? date : new Date()
      }
    }))
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const exportOptions = {
        ...options,
        dateRange: dateRangeEnabled && options.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString()
        } : undefined,
        maxMessages: maxMessagesEnabled ? options.maxMessages : undefined,
        conversationIds
      }

      await onExport(exportOptions)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const currentFormatInfo = availableFormats[selectedFormat]
  const supportsFeature = (feature: string): boolean => {
    return currentFormatInfo?.supports.includes(feature) ?? false
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <h2 className="text-xl font-semibold text-primary">Export Conversations</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format Selection */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(availableFormats).map(([key, format]) => (
                <div
                  key={key}
                  onClick={() => handleFormatChange(key as ExportFormat)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === key
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-ink/8 hover:border-ink/20 hover:bg-parchment'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary">{format.name}</span>
                    <span className="text-xs text-secondary bg-parchment px-2 py-1 rounded">
                      {format.extension}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mb-2">
                    {format.description}
                  </p>
                  {format.note && (
                    <p className="text-xs text-terracotta italic">
                      {format.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Include Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                  className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta"
                />
                <div>
                  <span className="text-sm font-medium text-primary">Metadata</span>
                  <p className="text-xs text-secondary">Timestamps, token usage, conversation details</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeBookmarks}
                  onChange={(e) => handleOptionChange('includeBookmarks', e.target.checked)}
                  disabled={!supportsFeature('bookmarks')}
                  className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta disabled:opacity-50"
                />
                <div>
                  <span className={`text-sm font-medium ${supportsFeature('bookmarks') ? 'text-primary' : 'text-secondary'}`}>
                    Bookmarks
                  </span>
                  <p className="text-xs text-secondary">Bookmarked messages with tags and descriptions</p>
                  {!supportsFeature('bookmarks') && (
                    <p className="text-xs text-amber-600">Not supported by {currentFormatInfo?.name}</p>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeReferences}
                  onChange={(e) => handleOptionChange('includeReferences', e.target.checked)}
                  disabled={!supportsFeature('references')}
                  className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta disabled:opacity-50"
                />
                <div>
                  <span className={`text-sm font-medium ${supportsFeature('references') ? 'text-primary' : 'text-secondary'}`}>
                    Message References
                  </span>
                  <p className="text-xs text-secondary">Links between related messages</p>
                  {!supportsFeature('references') && (
                    <p className="text-xs text-amber-600">Not supported by {currentFormatInfo?.name}</p>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeContext}
                  onChange={(e) => handleOptionChange('includeContext', e.target.checked)}
                  disabled={!supportsFeature('context')}
                  className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta disabled:opacity-50"
                />
                <div>
                  <span className={`text-sm font-medium ${supportsFeature('context') ? 'text-primary' : 'text-secondary'}`}>
                    Context & Insights
                  </span>
                  <p className="text-xs text-secondary">Key insights, summaries, and conversation context</p>
                  {!supportsFeature('context') && (
                    <p className="text-xs text-amber-600">Not supported by {currentFormatInfo?.name}</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-3">Filters</h3>
            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={dateRangeEnabled}
                    onChange={(e) => setDateRangeEnabled(e.target.checked)}
                    className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta"
                  />
                  <span className="text-sm font-medium text-primary">Date Range</span>
                </label>
                
                {dateRangeEnabled && (
                  <div className="flex gap-3 items-center ml-7">
                    <div>
                      <label className="block text-xs text-secondary mb-1">From</label>
                      <input
                        type="date"
                        value={options.dateRange?.start ? formatDate(options.dateRange.start) : ''}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="w-full px-3 py-2 border border-ink/8 rounded text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">To</label>
                      <input
                        type="date"
                        value={options.dateRange?.end ? formatDate(options.dateRange.end) : ''}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="w-full px-3 py-2 border border-ink/8 rounded text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Limit */}
              <div>
                <label className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={maxMessagesEnabled}
                    onChange={(e) => setMaxMessagesEnabled(e.target.checked)}
                    className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta"
                  />
                  <span className="text-sm font-medium text-primary">Limit Messages</span>
                </label>
                
                {maxMessagesEnabled && (
                  <div className="ml-7">
                    <label className="block text-xs text-secondary mb-1">Maximum messages per conversation</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={options.maxMessages || 1000}
                      onChange={(e) => handleOptionChange('maxMessages', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 border border-ink/8 rounded text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
                    />
                    <p className="text-xs text-secondary mt-1">
                      Keep most recent messages if limit is reached
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Preview */}
          {preview && (
            <div className="bg-terracotta/5 border border-terracotta/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-2">Export Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-terracotta">Conversations:</span>
                  <span className="ml-2 font-medium text-ink">{preview.conversationCount}</span>
                </div>
                <div>
                  <span className="text-terracotta">Messages:</span>
                  <span className="ml-2 font-medium text-ink">{preview.messageCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-terracotta">Estimated Size:</span>
                  <span className="ml-2 font-medium text-ink">{preview.estimatedSize}</span>
                </div>
                {preview.dateRange && (
                  <div className="col-span-2">
                    <span className="text-terracotta">Date Range:</span>
                    <span className="ml-2 font-medium text-ink">
                      {new Date(preview.dateRange.start).toLocaleDateString()} - {new Date(preview.dateRange.end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              {previewLoading && (
                <div className="mt-2 text-xs text-terracotta">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-terracotta border-t-transparent rounded-full"></div>
                    Updating preview...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-divider bg-parchment">
          <div className="text-sm text-secondary">
            {conversationIds?.length 
              ? `Exporting ${conversationIds.length} selected conversation${conversationIds.length !== 1 ? 's' : ''}`
              : 'Exporting all conversations in workspace'
            }
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 text-sm text-secondary hover:text-primary border border-divider rounded hover:bg-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || previewLoading || !preview}
              className="px-4 py-2 text-sm bg-terracotta text-white rounded hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {exporting && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}