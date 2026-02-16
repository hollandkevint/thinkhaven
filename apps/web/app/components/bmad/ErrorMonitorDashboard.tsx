'use client'

import { useState, useEffect } from 'react'
import { BmadErrorMonitor, ErrorReport, ErrorMetrics } from '@/lib/bmad/error-monitor'

interface ErrorMonitorDashboardProps {
  className?: string
}

export default function ErrorMonitorDashboard({ className = '' }: ErrorMonitorDashboardProps) {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null)
  const [recentErrors, setRecentErrors] = useState<ErrorReport[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const loadData = () => {
      setMetrics(BmadErrorMonitor.getMetrics())
      setRecentErrors(BmadErrorMonitor.getRecentErrors(10))
    }

    loadData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rust/10 text-rust border-rust/20'
      case 'high':
        return 'bg-mustard/10 text-mustard border-mustard/20'
      case 'medium':
        return 'bg-mustard/10 text-mustard border-mustard/20'
      case 'low':
        return 'bg-terracotta/10 text-ink border-terracotta/20'
      default:
        return 'bg-parchment text-ink border-ink/8'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'blocking':
        return 'bg-rust'
      case 'major':
        return 'bg-mustard'
      case 'minor':
        return 'bg-mustard'
      case 'none':
        return 'bg-forest'
      default:
        return 'bg-slate-blue'
    }
  }

  if (!metrics) {
    return null
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`bg-white border border-ink/8 rounded-lg shadow-sm ${className}`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-parchment transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-rust rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-ink-light">
            Error Monitor ({metrics.totalErrors} errors, {metrics.criticalErrors} critical)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {metrics.criticalErrors > 0 && (
            <span className="px-2 py-1 text-xs bg-rust/10 text-rust rounded-full">
              {metrics.criticalErrors} critical
            </span>
          )}
          <svg 
            className={`w-4 h-4 text-slate-blue/60 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-ink/8 p-4 space-y-4">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-parchment rounded-lg p-3">
              <div className="text-xs text-slate-blue">Total Errors (7 days)</div>
              <div className="text-lg font-semibold text-ink">{metrics.totalErrors}</div>
            </div>
            <div className="bg-rust/5 rounded-lg p-3">
              <div className="text-xs text-rust">Critical Errors</div>
              <div className="text-lg font-semibold text-rust">{metrics.criticalErrors}</div>
            </div>
            <div className="bg-terracotta/5 rounded-lg p-3">
              <div className="text-xs text-terracotta">Components Affected</div>
              <div className="text-lg font-semibold text-ink">
                {Object.keys(metrics.errorsByComponent).length}
              </div>
            </div>
            <div className="bg-forest/5 rounded-lg p-3">
              <div className="text-xs text-forest">Actions Affected</div>
              <div className="text-lg font-semibold text-forest">
                {Object.keys(metrics.errorsByAction).length}
              </div>
            </div>
          </div>

          {/* Errors by Component */}
          {Object.keys(metrics.errorsByComponent).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-ink-light mb-2">Errors by Component</h4>
              <div className="space-y-2">
                {Object.entries(metrics.errorsByComponent)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([component, count]) => (
                    <div key={component} className="flex items-center justify-between py-1">
                      <span className="text-sm text-ink-light">{component}</span>
                      <span className="text-sm font-medium text-ink">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-ink-light mb-2">Recent Errors</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentErrors.map((error) => (
                  <div key={error.id} className="bg-parchment rounded p-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink truncate">
                          {error.error instanceof Error ? error.error.message : error.error}
                        </div>
                        <div className="text-xs text-slate-blue">
                          {error.context.component} • {error.context.action}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getImpactColor(error.userImpact)}`} title={`Impact: ${error.userImpact}`}></div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-blue/60">
                      {error.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Trends */}
          {metrics.errorTrends.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-ink-light mb-2">Error Trends (Last 7 Days)</h4>
              <div className="flex items-end gap-1 h-16">
                {metrics.errorTrends.map((trend) => {
                  const maxCount = Math.max(...metrics.errorTrends.map(t => t.count))
                  const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={trend.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t ${trend.criticalCount > 0 ? 'bg-rust' : 'bg-terracotta'} transition-all`}
                        style={{ height: `${height}%` }}
                        title={`${trend.date}: ${trend.count} errors (${trend.criticalCount} critical)`}
                      ></div>
                      <div className="text-xs text-slate-blue/60 mt-1">
                        {new Date(trend.date).getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-ink/8">
            <div className="text-xs text-slate-blue">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMetrics(BmadErrorMonitor.getMetrics())
                  setRecentErrors(BmadErrorMonitor.getRecentErrors(10))
                }}
                className="px-3 py-1 text-xs bg-terracotta text-white rounded hover:bg-terracotta-hover transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}