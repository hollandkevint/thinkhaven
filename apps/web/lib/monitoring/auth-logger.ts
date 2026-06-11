// Note: headers() can only be used in server context, handled conditionally below

export interface AuthEvent {
  event_type: 'auth_initiation' | 'auth_success' | 'auth_failure' | 'auth_session_refresh' | 'auth_logout'
  auth_method: 'oauth_google' | 'email_password' | 'token_refresh'
  user_id?: string
  email?: string
  error_type?: string
  error_message?: string
  latency_ms?: number
  user_agent?: string
  ip_address?: string
  timestamp: string
  correlation_id: string
  session_id?: string
  provider?: string
}

export interface AuthMetrics {
  success_count: number
  failure_count: number
  total_attempts: number
  success_rate: number
  avg_latency_ms: number
  error_distribution: Record<string, number>
  method_distribution: Record<string, number>
  time_window: string
}

class AuthLogger {
  private generateCorrelationId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getRequestMetadata(): Promise<{ userAgent?: string; ipAddress?: string }> {
    // In server context, try to import and use headers()
    if (typeof window === 'undefined') {
      try {
        const { headers } = await import('next/headers')
        const headersList = await headers()
        return {
          userAgent: headersList.get('user-agent') || undefined,
          ipAddress: headersList.get('x-forwarded-for') ||
                    headersList.get('x-real-ip') ||
                    headersList.get('remote-addr') || undefined
        }
      } catch {
        // Server context but headers not available (e.g., build time)
        return {}
      }
    } else {
      // Client context
      return {
        userAgent: navigator.userAgent,
        ipAddress: undefined // Not available client-side for privacy
      }
    }
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy - in production, use a proper hash function
    return btoa(userId).substring(0, 12)
  }

  private hashEmail(email: string): string {
    // Hash email for privacy while maintaining uniqueness
    const [localPart, domain] = email.split('@')
    const hashedLocal = btoa(localPart).substring(0, 8)
    return `${hashedLocal}@${domain}`
  }

  async logAuthEvent(event: Partial<AuthEvent>): Promise<string> {
    const correlationId = event.correlation_id || this.generateCorrelationId()
    const metadata = await this.getRequestMetadata()

    const authEvent: AuthEvent = {
      event_type: event.event_type!,
      auth_method: event.auth_method!,
      user_id: event.user_id ? this.hashUserId(event.user_id) : undefined,
      email: event.email ? this.hashEmail(event.email) : undefined,
      error_type: event.error_type,
      error_message: event.error_message,
      latency_ms: event.latency_ms,
      user_agent: metadata.userAgent,
      ip_address: metadata.ipAddress,
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      session_id: event.session_id,
      provider: event.provider
    }

    // Log to console with structured format
    const logLevel = event.event_type === 'auth_failure' ? 'error' : 'info'
    const logMessage = `AUTH_EVENT: ${authEvent.event_type.toUpperCase()}`

    console[logLevel](logMessage, {
      ...authEvent,
      // Add debugging context
      debug: {
        timestamp: authEvent.timestamp,
        correlationId: authEvent.correlation_id
      }
    })

    // Send to Vercel Analytics if available
    const va = typeof window !== 'undefined'
      ? (window as Window & { va?: (action: string, event: string, data: Record<string, unknown>) => void }).va
      : undefined
    if (va) {
      try {
        va('track', 'auth_event', {
          event_type: authEvent.event_type,
          auth_method: authEvent.auth_method,
          success: authEvent.event_type === 'auth_success',
          error_type: authEvent.error_type,
          latency_ms: authEvent.latency_ms
        })
      } catch (error) {
        console.warn('Failed to send auth event to Vercel Analytics:', error)
      }
    }

    // Send to metrics collector for aggregation
    try {
      const { authMetricsCollector } = await import('./auth-metrics')
      authMetricsCollector.addEvent(authEvent)
    } catch (error) {
      console.warn('Failed to add event to metrics collector:', error)
    }

    return correlationId
  }

  logAuthInitiation(method: AuthEvent['auth_method'], correlationId?: string): Promise<string> {
    return this.logAuthEvent({
      event_type: 'auth_initiation',
      auth_method: method,
      correlation_id: correlationId
    })
  }

  logAuthSuccess(
    method: AuthEvent['auth_method'],
    userId: string,
    email: string,
    latencyMs: number,
    correlationId: string,
    sessionId?: string,
    provider?: string
  ): Promise<string> {
    return this.logAuthEvent({
      event_type: 'auth_success',
      auth_method: method,
      user_id: userId,
      email: email,
      latency_ms: latencyMs,
      correlation_id: correlationId,
      session_id: sessionId,
      provider: provider
    })
  }

  logAuthFailure(
    method: AuthEvent['auth_method'],
    errorType: string,
    errorMessage: string,
    latencyMs: number,
    correlationId: string,
    userId?: string
  ): Promise<string> {
    return this.logAuthEvent({
      event_type: 'auth_failure',
      auth_method: method,
      error_type: errorType,
      error_message: errorMessage,
      latency_ms: latencyMs,
      correlation_id: correlationId,
      user_id: userId
    })
  }

  logSessionRefresh(userId: string, sessionId: string): Promise<string> {
    return this.logAuthEvent({
      event_type: 'auth_session_refresh',
      auth_method: 'token_refresh',
      user_id: userId,
      session_id: sessionId
    })
  }

  logLogout(userId: string, sessionId?: string): Promise<string> {
    return this.logAuthEvent({
      event_type: 'auth_logout',
      auth_method: 'email_password', // Default, could be enhanced to track actual method
      user_id: userId,
      session_id: sessionId
    })
  }

  // Metrics calculation helper
  calculateMetrics(events: AuthEvent[], timeWindowMs: number): AuthMetrics {
    const now = new Date()
    const windowStart = new Date(now.getTime() - timeWindowMs)

    const recentEvents = events.filter(event =>
      new Date(event.timestamp) >= windowStart
    )

    const successEvents = recentEvents.filter(e => e.event_type === 'auth_success')
    const failureEvents = recentEvents.filter(e => e.event_type === 'auth_failure')
    const totalAttempts = successEvents.length + failureEvents.length

    const errorDistribution = failureEvents.reduce((acc, event) => {
      const errorType = event.error_type || 'unknown'
      acc[errorType] = (acc[errorType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const methodDistribution = recentEvents.reduce((acc, event) => {
      acc[event.auth_method] = (acc[event.auth_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const latencies = recentEvents
      .filter(e => e.latency_ms !== undefined)
      .map(e => e.latency_ms!)

    const avgLatency = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0

    return {
      success_count: successEvents.length,
      failure_count: failureEvents.length,
      total_attempts: totalAttempts,
      success_rate: totalAttempts > 0 ? (successEvents.length / totalAttempts) * 100 : 0,
      avg_latency_ms: Math.round(avgLatency),
      error_distribution: errorDistribution,
      method_distribution: methodDistribution,
      time_window: `${timeWindowMs / 1000 / 60}min`
    }
  }
}

export const authLogger = new AuthLogger()