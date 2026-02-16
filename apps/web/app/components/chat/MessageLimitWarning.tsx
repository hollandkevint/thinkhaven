'use client';

import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { MessageLimitStatus } from '@/lib/bmad/message-limit-manager';

interface MessageLimitWarningProps {
  limitStatus: MessageLimitStatus | null;
  onExport?: () => void;
  onNewSession?: () => void;
}

/**
 * Message Limit Warning Component
 *
 * Displays warnings and actions when users approach or reach their message limit.
 * Only shown when LAUNCH_MODE is enabled.
 */
export function MessageLimitWarning({
  limitStatus,
  onExport,
  onNewSession,
}: MessageLimitWarningProps) {
  // Don't show if no limit status or limits are disabled
  if (!limitStatus || limitStatus.messageLimit === -1) {
    return null;
  }

  const { remaining, limitReached, warningThreshold } = limitStatus;

  // Don't show if plenty of messages remaining
  if (!limitReached && !warningThreshold) {
    return null;
  }

  if (limitReached) {
    return (
      <div className="mx-4 mb-4 rounded-lg border-2 border-rust/30 bg-rust/10 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-rust mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-rust mb-1">
              Message Limit Reached
            </h3>
            <p className="text-sm text-rust mb-3">
              You've reached the 10-message limit for this session. Save your work or start a new session to continue.
            </p>
            <div className="flex flex-wrap gap-2">
              {onExport && (
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rust text-white rounded-md hover:bg-rust/90 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Export Session
                </button>
              )}
              {onNewSession && (
                <button
                  onClick={onNewSession}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cream text-rust border border-rust/30 rounded-md hover:bg-rust/10 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Warning threshold (5 or fewer messages remaining)
  const getWarningColor = () => {
    if (remaining <= 2) return 'orange';
    return 'yellow';
  };

  const color = getWarningColor();
  const colorClasses = {
    yellow: {
      border: 'border-mustard/30',
      bg: 'bg-mustard/10',
      text: 'text-ink',
      icon: 'text-mustard',
      subtext: 'text-mustard',
    },
    orange: {
      border: 'border-terracotta/30',
      bg: 'bg-terracotta/5',
      text: 'text-ink',
      icon: 'text-terracotta',
      subtext: 'text-terracotta',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`mx-4 mb-4 rounded-lg border ${classes.border} ${classes.bg} p-3 shadow-sm`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${classes.icon} mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${classes.text}`}>
            {remaining === 1
              ? 'Last message remaining in this session'
              : `${remaining} messages remaining in this session`
            }
          </p>
          <p className={`text-xs ${classes.subtext} mt-0.5`}>
            Consider exporting your work soon or starting a new session.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact message counter badge
 * Can be placed in the chat header
 */
export function MessageCounterBadge({
  limitStatus,
}: {
  limitStatus: MessageLimitStatus | null;
}) {
  // Don't show if no limit status or limits are disabled
  if (!limitStatus || limitStatus.messageLimit === -1) {
    return null;
  }

  const { currentCount, messageLimit, remaining } = limitStatus;

  // Color based on remaining messages
  let colorClass = 'bg-parchment text-ink';
  if (remaining <= 2) {
    colorClass = 'bg-terracotta/10 text-terracotta';
  } else if (remaining <= 5) {
    colorClass = 'bg-mustard/10 text-mustard';
  }

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {currentCount} / {messageLimit} messages
    </div>
  );
}
