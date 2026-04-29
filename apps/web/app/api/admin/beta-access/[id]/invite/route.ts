import { NextResponse } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import { createBetaInvite } from '@/lib/beta/beta-admin';
import { betaAdminErrorResponse } from '@/lib/beta/beta-admin-response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireBetaAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const invite = await createBetaInvite(id, auth.actor);
    return NextResponse.json(invite);
  } catch (error) {
    return betaAdminErrorResponse(error);
  }
}
