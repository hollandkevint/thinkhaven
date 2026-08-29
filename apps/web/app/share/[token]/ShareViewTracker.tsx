'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/events'

export default function ShareViewTracker({
  artifactId,
  found,
}: {
  artifactId: string | null
  found: boolean
}) {
  useEffect(() => {
    track({ event: 'share_page_viewed', properties: { artifact_id: artifactId, found } })
  }, [artifactId, found])

  return null
}
