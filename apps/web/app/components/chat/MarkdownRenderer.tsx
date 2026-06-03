'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidBlock from './MermaidBlock'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'

// Register only the languages ThinkHaven users will encounter
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)

interface MarkdownRendererProps {
  content: string
  className?: string
}

type HastProperties = {
  className?: string | string[]
}

type HastNode = {
  type?: string
  tagName?: string
  value?: string
  properties?: HastProperties
  children?: HastNode[]
}

function getTextContent(node: HastNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  return node.children?.map(getTextContent).join('') || ''
}

function getClassName(node: HastNode | undefined): string {
  const className = node?.properties?.className
  if (Array.isArray(className)) return className.join(' ')
  return className || ''
}

function getCodeNode(preNode: HastNode | undefined): HastNode | undefined {
  return preNode?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code'
  )
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative group">
      {/* Copy button */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(code)
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-cream/80 hover:bg-cream text-slate-blue hover:text-ink rounded p-1.5 text-xs border shadow-sm"
        title="Copy code"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Language label */}
      {language !== 'text' && (
        <div className="absolute top-2 left-2 bg-ink/80 text-cream px-2 py-1 rounded text-xs font-mono">
          {language}
        </div>
      )}

      <SyntaxHighlighter
        style={tomorrow}
        language={language}
        PreTag="div"
        className="rounded-lg !bg-ink !p-4 !m-0 text-sm"
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{
          color: 'var(--slate-blue)',
          paddingRight: '1em',
          minWidth: '2.5em'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink-light prose-p:leading-relaxed prose-code:bg-parchment prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-parchment prose-pre:border prose-pre:border-divider prose-blockquote:border prose-blockquote:border-ink/10 prose-blockquote:bg-parchment prose-blockquote:rounded-lg prose-blockquote:italic prose-ul:text-ink-light prose-ol:text-ink-light prose-li:mb-1 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ node, children, ...props }) => {
            const codeNode = getCodeNode(node as HastNode | undefined)
            const className = getClassName(codeNode)
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : 'text'
            const code = getTextContent(codeNode).replace(/\n$/, '')

            if (!codeNode) {
              return (
                <pre className="rounded-lg border border-divider bg-parchment p-4" {...props}>
                  {children}
                </pre>
              )
            }

            // Render Mermaid diagrams as SVG instead of syntax-highlighted code
            if (language === 'mermaid') {
              return <MermaidBlock code={code} />
            }

            return <CodeBlock code={code} language={language} />
          },
          code: ({ children, node, className, ...props }) => {
            void node
            void className
            return (
              <code className="bg-parchment px-1.5 py-0.5 rounded text-sm font-mono text-ink" {...props}>
                {children}
              </code>
            )
          },
        h1: ({ children, ...props }) => (
          <h1 className="text-xl font-bold text-primary mb-4 mt-6 first:mt-0 pb-2 border-b border-divider" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-lg font-semibold text-primary mb-3 mt-5 first:mt-0 flex items-center gap-2" {...props}>
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-base font-medium text-primary mb-2 mt-4 first:mt-0" {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 className="text-sm font-medium text-primary mb-2 mt-3 first:mt-0" {...props}>
            {children}
          </h4>
        ),
        p: ({ children, ...props }) => (
          <p className="text-ink-light leading-relaxed mb-4 last:mb-0" {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul className="mb-4 list-disc space-y-2 pl-5 text-ink-light marker:text-terracotta" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="mb-4 list-decimal space-y-2 pl-5 text-ink-light marker:text-terracotta" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="pl-1 text-ink-light" {...props}>
            {children}
          </li>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote className="border border-ink/10 bg-parchment px-4 py-3 my-4 rounded-lg" {...props}>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
              <div className="flex-1 text-ink italic">
                {children}
              </div>
            </div>
          </blockquote>
        ),
        strong: ({ children, ...props }) => (
          <strong className="font-semibold text-primary" {...props}>
            {children}
          </strong>
        ),
        em: ({ children, ...props }) => (
          <em className="italic text-ink-light" {...props}>
            {children}
          </em>
        ),
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            className="text-terracotta hover:text-terracotta-hover underline decoration-terracotta/30 hover:decoration-terracotta/60 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
            <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ),
        table: ({ children, ...props }) => (
          <div className="my-4 max-w-full overflow-x-auto rounded-lg border border-ink/10">
            <table className="w-full min-w-[36rem] divide-y divide-ink/10" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-parchment" {...props}>
            {children}
          </thead>
        ),
        tbody: ({ children, ...props }) => (
          <tbody className="bg-cream divide-y divide-ink/10" {...props}>
            {children}
          </tbody>
        ),
        tr: ({ children, ...props }) => (
          <tr className="hover:bg-parchment" {...props}>
            {children}
          </tr>
        ),
        th: ({ children, ...props }) => (
          <th className="px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="px-4 py-3 text-sm text-ink-light" {...props}>
            {children}
          </td>
        ),
        hr: ({ ...props }) => (
          <hr className="my-6 border-t border-divider" {...props} />
        ),
        img: ({ src, alt, ...props }) => (
          <div className="my-4">
            <img
              src={src}
              alt={alt}
              className="rounded-lg border border-divider shadow-sm max-w-full h-auto"
              {...props}
            />
            {alt && (
              <p className="text-xs text-muted-foreground text-center mt-2 italic">{alt}</p>
            )}
          </div>
        )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
