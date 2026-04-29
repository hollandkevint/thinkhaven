import { NextResponse } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import { checkSupabaseReadiness } from '@/lib/beta/supabase-readiness';

export async function GET() {
  const auth = await requireBetaAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const readiness = await checkSupabaseReadiness();
    return NextResponse.json(readiness);
  } catch (error) {
    console.error('Supabase readiness check failed:', error);
    return NextResponse.json(
      { error: 'Supabase readiness check failed' },
      { status: 500 }
    );
  }
}
