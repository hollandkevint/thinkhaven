import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuthMetricsDashboard from '@/app/components/monitoring/AuthMetricsDashboard'
import { checkBetaAccess } from '@/lib/auth/beta-access'

export const dynamic = 'force-dynamic'

export default async function MonitoringPage() {
  const access = await checkBetaAccess({
    recordGate: false,
    requestPath: '/monitoring',
  })

  if (access.status === 'unavailable') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6" role="alert">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
            <span className="font-display text-xl font-medium text-terracotta">!</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-medium text-ink">
              Monitoring is unavailable
            </h1>
            <p className="font-body text-sm leading-relaxed text-ink-light">
              The authentication service is not configured for this environment. Monitoring data remains unavailable until access can be verified.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-lg border border-ink/10 bg-parchment px-4 py-2 font-display text-sm font-medium text-ink transition-colors hover:border-ink/20"
          >
            Go home
          </Link>
        </div>
      </div>
    )
  }

  if (!access.user || access.status === 'unauthenticated') {
    redirect('/login?redirect=' + encodeURIComponent('/monitoring'))
  }

  if (!access.isAdmin) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-parchment shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-ink">Authentication Monitoring</h1>
              <p className="text-sm text-ink-light mt-1">
                Real-time authentication metrics and security monitoring
              </p>
            </div>
            <nav className="flex space-x-4">
              <a
                href="/app"
                className="text-slate-blue hover:text-ink px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="/monitoring"
                className="bg-terracotta/10 text-terracotta px-3 py-2 rounded-md text-sm font-medium"
              >
                Monitoring
              </a>
              <a
                href="/app/admin/beta"
                className="text-slate-blue hover:text-ink px-3 py-2 rounded-md text-sm font-medium"
              >
                Beta access
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-8">
        <AuthMetricsDashboard />
      </main>

      <footer className="bg-parchment border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center text-sm text-slate-blue">
            <p>
              Authentication monitoring powered by ThinkHaven •
              Data retention: 7 days •
              Updates every 30 seconds
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const metadata = {
  title: 'Authentication Monitoring | ThinkHaven',
  description: 'Real-time authentication metrics and security monitoring dashboard',
}
