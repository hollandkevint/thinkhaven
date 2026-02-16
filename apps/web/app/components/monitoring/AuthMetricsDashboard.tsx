'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthMetricsCollection, DetailedAuthMetrics } from '@/lib/monitoring/auth-metrics'

interface AuthMetricsData {
  timestamp: string
  window: string
  detailed: boolean
  metrics: AuthMetricsCollection | DetailedAuthMetrics
  alerts: Array<{ level: 'warning' | 'critical'; message: string; value: number }>
  metadata: {
    retention_policy: string
    last_updated: string
    data_points: string
  }
}

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  status?: 'success' | 'warning' | 'error'
  children?: React.ReactNode
}

function MetricsCard({ title, value, subtitle, status = 'success', children }: MetricsCardProps) {
  const statusColors = {
    success: 'border-forest/20 bg-forest/5',
    warning: 'border-mustard/20 bg-mustard/5',
    error: 'border-rust/20 bg-rust/5'
  }

  const textColors = {
    success: 'text-forest',
    warning: 'text-mustard',
    error: 'text-rust'
  }

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <h3 className="text-sm font-medium text-ink-light mb-1">{title}</h3>
      <div className={`text-2xl font-bold ${textColors[status]}`}>{value}</div>
      {subtitle && <p className="text-sm text-ink-light mt-1">{subtitle}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

function AlertBanner({ alerts }: { alerts: Array<{ level: 'warning' | 'critical'; message: string; value: number }> }) {
  if (alerts.length === 0) return null

  const criticalAlerts = alerts.filter(a => a.level === 'critical')
  const warningAlerts = alerts.filter(a => a.level === 'warning')

  return (
    <div className="space-y-2 mb-6">
      {criticalAlerts.map((alert, index) => (
        <div key={index} className="bg-rust/10 border border-rust/30 text-rust px-4 py-3 rounded">
          <strong>Critical:</strong> {alert.message} (Value: {alert.value})
        </div>
      ))}
      {warningAlerts.map((alert, index) => (
        <div key={index} className="bg-mustard/10 border border-mustard/30 text-mustard px-4 py-3 rounded">
          <strong>Warning:</strong> {alert.message} (Value: {alert.value})
        </div>
      ))}
    </div>
  )
}

function DistributionChart({ data, title }: { data: Record<string, number>; title: string }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className="text-center text-slate-blue py-4">
        No data available for {title}
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-ink-light mb-3">{title}</h4>
      <div className="space-y-2">
        {Object.entries(data)
          .sort(([,a], [,b]) => b - a)
          .map(([key, count]) => {
            const percentage = (count / total) * 100
            return (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-ink-light capitalize">{key.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-ink/10 rounded-full h-2">
                    <div
                      className="bg-terracotta h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-ink-light w-12 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default function AuthMetricsDashboard() {
  const [metricsData, setMetricsData] = useState<AuthMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<'1h' | '24h' | '7d'>('1h')
  const [detailed, setDetailed] = useState(false)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        window: selectedWindow,
        detailed: detailed.toString()
      })

      const response = await fetch(`/api/monitoring/auth-metrics?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }

      const data = await response.json()
      setMetricsData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      console.error('Error fetching auth metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedWindow, detailed])

  useEffect(() => {
    fetchMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [selectedWindow, detailed, fetchMetrics])

  if (loading && !metricsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
        <span className="ml-2 text-ink-light">Loading metrics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rust/10 border border-rust/30 text-rust px-4 py-3 rounded">
        <h3 className="font-medium">Error loading metrics</h3>
        <p>{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 bg-rust text-cream px-3 py-1 rounded text-sm hover:bg-rust/90"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!metricsData) {
    return (
      <div className="text-center text-slate-blue py-8">
        No metrics data available
      </div>
    )
  }

  const isCollection = 'current' in metricsData.metrics
  const currentMetrics = isCollection
    ? (metricsData.metrics as AuthMetricsCollection)[selectedWindow]
    : metricsData.metrics as DetailedAuthMetrics

  const getStatusForRate = (rate: number) => {
    if (rate < 90) return 'error'
    if (rate < 95) return 'warning'
    return 'success'
  }

  const getStatusForLatency = (latency: number) => {
    if (latency > 10000) return 'error'
    if (latency > 5000) return 'warning'
    return 'success'
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Authentication Metrics Dashboard</h1>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={detailed}
              onChange={(e) => setDetailed(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-ink-light">Detailed view</span>
          </label>
          <select
            value={selectedWindow}
            onChange={(e) => setSelectedWindow(e.target.value as '1h' | '24h' | '7d')}
            className="border border-ink/15 rounded px-3 py-1 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="bg-terracotta text-cream px-3 py-1 rounded text-sm hover:bg-terracotta-hover disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <AlertBanner alerts={metricsData.alerts} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Success Rate"
          value={`${currentMetrics.success_rate.toFixed(1)}%`}
          subtitle={`${currentMetrics.time_window} window`}
          status={getStatusForRate(currentMetrics.success_rate)}
        />

        <MetricsCard
          title="Total Attempts"
          value={currentMetrics.total_attempts}
          subtitle={`${currentMetrics.success_count} successful, ${currentMetrics.failure_count} failed`}
        />

        <MetricsCard
          title="Average Latency"
          value={`${(currentMetrics.avg_latency_ms / 1000).toFixed(1)}s`}
          subtitle="End-to-end authentication time"
          status={getStatusForLatency(currentMetrics.avg_latency_ms)}
        />

        <MetricsCard
          title="Error Rate"
          value={`${currentMetrics.total_attempts > 0 ? ((currentMetrics.failure_count / currentMetrics.total_attempts) * 100).toFixed(1) : 0}%`}
          subtitle="Failed authentication attempts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <DistributionChart
            data={currentMetrics.method_distribution}
            title="Authentication Methods"
          />
        </div>

        <div className="bg-white border rounded-lg p-6">
          <DistributionChart
            data={currentMetrics.error_distribution}
            title="Error Types"
          />
        </div>

        {detailed && 'device_distribution' in currentMetrics && (
          <>
            <div className="bg-white border rounded-lg p-6">
              <DistributionChart
                data={currentMetrics.device_distribution || {}}
                title="Device Types"
              />
            </div>

            <div className="bg-white border rounded-lg p-6">
              <DistributionChart
                data={currentMetrics.browser_distribution || {}}
                title="Browser Distribution"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-xs text-slate-blue border-t border-ink/8 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong>Last Updated:</strong> {new Date(metricsData.metadata.last_updated).toLocaleString()}
          </div>
          <div>
            <strong>Retention Policy:</strong> {metricsData.metadata.retention_policy}
          </div>
          <div>
            <strong>Data Source:</strong> {metricsData.metadata.data_points}
          </div>
        </div>
      </div>
    </div>
  )
}