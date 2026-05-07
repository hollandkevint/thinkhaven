import { redirect } from 'next/navigation';

export default async function BetaAdminPage() {
  redirect('/app/admin/beta');
}

export const metadata = {
  title: 'Beta Access Control | ThinkHaven',
  description: 'Operate ThinkHaven beta access approvals, revocations, and invites.',
};
