import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import BetaAccessControlCenter from '@/app/components/admin/BetaAccessControlCenter';

export const dynamic = 'force-dynamic';

export default async function BetaAdminPage() {
  const access = await checkBetaAccess({ recordGate: false });

  if (access.status === 'unavailable') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
            <span className="font-display text-xl font-medium text-terracotta">!</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-medium text-ink">
              Beta access controls are unavailable
            </h1>
            <p className="font-body text-sm leading-relaxed text-ink-light">
              The authentication service could not verify admin access. No beta access changes are available until the service recovers.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex rounded-lg border border-ink/10 bg-parchment px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:border-ink/20"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!access.user || access.status === 'unauthenticated') {
    redirect('/login?redirect=' + encodeURIComponent('/app/admin/beta'));
  }

  if (!access.isAdmin) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-parchment border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink">Beta Access Control</h1>
              <p className="mt-1 text-sm text-ink-light">
                Approve, revoke, and share beta access for ThinkHaven testers.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <Link
                href="/app"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-blue hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              >
                Dashboard
              </Link>
              <Link
                href="/monitoring"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-blue hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              >
                Monitoring
              </Link>
              <Link
                href="/app/admin/beta"
                className="rounded-md bg-terracotta/10 px-3 py-2 text-sm font-medium text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              >
                Beta access
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <BetaAccessControlCenter />
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Beta Access Control | ThinkHaven',
  description: 'Operate ThinkHaven beta access approvals, revocations, and invites.',
};
