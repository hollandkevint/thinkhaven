import { redirect } from 'next/navigation';
import { checkBetaAccess } from '@/lib/auth/beta-access';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, betaApproved, status } = await checkBetaAccess();

  if (status === 'unavailable') {
    throw new Error('Authentication service unavailable');
  }

  // Not authenticated
  if (!user || status === 'unauthenticated') {
    redirect('/login?redirect=' + encodeURIComponent('/app'));
  }

  // Authenticated but not approved for beta
  if (!betaApproved) {
    redirect('/waitlist');
  }

  // Approved - render the app
  return <>{children}</>;
}
