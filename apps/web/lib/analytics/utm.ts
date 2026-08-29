/**
 * UTM params captured on arrival, attached to funnel-entry events.
 *
 * Deliberately excludes the /share `ref` token. That token is the only access
 * control on a decision record, and the record holds the full body plus any
 * captured lead email -- so it must not reach PostHog or bmad_sessions.utm.
 * `utm_source=share` already identifies share-driven arrivals.
 */
export interface UtmProperties {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

const MAX_VALUE_CHARS = 120

/**
 * Read UTM params off an arrival URL.
 *
 * Values are attacker-supplied query strings that end up in analytics and a jsonb
 * column, so they are length-capped. Absent params are omitted, not set to empty
 * strings, so `Object.keys(...).length === 0` means "no attribution".
 */
export function readUtm(params: URLSearchParams): UtmProperties {
  const utm: UtmProperties = {}

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) utm[key] = value.slice(0, MAX_VALUE_CHARS)
  }

  return utm
}
