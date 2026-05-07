import Link from 'next/link';
import { ArrowRight, Clock, Mail, RefreshCw, ShieldOff } from 'lucide-react';

export type WaitlistRecoveryStatus =
  | 'guest'
  | 'pending'
  | 'invited'
  | 'revoked'
  | 'missing'
  | 'unavailable';

interface WaitlistStatusPanelProps {
  status: WaitlistRecoveryStatus;
  email?: string;
  joinedAt?: string | null;
  source?: string | null;
  invitedAt?: string | null;
  migratedMessages?: number | null;
  fromInvite?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function statusContent(status: WaitlistRecoveryStatus, fromInvite: boolean | undefined) {
  switch (status) {
    case 'invited':
      return {
        icon: Mail,
        eyebrow: 'Invite received',
        title: 'Your beta request is queued',
        body: 'This invite brought you to the right place. Access still opens only after an operator approves your account.',
      };
    case 'revoked':
      return {
        icon: ShieldOff,
        eyebrow: 'Access paused',
        title: 'Your beta access needs support',
        body: 'This account is not currently approved for the beta. Contact support if you expected to have access.',
      };
    case 'missing':
      return {
        icon: Mail,
        eyebrow: 'No request found',
        title: 'Join the beta waitlist',
        body: 'We could not find a beta request for this account yet. Join the list with the email you use to sign in.',
      };
    case 'unavailable':
      return {
        icon: RefreshCw,
        eyebrow: 'Status unavailable',
        title: 'We could not check beta access',
        body: 'The access service is temporarily unavailable. Try again in a moment or contact support if this persists.',
      };
    case 'guest':
      return {
        icon: fromInvite ? Mail : Clock,
        eyebrow: fromInvite ? 'Invite link opened' : 'Beta waitlist',
        title: fromInvite ? 'Sign in or join to continue' : 'You are on the waitlist path',
        body: fromInvite
          ? 'Create an account or sign in so we can connect this invite with your beta request.'
          : 'ThinkHaven beta access opens gradually while the product is tuned for early users.',
      };
    case 'pending':
    default:
      return {
        icon: Clock,
        eyebrow: 'Pending approval',
        title: 'Your beta request is pending',
        body: 'You are signed in and on the list. We will email you when your account is approved.',
      };
  }
}

export default function WaitlistStatusPanel({
  status,
  email,
  joinedAt,
  source,
  invitedAt,
  migratedMessages,
  fromInvite,
}: WaitlistStatusPanelProps) {
  const content = statusContent(status, fromInvite);
  const Icon = content.icon;
  const joinedDate = formatDate(joinedAt);
  const invitedDate = formatDate(invitedAt);

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="rounded-lg border border-ink/10 bg-cream p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-12 items-center justify-center rounded-md bg-terracotta/10 text-terracotta">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-slate-blue">
              {content.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{content.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-light">{content.body}</p>

            {(email || joinedDate || invitedDate || source || migratedMessages) && (
              <dl className="mt-6 grid gap-3 border-t border-ink/10 pt-5 text-sm sm:grid-cols-2">
                {email && (
                  <div>
                    <dt className="font-medium text-ink">Account</dt>
                    <dd className="mt-1 break-words text-ink-light">{email}</dd>
                  </div>
                )}
                {joinedDate && (
                  <div>
                    <dt className="font-medium text-ink">Joined</dt>
                    <dd className="mt-1 text-ink-light">{joinedDate}</dd>
                  </div>
                )}
                {invitedDate && (
                  <div>
                    <dt className="font-medium text-ink">Invite marked</dt>
                    <dd className="mt-1 text-ink-light">{invitedDate}</dd>
                  </div>
                )}
                {source && (
                  <div>
                    <dt className="font-medium text-ink">Source</dt>
                    <dd className="mt-1 text-ink-light">{source.replace(/_/g, ' ')}</dd>
                  </div>
                )}
                {typeof migratedMessages === 'number' && migratedMessages > 0 && (
                  <div>
                    <dt className="font-medium text-ink">Saved conversation</dt>
                    <dd className="mt-1 text-ink-light">
                      {migratedMessages} message{migratedMessages === 1 ? '' : 's'} saved
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {status === 'guest' || status === 'missing' ? (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-cream transition hover:bg-terracotta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
                >
                  Sign up
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-parchment px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
                >
                  Refresh sign-in
                  <RefreshCw className="size-4" aria-hidden="true" />
                </Link>
              )}
              <a
                href="mailto:kevin@kevintholland.com?subject=ThinkHaven%20beta%20access"
                className="inline-flex items-center justify-center rounded-md border border-ink/10 px-4 py-2 text-sm font-semibold text-slate-blue transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
