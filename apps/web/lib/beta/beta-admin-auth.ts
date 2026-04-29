import 'next/dist/compiled/server-only';

import { NextResponse } from 'next/server';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import type { BetaAdminActor } from './beta-admin';

export type AdminAuthResult =
  | { ok: true; actor: BetaAdminActor }
  | { ok: false; response: NextResponse };

export async function requireBetaAdmin(): Promise<AdminAuthResult> {
  const access = await checkBetaAccess();

  if (access.status === 'unavailable') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      ),
    };
  }

  if (!access.user || access.status === 'unauthenticated') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (!access.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    actor: {
      id: access.user.id,
      email: access.user.email,
    },
  };
}
