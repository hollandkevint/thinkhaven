import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer'

vi.mock('@/app/components/chat/MermaidBlock', () => ({
  default: ({ code }: { code: string }) => (
    <div data-testid="mermaid-block">{code}</div>
  ),
}))

describe('MarkdownRenderer', () => {
  it('renders representative markdown without passing removed props to ReactMarkdown', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let container: HTMLElement | undefined

    expect(() => {
      const result = render(
        <MarkdownRenderer
          content={`# Decision Brief

This is a paragraph with **strong evidence**, [a link](https://thinkhaven.co), and inline \`risk_score\`.

> This assumption breaks if retention is weak.

- Artifact
- Decision
- Confidence

1. Gather evidence
2. Name the decision

\`\`\`ts
const confidence = 0.84
\`\`\`

| Artifact | Confidence |
| --- | --- |
| Decision brief | High |

\`\`\`mermaid
flowchart TD
  A[Input] --> B[Decision]
\`\`\`
`}
        />
      )
      container = result.container
    }).not.toThrow()

    expect(screen.getByText('Decision Brief')).toBeInTheDocument()
    expect(screen.getByText('This assumption breaks if retention is weak.')).toBeInTheDocument()
    expect(screen.getByText('risk_score').closest('pre')).toBeNull()
    expect(container?.querySelector('ol')).toBeInTheDocument()
    expect(container?.textContent).toContain('const confidence = 0.84')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Decision brief')).toBeInTheDocument()
    expect(screen.getByTestId('mermaid-block')).toHaveTextContent('flowchart TD')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
