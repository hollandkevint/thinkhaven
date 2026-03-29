'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import DOMPurify from 'dompurify'

// Initialize mermaid with ThinkHaven theme colors
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#F5F0E6',
    primaryTextColor: '#2C2416',
    primaryBorderColor: '#C4785C',
    lineColor: '#6B7B8C',
    secondaryColor: '#FAF7F2',
    tertiaryColor: '#F5F0E6',
    fontFamily: 'Jost, sans-serif',
    fontSize: '14px',
  },
  securityLevel: 'strict',
})

let mermaidCounter = 0

interface MermaidBlockProps {
  code: string
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = `mermaid-${++mermaidCounter}`

    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, code)
        if (!cancelled) {
          // Sanitize SVG to prevent XSS (mermaid securityLevel:'strict' has had bypasses)
          const sanitized = DOMPurify.sanitize(renderedSvg, {
            USE_PROFILES: { svg: true, svgFilters: true },
          })
          setSvg(sanitized)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
          setSvg(null)
        }
        // Clean up mermaid's error element if it exists
        const errorEl = document.getElementById(`d${id}`)
        errorEl?.remove()
      }
    }

    render()
    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <div className="rounded-lg border border-rust/20 bg-rust/5 p-4">
        <p className="text-xs text-rust font-display mb-2">Diagram syntax error</p>
        <pre className="text-xs font-mono text-ink-light overflow-x-auto whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="rounded-lg bg-parchment border border-ink/8 p-8 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="rounded-lg bg-parchment border border-ink/8 p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
