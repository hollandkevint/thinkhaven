import { Badge } from '@/components/ui/badge';
import type { BetaLifecycleStatus } from '@/lib/beta/beta-access-types';

const statusStyles: Record<BetaLifecycleStatus, string> = {
  pending: 'border-mustard/30 bg-mustard/10 text-mustard',
  approved: 'border-forest/30 bg-forest/10 text-forest',
  revoked: 'border-rust/30 bg-rust/10 text-rust',
};

export default function BetaAccessStatusBadge({
  status,
}: {
  status: BetaLifecycleStatus;
}) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {status}
    </Badge>
  );
}
