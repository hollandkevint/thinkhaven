import { NextResponse } from 'next/server';
import { checkBetaAccess } from '@/lib/auth/beta-access';

export async function GET() {
  const access = await checkBetaAccess({ recordGate: false });

  if (access.status === 'unavailable') {
    return NextResponse.json(
      { error: 'Beta access service unavailable' },
      { status: 503 }
    );
  }

  if (!access.user || access.status === 'unauthenticated') {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: access.status,
    betaApproved: access.betaApproved,
    isAdmin: access.isAdmin,
    redirectTo: access.betaApproved ? '/app' : '/waitlist',
  });
}
