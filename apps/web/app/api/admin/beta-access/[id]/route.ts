import { NextRequest, NextResponse } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import {
  approveBetaAccessRecord,
  revokeBetaAccessRecord,
} from '@/lib/beta/beta-admin';
import { betaAdminErrorResponse } from '@/lib/beta/beta-admin-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireBetaAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === 'approve') {
      const record = await approveBetaAccessRecord(id, auth.actor);
      return NextResponse.json({ record });
    }

    if (action === 'revoke') {
      const record = await revokeBetaAccessRecord(id, auth.actor);
      return NextResponse.json({ record });
    }

    return NextResponse.json(
      { error: 'Unsupported beta access action' },
      { status: 400 }
    );
  } catch (error) {
    return betaAdminErrorResponse(error);
  }
}
