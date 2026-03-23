import type { LeanCanvas, LeanCanvasField } from '@/lib/canvas/lean-canvas-schema'

const CANVAS_LABELS: Record<LeanCanvasField, string> = {
  problem: 'Problem',
  customer_segments: 'Customer Segments',
  unique_value_proposition: 'Unique Value Proposition',
  solution: 'Solution',
  channels: 'Channels',
  revenue_streams: 'Revenue Streams',
  cost_structure: 'Cost Structure',
  key_metrics: 'Key Metrics',
  unfair_advantage: 'Unfair Advantage',
}

const FIELD_ORDER: LeanCanvasField[] = [
  'problem', 'customer_segments', 'unique_value_proposition',
  'solution', 'unfair_advantage', 'channels',
  'cost_structure', 'key_metrics', 'revenue_streams',
]

export function canvasToMarkdown(canvas: LeanCanvas, title?: string): string {
  const lines: string[] = []

  lines.push(`# ${title || 'Lean Canvas'}`)
  lines.push('')
  lines.push(`*Exported from ThinkHaven on ${new Date().toLocaleDateString()}*`)
  lines.push('')

  for (const field of FIELD_ORDER) {
    const label = CANVAS_LABELS[field]
    const value = canvas[field]

    lines.push(`## ${label}`)
    lines.push('')
    lines.push(value?.trim() || '*Not yet defined*')
    lines.push('')
  }

  return lines.join('\n')
}

export function downloadCanvasMarkdown(canvas: LeanCanvas, title?: string) {
  const markdown = canvasToMarkdown(canvas, title)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const filename = `${(title || 'lean-canvas').toLowerCase().replace(/\s+/g, '-')}.md`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
