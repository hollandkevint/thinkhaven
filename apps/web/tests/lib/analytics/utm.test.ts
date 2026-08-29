import { describe, it, expect } from 'vitest'
import { readUtm } from '@/lib/analytics/utm'

describe('readUtm', () => {
  it('reads utm params', () => {
    const utm = readUtm(new URLSearchParams('utm_source=share&utm_medium=decision_record'))
    expect(utm).toEqual({ utm_source: 'share', utm_medium: 'decision_record' })
  })

  it('never carries the share ref token, which is the record access secret', () => {
    const utm = readUtm(new URLSearchParams('utm_source=share&ref=deadbeefdeadbeef'))
    expect(JSON.stringify(utm)).not.toContain('deadbeef')
    expect(utm).toEqual({ utm_source: 'share' })
  })

  it('omits absent and blank params so an unattributed arrival is empty', () => {
    expect(readUtm(new URLSearchParams('utm_source=%20&mode=plan-grill'))).toEqual({})
  })

  it('caps attacker-supplied values', () => {
    const utm = readUtm(new URLSearchParams(`utm_campaign=${'x'.repeat(500)}`))
    expect(utm.utm_campaign).toHaveLength(120)
  })
})
