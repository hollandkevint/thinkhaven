import { NextResponse } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import { checkRailwayReadiness } from '@/lib/beta/supabase-readiness';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireBetaAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const readiness = await checkRailwayReadiness();
    return NextResponse.json(readiness);
  } catch (error) {
    console.error('Railway readiness check failed:', error);
    return NextResponse.json(
      { error: 'Railway readiness check failed' },
      { status: 500 }
    );
  }
}
