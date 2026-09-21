import { NextResponse } from 'next/server'
import { getDatabasePool } from '@/lib/db/pool'
import { EnvironmentValidator } from '@/lib/security/env-validator'

export const runtime = 'nodejs'

export async function GET() {
  try {
    if (!EnvironmentValidator.validateProduction().isValid) {
      return NextResponse.json({ status: 'unavailable' }, { status: 503 })
    }
    await getDatabasePool().query('select 1')
    return NextResponse.json({ status: 'ready' })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
