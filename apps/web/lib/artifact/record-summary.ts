/**
 * Decision-record summary extraction.
 *
 * The guest synthesizer (app/api/chat/guest/artifact/route.ts) emits a fixed shape:
 *
 *   # <title>
 *   > <the decision under review and where it stands>
 *   ## Resolved Decisions / Open Questions / Assumptions / ...
 *
 * These helpers pull the two lines worth surfacing off-page: the decision under
 * review (for OG/Twitter description) and the weakest assumption (for the CTA).
 * Records not written to the template degrade to nulls, never throw.
 */

export interface RecordSummary {
  /** One-or-two sentence framing of the decision under review. */
  decision: string | null
  /** First bullet under "## Assumptions" -- the synthesizer leads with the load-bearing one. */
  weakestAssumption: string | null
}

const MAX_LEN = 220

function tidy(text: string): string {
  const flat = text.replace(/\s+/g, ' ').replace(/[*_`]/g, '').trim()
  return flat.length > MAX_LEN ? `${flat.slice(0, MAX_LEN - 1).trimEnd()}…` : flat
}

function extractDecision(markdown: string): string | null {
  // Consecutive blockquote lines immediately following the H1.
  const lines = markdown.split('\n')
  const quoted: string[] = []
  for (const line of lines) {
    if (line.startsWith('>')) {
      quoted.push(line.replace(/^>\s?/, ''))
    } else if (quoted.length > 0) {
      break
    }
  }
  const joined = quoted.join(' ').trim()
  return joined ? tidy(joined) : null
}

function extractWeakestAssumption(markdown: string): string | null {
  const section = markdown.split(/^##\s+Assumptions\s*$/m)[1]
  if (!section) return null
  for (const line of section.split('\n')) {
    if (/^##\s/.test(line)) break
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (!bullet) continue
    const value = bullet[1].trim()
    if (!value || /^none surfaced/i.test(value)) return null
    return tidy(value)
  }
  return null
}

export function summarizeRecord(markdown: string): RecordSummary {
  return {
    decision: extractDecision(markdown),
    weakestAssumption: extractWeakestAssumption(markdown),
  }
}
