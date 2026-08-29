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
 *
 * SECURITY: record content is attacker-authored. Anyone can POST a record through
 * the public share API, and these lines are rendered back into Mary's opening
 * message on /try, which goes through MarkdownRenderer (anchors get target=_blank).
 * Everything returned here is therefore flattened to plain text -- link syntax
 * included -- so a crafted record cannot plant a clickable link on our own domain.
 */

export interface RecordSummary {
  /** One-or-two sentence framing of the decision under review. Plain text. */
  decision: string | null
  /** First bullet under "## Assumptions" -- the synthesizer leads with the load-bearing one. Plain text. */
  weakestAssumption: string | null
}

const MAX_LEN = 220

/**
 * Flatten untrusted markdown to plain text.
 *
 * Link and image syntax collapse to their label, so `[click](https://evil)` becomes
 * `click`. Remaining markdown punctuation is dropped rather than escaped: these
 * strings are display-only, never re-parsed for structure.
 */
export function toPlainText(text: string, maxLen = MAX_LEN): string {
  const flat = text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/<[^>]*>/g, '') // autolinks and raw html
    .replace(/[[\]()`*_~>|#]/g, '') // leftover markdown punctuation
    .replace(/\s+/g, ' ')
    .trim()

  return flat.length > maxLen ? `${flat.slice(0, maxLen - 1).trimEnd()}…` : flat
}

/**
 * The blockquote that belongs to this record's H1.
 *
 * Anchored deliberately: it starts at the H1 and stops at the first non-blank,
 * non-quote line. An off-template record must not borrow an unrelated quote from
 * further down the document as its OG description.
 */
function extractDecision(markdown: string): string | null {
  const lines = markdown.split('\n')
  const h1 = lines.findIndex((line) => /^#\s+\S/.test(line))
  if (h1 === -1) return null

  const quoted: string[] = []
  for (const line of lines.slice(h1 + 1)) {
    if (line.startsWith('>')) {
      quoted.push(line.replace(/^>\s?/, ''))
      continue
    }
    if (line.trim() === '') {
      // Blank lines are allowed before the quote, but end it once it has started.
      if (quoted.length > 0) break
      continue
    }
    break
  }

  const joined = quoted.join(' ').trim()
  if (!joined) return null

  const plain = toPlainText(joined)
  return plain || null
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

    const plain = toPlainText(value)
    return plain || null
  }

  return null
}

export function summarizeRecord(markdown: string): RecordSummary {
  return {
    decision: extractDecision(markdown),
    weakestAssumption: extractWeakestAssumption(markdown),
  }
}
