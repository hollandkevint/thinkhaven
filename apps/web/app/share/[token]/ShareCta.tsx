'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics/events'

/**
 * The share page's only conversion surface.
 *
 * Carries the record forward as `ref=<token>`; /try resolves the token server-side
 * (never from the URL text) so a crafted link cannot inject copy into Mary's opener.
 */
export default function ShareCta({
  artifactId,
  placement,
  label,
  token,
}: {
  artifactId: string | null
  placement: 'record' | 'not_found'
  label: string
  token?: string
}) {
  const href = token
    ? `/try?mode=plan-grill&ref=${encodeURIComponent(token)}&utm_source=share&utm_medium=decision_record`
    : '/try?mode=plan-grill&utm_source=share&utm_medium=decision_record'

  return (
    <Link
      href={href}
      onClick={() => track({ event: 'share_cta_clicked', properties: { artifact_id: artifactId, placement } })}
      className="inline-block rounded-lg bg-terracotta px-5 py-2.5 font-display text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
    >
      {label}
    </Link>
  )
}
