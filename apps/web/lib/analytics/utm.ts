/** UTM params captured on arrival, attached to funnel-entry events. */
export interface UtmProperties {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  ref_token?: string
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

const MAX_VALUE_CHARS = 120

/**
 * Read UTM params (plus the /share ref token) off an arrival URL.
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

  const ref = params.get('ref')?.trim()
  if (ref) utm.ref_token = ref.slice(0, MAX_VALUE_CHARS)

  return utm
}
