import 'next/dist/compiled/server-only';

import { NextResponse } from 'next/server';
import {
  BetaAccessNotFoundError,
  BetaAdminUnavailableError,
} from './beta-admin';

export function betaAdminErrorResponse(error: unknown): NextResponse {
  if (error instanceof BetaAdminUnavailableError) {
    return NextResponse.json(
      { error: 'Beta admin service unavailable' },
      { status: 503 }
    );
  }

  if (error instanceof BetaAccessNotFoundError) {
    return NextResponse.json(
      { error: 'Beta access record not found' },
      { status: 404 }
    );
  }

  console.error('Beta admin operation failed:', error);
  return NextResponse.json(
    { error: 'Beta admin operation failed' },
    { status: 500 }
  );
}
