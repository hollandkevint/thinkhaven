import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/lib/monitoring/alert-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/auth/admin'

async function verifyAuth() {
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
  return { user, error }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth()

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
    const action = url.searchParams.get('action')
    const limit = url.searchParams.get('limit')

    switch (action) {
      case 'active':
        return NextResponse.json({
          alerts: alertService.getActiveAlerts(),
          timestamp: new Date().toISOString()
        })

      case 'summary':
        return NextResponse.json({
          summary: alertService.getAlertSummary(),
          timestamp: new Date().toISOString()
        })

      case 'config':
        return NextResponse.json({
          config: alertService.getConfig(),
          timestamp: new Date().toISOString()
        })

      default:
        const limitNum = limit ? parseInt(limit, 10) : undefined
        return NextResponse.json({
          ...alertService.getAlertHistory(limitNum),
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, alertId, config } = body

    switch (action) {
      case 'acknowledge':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          )
        }

        const acknowledged = alertService.acknowledgeAlert(alertId, user.email || user.id)
        return NextResponse.json({
          success: acknowledged,
          message: acknowledged ? 'Alert acknowledged' : 'Alert not found or already acknowledged'
        })

      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          )
        }

        const resolved = alertService.resolveAlert(alertId)
        return NextResponse.json({
          success: resolved,
          message: resolved ? 'Alert resolved' : 'Alert not found or already resolved'
        })

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration required' },
            { status: 400 }
          )
        }

        alertService.updateConfig(config)
        return NextResponse.json({
          success: true,
          message: 'Configuration updated',
          config: alertService.getConfig()
        })

      case 'clear_history':
        alertService.clearAlertHistory()
        return NextResponse.json({
          success: true,
          message: 'Alert history cleared'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error processing alert action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}