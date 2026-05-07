import { redirect } from 'next/navigation';
import { BETA_INVITE_PARAM } from '@/lib/beta/invite-destinations';
import { checkBetaAccess } from '@/lib/auth/beta-access';
import { getUserBetaAccessStatus } from '@/lib/beta/beta-status';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';
import WaitlistStatusPanel, {
  type WaitlistRecoveryStatus,
} from '@/app/components/waitlist/WaitlistStatusPanel';

export const dynamic = 'force-dynamic';

function readSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readMigratedMessages(value: string | string[] | undefined): number | null {
  const raw = readSingleParam(value);
  if (!raw) return null;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10) : null;
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const fromInvite = Boolean(params[BETA_INVITE_PARAM]);
  const migratedMessages = readMigratedMessages(params.migrated);
  const access = await checkBetaAccess({ recordGate: false });

  if (access.betaApproved) {
    redirect('/app');
  }

  if (access.status === 'unavailable') {
    return (
      <div className="min-h-screen bg-cream">
        <WaitlistStatusPanel status="unavailable" fromInvite={fromInvite} />
      </div>
    );
  }

  if (!access.user || access.status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-cream">
        <WaitlistStatusPanel
          status="guest"
          fromInvite={fromInvite}
          migratedMessages={migratedMessages}
        />
        <div className="mx-auto w-full max-w-xl px-6 pb-16">
          <WaitlistForm source={fromInvite ? 'beta_invite' : 'waitlist_page'} />
        </div>
      </div>
    );
  }

  const betaStatus = await getUserBetaAccessStatus(access.user);
  const record = betaStatus.record;

  if (betaStatus.status === 'approved') {
    redirect('/app');
  }

  const status: WaitlistRecoveryStatus = betaStatus.unavailable
    ? 'unavailable'
    : betaStatus.status;

  return (
    <div className="min-h-screen bg-cream">
      <WaitlistStatusPanel
        status={status}
        email={record?.email || access.user.email}
        joinedAt={record?.created_at}
        source={record?.source}
        invitedAt={record?.invite_copied_at || record?.last_invited_at}
        migratedMessages={migratedMessages}
        fromInvite={fromInvite}
      />
      {status === 'missing' && (
        <div className="mx-auto w-full max-w-xl px-6 pb-16">
          <WaitlistForm
            source={fromInvite ? 'beta_invite' : 'waitlist_page'}
            initialEmail={access.user.email}
          />
        </div>
      )}
    </div>
  );
}
