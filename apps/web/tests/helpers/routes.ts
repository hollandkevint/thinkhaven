/**
 * Route Constants
 *
 * ALL route paths should be defined here.
 * When routes change, update here once - all tests will be fixed.
 *
 * @example
 * import { ROUTES } from '../helpers/routes';
 * await page.goto(ROUTES.login);
 */

export const ROUTES = {
  // ===================
  // PUBLIC ROUTES
  // (No authentication required)
  // ===================

  /** Landing page - main marketing page */
  landing: '/',

  /** Login page */
  login: '/login',

  /** Signup page */
  signup: '/signup',

  /** Guest chat experience - 10 free messages */
  try: '/try',

  /** Strategic thinking assessment quiz */
  assessment: '/assessment',

  /** Assessment results page */
  assessmentResults: '/assessment/results',

  /** Resend email confirmation */
  resendConfirmation: '/resend-confirmation',

  /** Stripe checkout success */
  validateSuccess: '/validate/success',

  // ===================
  // PROTECTED ROUTES
  // (Require authentication)
  // ===================

  /** Dashboard - main authenticated view */
  app: '/app',

  /** Create new session - auto-redirects to workspace */
  appNew: '/app/new',

  /** Workspace for a specific session */
  appSession: (sessionId: string) => `/app/session/${sessionId}`,

  /** Account settings */
  appAccount: '/app/account',

  // ===================
  // OAUTH ROUTES
  // ===================

  /** OAuth callback handler */
  authCallback: '/auth/callback',

  // ===================
  // ADMIN ROUTES
  // ===================

  /** System monitoring dashboard */
  monitoring: '/monitoring',

  // ===================
  // LEGACY ROUTES
  // (Should redirect to new routes)
  // ===================
  legacy: {
    /** OLD: /dashboard → NEW: /app */
    dashboard: '/dashboard',

    /** OLD: /workspace/[id] → NEW: /app/session/[id] */
    workspace: (id: string) => `/workspace/${id}`,

    /** OLD: /account → NEW: /app/account */
    account: '/account',

    /** OLD: /bmad → NEW: /app/new */
    bmad: '/bmad',
  },

  // ===================
  // API ROUTES
  // (For mocking/intercepting)
  // ===================
  api: {
    /** Authenticated chat streaming */
    chatStream: '/api/chat/stream',

    /** Guest chat streaming */
    chatGuest: '/api/chat/guest',

    /** Chat export */
    chatExport: '/api/chat/export',

    /** BMad session operations */
    bmad: '/api/bmad',

    /** User credit balance */
    creditsBalance: '/api/credits/balance',

    /** Assessment submission */
    assessmentSubmit: '/api/assessment/submit',

    /** Stripe checkout */
    checkout: '/api/checkout/idea-validation',

    /** Trial feedback */
    feedback: '/api/feedback/trial',

    /** System monitoring */
    monitoringAlerts: '/api/monitoring/alerts',
    authMetrics: '/api/monitoring/auth-metrics',
  },
};

/**
 * URL patterns for route matching in tests
 */
export const ROUTE_PATTERNS = {
  /** Matches any session ID */
  appSession: /\/app\/session\/[a-f0-9-]+/,

  /** Matches any workspace (legacy) */
  workspace: /\/workspace\/[a-f0-9-]+/,

  /** Login page (with or without query params) */
  login: /\/login(\?.*)?$/,

  /** App dashboard (with or without trailing slash) */
  app: /\/app\/?$/,
};

/**
 * Helper to check if URL matches a protected route
 */
export function isProtectedRoute(url: string): boolean {
  return url.startsWith('/app') || url.startsWith('/monitoring');
}

/**
 * Helper to check if URL is a legacy route that should redirect
 */
export function isLegacyRoute(url: string): boolean {
  return (
    url.startsWith('/dashboard') ||
    url.startsWith('/workspace') ||
    url === '/account' ||
    url === '/bmad'
  );
}

/**
 * Get expected redirect for legacy routes
 */
export function getLegacyRedirect(legacyUrl: string): string | null {
  if (legacyUrl === '/dashboard') return '/app';
  if (legacyUrl === '/account') return '/app/account';
  if (legacyUrl === '/bmad') return '/app/new';

  const workspaceMatch = legacyUrl.match(/\/workspace\/([a-f0-9-]+)/);
  if (workspaceMatch) return `/app/session/${workspaceMatch[1]}`;

  return null;
}

/**
 * All public routes for smoke testing
 */
export const PUBLIC_ROUTES = [
  { name: 'Landing', path: ROUTES.landing },
  { name: 'Login', path: ROUTES.login },
  { name: 'Signup', path: ROUTES.signup },
  { name: 'Try (Guest)', path: ROUTES.try },
  { name: 'Assessment', path: ROUTES.assessment },
  { name: 'Resend Confirmation', path: ROUTES.resendConfirmation },
];

/**
 * Protected routes that require auth (for redirect testing)
 */
export const PROTECTED_ROUTES = [
  { name: 'Dashboard', path: ROUTES.app },
  { name: 'New Session', path: ROUTES.appNew },
  { name: 'Account', path: ROUTES.appAccount },
];
