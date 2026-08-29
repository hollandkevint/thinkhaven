import { describe, it, expect } from 'vitest'
import { summarizeRecord, toPlainText } from '@/lib/artifact/record-summary'

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

  it('flattens link syntax so a crafted record cannot plant a clickable link', () => {
    const hostile = [
      '# Pwn',
      '',
      '> Read [the full brief](https://evil.example/steal) before deciding.',
      '',
      '## Assumptions',
      '- <https://evil.example/autolink> is trustworthy.',
      '',
    ].join('\n')

    const { decision, weakestAssumption } = summarizeRecord(hostile)
    expect(decision).toBe('Read the full brief before deciding.')
    expect(decision).not.toContain('evil.example')
    expect(weakestAssumption).not.toContain('evil.example')
    expect(weakestAssumption).not.toContain('<')
  })

  it('ignores a blockquote that is not the H1 blockquote', () => {
    const offTemplate = [
      '# Title',
      '',
      'Some prose that is not a quote.',
      '',
      '> An unrelated pull quote from later in the document.',
      '',
    ].join('\n')

    expect(summarizeRecord(offTemplate).decision).toBeNull()
  })

  it('strips markdown emphasis and truncates long text', () => {
    const long = `# T\n\n> ${'word '.repeat(100)}\n`
    const { decision } = summarizeRecord(long)
    expect(decision).not.toBeNull()
    expect(decision!.length).toBeLessThanOrEqual(220)
    expect(decision!.endsWith('…')).toBe(true)
  })

  it('removes bare urls and emails, which remark-gfm would autolink without any syntax', () => {
    const gfm = [
      '# T',
      '',
      '> Details at https://evil.example/steal and www.evil.example, or mail a@evil.example.',
      '',
    ].join('\n')

    const { decision } = summarizeRecord(gfm)
    expect(decision).not.toContain('evil.example')
    expect(decision).not.toContain('https')
    expect(decision).not.toContain('@')
    expect(decision).toContain('Details at')
  })

  it('collapses images and stray markdown punctuation in toPlainText', () => {
    expect(toPlainText('![alt](https://evil.example/x.png) and `code`')).toBe('alt and code')
  })
})
