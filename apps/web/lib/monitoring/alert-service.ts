import { AuthMetrics } from './auth-logger'

export interface AlertConfig {
  enabled: boolean
  successRateWarning: number // %
  successRateCritical: number // %
  latencyWarningMs: number
  latencyCriticalMs: number
  errorRateThresholdPercent: number
  channels: {
    console: boolean
    vercelLogs: boolean
    webhook?: string
    email?: string
  }
}

export interface Alert {
  id: string
  level: 'warning' | 'critical'
  type: 'success_rate' | 'latency' | 'error_rate' | 'system'
  message: string
  value: number
  threshold: number
  timestamp: string
  resolved: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface AlertHistory {
  alerts: Alert[]
  totalAlerts: number
  activeAlerts: Alert[]
  resolvedAlerts: Alert[]
}

class AlertService {
  private config: AlertConfig
  private alertHistory: Alert[] = []
  private readonly maxHistorySize = 1000

  constructor() {
    this.config = this.getDefaultConfig()
    this.loadConfigFromStorage()
  }

  private getDefaultConfig(): AlertConfig {
    // Disable alerts in development to avoid noise during testing
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         process.env.NEXT_PUBLIC_ENV === 'development'

    return {
      enabled: !isDevelopment, // Disable in development
      successRateWarning: 95,
      successRateCritical: 90,
      latencyWarningMs: 5000,
      latencyCriticalMs: 10000,
      errorRateThresholdPercent: 5,
      channels: {
        console: !isDevelopment, // Only log to console in production
        vercelLogs: !isDevelopment // Only log to Vercel in production
      }
    }
  }

  private loadConfigFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth_alert_config')
        if (stored) {
          const parsedConfig = JSON.parse(stored)
          this.config = { ...this.config, ...parsedConfig }
        }

        const storedHistory = localStorage.getItem('auth_alert_history')
        if (storedHistory) {
          this.alertHistory = JSON.parse(storedHistory)
        }
      } catch (error) {
        console.warn('Failed to load alert configuration:', error)
      }
    }
  }

  private saveConfigToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_alert_config', JSON.stringify(this.config))
        localStorage.setItem('auth_alert_history', JSON.stringify(this.alertHistory))
      } catch (error) {
        console.warn('Failed to save alert configuration:', error)
      }
    }
  }

  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfigToStorage()
  }

  getConfig(): AlertConfig {
    return { ...this.config }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createAlert(
    level: 'warning' | 'critical',
    type: Alert['type'],
    message: string,
    value: number,
    threshold: number
  ): Alert {
    return {
      id: this.generateAlertId(),
      level,
      type,
      message,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      resolved: false
    }
  }

  private addAlert(alert: Alert): void {
    // Check if a similar alert already exists and is active
    const existingAlert = this.alertHistory.find(
      a => !a.resolved && a.type === alert.type && a.level === alert.level
    )

    if (existingAlert) {
      // Update existing alert with new value and timestamp
      existingAlert.value = alert.value
      existingAlert.timestamp = alert.timestamp
      existingAlert.message = alert.message
    } else {
      // Add new alert
      this.alertHistory.unshift(alert)

      // Trim history if too large
      if (this.alertHistory.length > this.maxHistorySize) {
        this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize)
      }

      // Send alert notifications
      this.sendAlert(alert)
    }

    this.saveConfigToStorage()
  }

  private async sendAlert(alert: Alert): Promise<void> {
    if (!this.config.enabled) return

    const alertMessage = `[${alert.level.toUpperCase()}] ${alert.message} (Value: ${alert.value}, Threshold: ${alert.threshold})`

    // Console logging
    if (this.config.channels.console) {
      if (alert.level === 'critical') {
        console.error('🚨 CRITICAL ALERT:', alertMessage)
      } else {
        console.warn('⚠️ WARNING ALERT:', alertMessage)
      }
    }

    // Vercel Logs (structured logging)
    if (this.config.channels.vercelLogs) {
      const logData = {
        alert_id: alert.id,
        alert_level: alert.level,
        alert_type: alert.type,
        alert_message: alert.message,
        alert_value: alert.value,
        alert_threshold: alert.threshold,
        timestamp: alert.timestamp,
        service: 'auth_monitoring'
      }

      if (alert.level === 'critical') {
        console.error('AUTH_ALERT_CRITICAL', logData)
      } else {
        console.warn('AUTH_ALERT_WARNING', logData)
      }
    }

    // Webhook notification
    if (this.config.channels.webhook) {
      try {
        await fetch(this.config.channels.webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: alertMessage,
            alert: alert,
            service: 'ThinkHaven Auth Monitoring',
            timestamp: alert.timestamp
          })
        })
      } catch (error) {
        console.error('Failed to send webhook alert:', error)
      }
    }

    // Email notification (would require email service integration)
    if (this.config.channels.email) {
      // This would integrate with an email service like SendGrid, AWS SES, etc.
      console.log('Email alert would be sent to:', this.config.channels.email)
    }
  }

  checkAndTriggerAlerts(metrics: AuthMetrics): Alert[] {
    const triggeredAlerts: Alert[] = []

    if (!this.config.enabled) return triggeredAlerts

    // Success rate alerts
    if (metrics.success_rate < this.config.successRateCritical) {
      const alert = this.createAlert(
        'critical',
        'success_rate',
        `Authentication success rate critically low: ${metrics.success_rate.toFixed(1)}%`,
        metrics.success_rate,
        this.config.successRateCritical
      )
      this.addAlert(alert)
      triggeredAlerts.push(alert)
    } else if (metrics.success_rate < this.config.successRateWarning) {
      const alert = this.createAlert(
        'warning',
        'success_rate',
        `Authentication success rate below threshold: ${metrics.success_rate.toFixed(1)}%`,
        metrics.success_rate,
        this.config.successRateWarning
      )
      this.addAlert(alert)
      triggeredAlerts.push(alert)
    }

    // Latency alerts
    if (metrics.avg_latency_ms > this.config.latencyCriticalMs) {
      const alert = this.createAlert(
        'critical',
        'latency',
        `Authentication latency critically high: ${(metrics.avg_latency_ms / 1000).toFixed(1)}s`,
        metrics.avg_latency_ms,
        this.config.latencyCriticalMs
      )
      this.addAlert(alert)
      triggeredAlerts.push(alert)
    } else if (metrics.avg_latency_ms > this.config.latencyWarningMs) {
      const alert = this.createAlert(
        'warning',
        'latency',
        `Authentication latency above threshold: ${(metrics.avg_latency_ms / 1000).toFixed(1)}s`,
        metrics.avg_latency_ms,
        this.config.latencyWarningMs
      )
      this.addAlert(alert)
      triggeredAlerts.push(alert)
    }

    // Error rate alerts for specific error types
    const totalAttempts = metrics.total_attempts
    if (totalAttempts > 0) {
      Object.entries(metrics.error_distribution).forEach(([errorType, count]) => {
        const errorRate = (count / totalAttempts) * 100
        if (errorRate > this.config.errorRateThresholdPercent) {
          const alert = this.createAlert(
            'warning',
            'error_rate',
            `High error rate for ${errorType}: ${errorRate.toFixed(1)}% (${count} of ${totalAttempts} attempts)`,
            errorRate,
            this.config.errorRateThresholdPercent
          )
          this.addAlert(alert)
          triggeredAlerts.push(alert)
        }
      })
    }

    return triggeredAlerts
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.acknowledgedBy = acknowledgedBy
      alert.acknowledgedAt = new Date().toISOString()
      this.saveConfigToStorage()
      return true
    }
    return false
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      this.saveConfigToStorage()
      return true
    }
    return false
  }

  getActiveAlerts(): Alert[] {
    return this.alertHistory.filter(alert => !alert.resolved)
  }

  getAlertHistory(limit?: number): AlertHistory {
    const alerts = limit ? this.alertHistory.slice(0, limit) : this.alertHistory
    const activeAlerts = alerts.filter(a => !a.resolved)
    const resolvedAlerts = alerts.filter(a => a.resolved)

    return {
      alerts,
      totalAlerts: this.alertHistory.length,
      activeAlerts,
      resolvedAlerts
    }
  }

  clearAlertHistory(): void {
    this.alertHistory = []
    this.saveConfigToStorage()
  }

  // Auto-resolve alerts based on current metrics
  autoResolveAlerts(currentMetrics: AuthMetrics): void {
    const activeAlerts = this.getActiveAlerts()

    activeAlerts.forEach(alert => {
      let shouldResolve = false

      switch (alert.type) {
        case 'success_rate':
          // Resolve if success rate is back above the warning threshold
          shouldResolve = currentMetrics.success_rate >= this.config.successRateWarning
          break

        case 'latency':
          // Resolve if latency is back below the warning threshold
          shouldResolve = currentMetrics.avg_latency_ms <= this.config.latencyWarningMs
          break

        case 'error_rate':
          // Resolve if error rate is back below threshold (more complex logic needed for specific error types)
          const totalAttempts = currentMetrics.total_attempts
          if (totalAttempts > 0) {
            const maxErrorRate = Math.max(
              ...Object.values(currentMetrics.error_distribution).map(count =>
                (count / totalAttempts) * 100
              )
            )
            shouldResolve = maxErrorRate <= this.config.errorRateThresholdPercent
          } else {
            shouldResolve = true // No errors if no attempts
          }
          break
      }

      if (shouldResolve) {
        this.resolveAlert(alert.id)
        console.log(`Auto-resolved alert: ${alert.message}`)
      }
    })
  }

  // Generate alert summary for dashboard
  getAlertSummary(): {
    total: number
    active: number
    critical: number
    warnings: number
    lastAlert?: Alert
  } {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.level === 'critical')
    const warningAlerts = activeAlerts.filter(a => a.level === 'warning')

    return {
      total: this.alertHistory.length,
      active: activeAlerts.length,
      critical: criticalAlerts.length,
      warnings: warningAlerts.length,
      lastAlert: this.alertHistory[0]
    }
  }
}

export const alertService = new AlertService()