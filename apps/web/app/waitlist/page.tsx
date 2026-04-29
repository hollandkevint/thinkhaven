import { BETA_INVITE_PARAM } from '@/lib/beta/invite-destinations';

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const fromInvite = Boolean(params[BETA_INVITE_PARAM]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="max-w-md text-center p-8 bg-cream rounded-2xl shadow-sm border border-ink/8">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-ink mb-4 font-display">
          {fromInvite ? 'Your beta request is pending' : "You're on the waitlist!"}
        </h1>
        <p className="text-ink-light mb-6">
          {fromInvite
            ? 'Your invite brought you to the right place. An operator still needs to approve access before the full app opens.'
            : 'Thanks for signing up for ThinkHaven beta. We are letting people in gradually to ensure everyone gets a great experience.'}
        </p>
        <p className="text-ink-light mb-6">
          We will email you when your spot opens up. This usually takes 1-3 days.
        </p>
        <div className="border-t border-ink/8 pt-6 mt-6">
          <p className="text-sm text-slate-blue">
            Questions? Email{' '}
            <a
              href="mailto:kevin@kevintholland.com"
              className="text-terracotta hover:underline"
            >
              kevin@kevintholland.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
