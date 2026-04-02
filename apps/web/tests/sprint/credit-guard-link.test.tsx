/**
 * RED-GREEN TDD: CreditGuard Links to /pricing (Task 1.4)
 *
 * CreditGuard should link to /pricing, not show "Coming Soon" disabled button.
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Task 1.4: CreditGuard links to /pricing', () => {
  const creditGuardPath = resolve(__dirname, '../../app/components/monetization/CreditGuard.tsx')
  const source = readFileSync(creditGuardPath, 'utf-8')

  it('contains Link to /pricing', () => {
    expect(source).toContain('href="/pricing"')
  })

  it('does NOT contain "Coming Soon" text', () => {
    expect(source.toLowerCase()).not.toContain('coming soon')
  })

  it('does NOT have disabled purchase button', () => {
    // The old code had: disabled className="..." Purchase Credits (Coming Soon)
    // Should no longer have a disabled purchase button
    expect(source).not.toMatch(/disabled[^>]*>.*Purchase Credits/s)
  })

  it('uses Button asChild with Link pattern', () => {
    // Should use the Button asChild + Link pattern for Next.js routing
    expect(source).toContain('asChild')
    expect(source).toContain('<Link href="/pricing">')
  })
})
