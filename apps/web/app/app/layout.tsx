import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
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
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
            <span className="font-display text-xl font-medium text-terracotta">!</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-medium text-ink">
              Access check unavailable
            </h1>
            <p className="font-body text-sm leading-relaxed text-ink-light">
              The authentication service is temporarily unavailable. Your workspace remains protected until the beta access check succeeds.
            </p>
          </div>
          <ol className="rounded-lg border border-ink/10 bg-parchment p-4 text-left text-sm text-ink-light space-y-2">
            <li>
              <span className="font-medium text-ink">1.</span> Retry this route in a moment.
            </li>
            <li>
              <span className="font-medium text-ink">2.</span> Sign in again if your session expired.
            </li>
            <li>
              <span className="font-medium text-ink">3.</span> Contact support if the access check keeps failing.
            </li>
          </ol>
          <div className="flex flex-col gap-3">
            <Link
              href={redirectTarget}
              className="rounded-lg bg-terracotta px-4 py-2 font-display text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-ink/10 bg-parchment px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:border-ink/20"
            >
              Go home
            </Link>
            <a
              href="mailto:kevin@kevintholland.com?subject=ThinkHaven%20beta%20access"
              className="font-display text-sm font-medium text-slate-blue transition-colors hover:text-ink"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
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
