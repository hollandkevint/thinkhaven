import { NextResponse } from 'next/server';
import { requireBetaAdmin } from '@/lib/beta/beta-admin-auth';
import { listBetaAccessRecords } from '@/lib/beta/beta-admin';
import { betaAdminErrorResponse } from '@/lib/beta/beta-admin-response';

export async function GET() {
  const auth = await requireBetaAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const records = await listBetaAccessRecords();
    return NextResponse.json({ records });
  } catch (error) {
    return betaAdminErrorResponse(error);
  }
}
