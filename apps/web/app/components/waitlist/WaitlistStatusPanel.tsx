import Link from 'next/link';
import { ArrowRight, Clock, ListChecks, Mail, RefreshCw, ShieldOff } from 'lucide-react';

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
        title: 'Your invite is recorded',
        body: 'Sign in with the invited email. Workspace access opens after the beta access check confirms the account.',
      };
    case 'revoked':
      return {
        icon: ShieldOff,
        eyebrow: 'Access paused',
        title: 'This account is not currently approved',
        body: 'The workspace remains protected. Contact support if you expected this account to have beta access.',
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
        eyebrow: 'Access check unavailable',
        title: 'We could not check the beta access list',
        body: 'The access service is temporarily unavailable. Saved workspaces stay protected until the check succeeds.',
      };
    case 'guest':
      return {
        icon: fromInvite ? Mail : Clock,
        eyebrow: fromInvite ? 'Invite link opened' : 'Beta waitlist',
        title: fromInvite ? 'Sign in or join to continue' : 'You are on the waitlist path',
        body: fromInvite
          ? 'Create an account or sign in so the invite can be matched to your workspace access.'
          : 'ThinkHaven beta access opens gradually while saved decision work is reviewed for product capacity.',
      };
    case 'pending':
    default:
      return {
        icon: Clock,
        eyebrow: 'Pending approval',
        title: 'Your beta request is pending',
        body: 'You are signed in and on the list. We will email you when the account is approved for saved workspace access.',
      };
  }
}

function betaAccessSteps(status: WaitlistRecoveryStatus) {
  switch (status) {
    case 'pending':
      return [
        'Your request is on the beta access list.',
        'Approval is manual while saved workspaces are capacity-limited.',
        'You will receive an email when access is active.',
      ];
    case 'invited':
      return [
        'The invite link reached ThinkHaven.',
        'Sign in or create the account tied to the invite.',
        'Access opens after the account check succeeds.',
      ];
    case 'revoked':
      return [
        'This account is not approved for beta workspace access.',
        'No workspace access changes are made from this screen.',
        'Support can review the account status.',
      ];
    case 'unavailable':
      return [
        'The beta access service did not respond.',
        'Your workspace remains protected.',
        'Refresh the status check or contact support if it persists.',
      ];
    case 'missing':
      return [
        'Join the beta access list with your sign-in email.',
        'Keep using the guest trial while the request is reviewed.',
        'Approved accounts can save sessions and artifacts.',
      ];
    case 'guest':
    default:
      return [
        'Use the guest trial without an account.',
        'Join the beta access list when you need saved workspaces.',
        'Approved accounts can save sessions and artifacts.',
      ];
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
  const steps = betaAccessSteps(status);
  const primaryAction = status === 'guest' || status === 'missing'
    ? { href: '/signup', label: 'Sign up', icon: ArrowRight }
    : status === 'unavailable'
      ? { href: '/waitlist', label: 'Refresh status', icon: RefreshCw }
      : { href: '/login', label: 'Refresh sign-in', icon: RefreshCw };
  const PrimaryIcon = primaryAction.icon;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
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

            <div className="mt-6 border-t border-ink/10 pt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ListChecks className="size-4 text-terracotta" aria-hidden="true" />
                <h2>Beta access list</h2>
              </div>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-light">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-parchment text-xs font-semibold text-slate-blue">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryAction.href}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-terracotta px-4 py-2 text-sm font-semibold text-cream transition hover:bg-terracotta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40"
              >
                {primaryAction.label}
                <PrimaryIcon className="size-4" aria-hidden="true" />
              </Link>
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
