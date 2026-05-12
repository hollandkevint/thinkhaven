import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import { getProtectedAppRedirectTarget } from '@/lib/auth/app-redirect';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, betaApproved, status } = await checkBetaAccess();
  const requestHeaders = await headers();
  const redirectTarget = getProtectedAppRedirectTarget(
    requestHeaders.get('x-th-pathname'),
    requestHeaders.get('x-th-search')
  );

  if (status === 'unavailable') {
    throw new Error('Authentication service unavailable');
  }

  // Not authenticated
  if (!user || status === 'unauthenticated') {
    redirect('/login?redirect=' + encodeURIComponent(redirectTarget));
  }

  // Authenticated but not approved for beta
  if (!betaApproved) {
    redirect('/waitlist');
  }

  // Approved - render the app
  return <>{children}</>;
}
