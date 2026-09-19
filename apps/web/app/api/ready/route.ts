import { NextResponse } from 'next/server'
import { getDatabasePool } from '@/lib/db/pool'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await getDatabasePool().query('select 1')
    return NextResponse.json({ status: 'ready' })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
