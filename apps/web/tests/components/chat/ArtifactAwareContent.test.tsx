import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ArtifactAwareContent from '@/app/components/chat/ArtifactAwareContent'
import { ArtifactProvider } from '@/lib/artifact'

vi.mock('@/app/components/chat/MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}))

describe('ArtifactAwareContent', () => {
  it('parses artifact markers into visible artifact cards', async () => {
    render(
      <ArtifactProvider initialSessionId="session-123">
        <ArtifactAwareContent
          sessionId="session-123"
          content={`Here is the generated glossary.

<artifact type="domain-context" title="Domain Context">
# Glossary

- Customer: the buyer.
</artifact>`}
        />
      </ArtifactProvider>
    )

    const markdownBlocks = screen.getAllByTestId('markdown-content')
    expect(markdownBlocks[0]).not.toHaveTextContent('<artifact')
    expect(markdownBlocks[0]).toHaveTextContent('Domain Context')
    await waitFor(() => {
      expect(screen.getAllByText('Domain Context').length).toBeGreaterThan(0)
    })
  })

  it('renders cleaned markdown without artifact cards outside the artifact provider', () => {
    render(
      <ArtifactAwareContent
        sessionId="session-123"
        content={`Done.

<artifact type="decision-record" title="Decision Record">
# Decision
</artifact>`}
      />
    )

    expect(screen.getByTestId('markdown-content')).not.toHaveTextContent('<artifact')
    expect(screen.queryByRole('button', { name: /decision record/i })).not.toBeInTheDocument()
  })
})
