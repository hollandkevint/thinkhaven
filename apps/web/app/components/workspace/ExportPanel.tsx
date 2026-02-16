'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  exportChatToMarkdown,
  exportChatToText,
  exportChatToJSON,
  copyChatToClipboard,
  downloadChatExport,
  getMimeType,
  validateMessages,
  getExportStats,
  type ChatMessage,
} from '@/lib/export/chat-export';

interface ExportPanelProps {
  messages: ChatMessage[];
  workspaceName: string;
  workspaceId: string;
}

export default function ExportPanel({
  messages,
  workspaceName,
  workspaceId,
}: ExportPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'markdown' | 'text' | 'json') => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      // Validate messages
      const validation = validateMessages(messages);
      if (!validation.valid) {
        setExportStatus({
          type: 'error',
          message: validation.error || 'Invalid messages',
        });
        setIsExporting(false);
        return;
      }

      let result;
      switch (format) {
        case 'markdown':
          result = exportChatToMarkdown(messages, {
            workspaceName,
            includeMetadata: true,
            includeTimestamps: true,
          });
          break;
        case 'text':
          result = exportChatToText(messages, {
            workspaceName,
            includeMetadata: true,
            includeTimestamps: true,
          });
          break;
        case 'json':
          result = exportChatToJSON(messages, { workspaceName });
          break;
      }

      if (result.success && result.content) {
        // Download the file
        downloadChatExport(
          result.content,
          result.fileName,
          getMimeType(format)
        );

        setExportStatus({
          type: 'success',
          message: `Chat exported as ${format.toUpperCase()}`,
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setExportStatus({ type: null, message: '' });
        }, 3000);
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Export failed',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'Failed to export chat',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const validation = validateMessages(messages);
      if (!validation.valid) {
        setExportStatus({
          type: 'error',
          message: validation.error || 'Invalid messages',
        });
        setIsExporting(false);
        return;
      }

      const result = await copyChatToClipboard(messages);

      if (result.success) {
        setExportStatus({
          type: 'success',
          message: 'Chat copied to clipboard',
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setExportStatus({ type: null, message: '' });
        }, 3000);
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Failed to copy',
        });
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      setExportStatus({
        type: 'error',
        message: 'Failed to copy to clipboard',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewSession = () => {
    router.push('/app');
  };

  const handleBackToDashboard = () => {
    router.push('/app');
  };

  const stats = getExportStats(messages);

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border border-border text-foreground ${isOpen ? 'bg-terracotta/10' : ''}`}
        title="Export chat conversation"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
      </button>

      {/* Export Panel Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border border-border bg-muted z-50"
        >
          <div className="p-4">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1 text-foreground">
                Export Chat
              </h3>
              <p className="text-xs text-muted-foreground">
                Save your conversation in multiple formats
              </p>
            </div>

            {/* Stats */}
            <div className="mb-4 p-3 rounded-lg bg-terracotta/5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="font-semibold ml-1 text-foreground">
                    {stats.totalMessages}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Read time:</span>
                  <span className="font-semibold ml-1 text-foreground">
                    {stats.estimatedReadTime} min
                  </span>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {exportStatus.type && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  exportStatus.type === 'success'
                    ? 'bg-forest/10 text-forest'
                    : 'bg-rust/10 text-rust'
                }`}
              >
                {exportStatus.message}
              </div>
            )}

            {/* Export Options */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                DOWNLOAD AS:
              </p>

              <button
                onClick={() => handleExport('markdown')}
                disabled={isExporting || messages.length === 0}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border bg-background"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    Markdown (.md)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Formatted text with structure
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('text')}
                disabled={isExporting || messages.length === 0}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border bg-background"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    Plain Text (.txt)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Simple readable format
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || messages.length === 0}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border bg-background"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    JSON (.json)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Structured data format
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                QUICK ACTIONS:
              </p>

              <button
                onClick={handleCopyToClipboard}
                disabled={isExporting || messages.length === 0}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-terracotta/10 text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <div className="font-medium text-sm">Copy to Clipboard</div>
              </button>
            </div>

            {/* Navigation Actions */}
            <div className="space-y-2 pt-4 border-t border-border">
              <button
                onClick={handleNewSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-primary text-cream"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Start New Session
              </button>

              <button
                onClick={handleBackToDashboard}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-border text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
