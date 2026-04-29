import { NextRequest, NextResponse } from 'next/server'
import { authMetricsCollector } from '@/lib/monitoring/auth-metrics'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/auth/admin'
import { getBetaEventCounts } from '@/lib/monitoring/beta-event-logger'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication (only allow authenticated users to access metrics)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const window = url.searchParams.get('window') || '1h'
    const detailed = url.searchParams.get('detailed') === 'true'
    let windowMs = 60 * 60 * 1000
    if (window === '24h') windowMs = 24 * 60 * 60 * 1000
    if (window === '7d') windowMs = 7 * 24 * 60 * 60 * 1000

    let metrics
    if (detailed) {
      metrics = authMetricsCollector.calculateDetailedMetrics(windowMs)
    } else {
      metrics = authMetricsCollector.getAllMetrics()
    }

    const betaFunnel = await getBetaEventCounts(windowMs)

    // Add alert checking for current metrics
    const alerts = authMetricsCollector.checkAlerts(
      authMetricsCollector.calculateMetrics(60 * 60 * 1000) // 1h window for alerts
    )

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      window: window,
      detailed: detailed,
      metrics: metrics,
      beta_funnel: betaFunnel,
      alerts: alerts,
      metadata: {
        retention_policy: '7 days',
        last_updated: new Date().toISOString(),
        data_points: 'Based on client-side logged events'
      }
    })

  } catch (error) {
    console.error('Error fetching auth metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint allows external systems to submit auth events
    // Verify authentication first
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authEvent = await request.json()

    // Validate the auth event structure
    if (!authEvent.event_type || !authEvent.auth_method || !authEvent.timestamp) {
      return NextResponse.json(
        { error: 'Invalid auth event structure' },
        { status: 400 }
      )
    }

    // Add to metrics collector
    authMetricsCollector.addEvent(authEvent)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      event_received: authEvent.event_type
    })

  } catch (error) {
    console.error('Error processing auth event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
