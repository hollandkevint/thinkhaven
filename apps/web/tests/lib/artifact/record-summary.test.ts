import { describe, it, expect } from 'vitest'
import { summarizeRecord } from '@/lib/artifact/record-summary'

const RECORD = `# Sunset the legacy importer

> We are deciding whether to sunset the legacy CSV importer in Q4.
> Leaning yes, but the migration path for enterprise accounts is unresolved.

## Resolved Decisions
- Ship the new importer behind a flag.

## Assumptions
- Enterprise accounts can migrate in under a week.
- Support volume stays flat.

## Risks
- None surfaced yet.
`

describe('summarizeRecord', () => {
  it('pulls the decision blockquote and the first assumption', () => {
    const { decision, weakestAssumption } = summarizeRecord(RECORD)
    expect(decision).toBe(
      'We are deciding whether to sunset the legacy CSV importer in Q4. Leaning yes, but the migration path for enterprise accounts is unresolved.'
    )
    expect(weakestAssumption).toBe('Enterprise accounts can migrate in under a week.')
  })

  it('treats an empty assumptions section as no assumption', () => {
    const { weakestAssumption } = summarizeRecord('# T\n\n## Assumptions\n- None surfaced yet.\n')
    expect(weakestAssumption).toBeNull()
  })

  it('returns nulls for off-template records instead of throwing', () => {
    expect(summarizeRecord('just some prose')).toEqual({ decision: null, weakestAssumption: null })
  })

  it('strips markdown emphasis and truncates long text', () => {
    const long = `# T\n\n> ${'word '.repeat(100)}\n`
    const { decision } = summarizeRecord(long)
    expect(decision).not.toBeNull()
    expect(decision!.length).toBeLessThanOrEqual(220)
    expect(decision!.endsWith('…')).toBe(true)
  })
})
