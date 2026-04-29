import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import BetaAccessControlCenter from '@/app/components/admin/BetaAccessControlCenter';

export default async function BetaAdminPage() {
  const access = await checkBetaAccess();

  if (access.status === 'unavailable') {
    throw new Error('Authentication service unavailable');
  }

  if (!access.user || access.status === 'unauthenticated') {
    redirect('/login?redirect=' + encodeURIComponent('/admin/beta'));
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
                href="/admin/beta"
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
