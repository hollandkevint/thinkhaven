'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={`prose prose-sm max-w-none dark:prose-invert prose-headings:text-primary prose-p:text-secondary-foreground prose-p:leading-relaxed prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-50 prose-pre:border prose-pre:border-divider prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic prose-ul:text-secondary-foreground prose-ol:text-secondary-foreground prose-li:mb-1 ${className}`}
      components={{
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : 'text'
          
          return !inline ? (
            <div className="relative group">
              {/* Copy button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded p-1.5 text-xs border shadow-sm"
                title="Copy code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Language label */}
              {language !== 'text' && (
                <div className="absolute top-2 left-2 bg-gray-800/80 text-white px-2 py-1 rounded text-xs font-mono">
                  {language}
                </div>
              )}
              
              <SyntaxHighlighter
                style={tomorrow}
                language={language}
                PreTag="div"
                className="rounded-lg !bg-gray-900 !p-4 !m-0 text-sm"
                showLineNumbers={String(children).split('\n').length > 5}
                lineNumberStyle={{
                  color: '#6B7280',
                  paddingRight: '1em',
                  minWidth: '2.5em'
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
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
          <p className="text-secondary-foreground leading-relaxed mb-4 last:mb-0" {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul className="space-y-2 mb-4 pl-0" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="space-y-2 mb-4 pl-0 counter-reset-item" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ordered, ...props }) => (
          <li className="text-secondary-foreground flex items-start gap-3 relative" {...props}>
            {ordered ? (
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                {/* Counter will be handled by CSS */}
              </span>
            ) : (
              <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
            )}
            <span className="flex-1 -mt-0.5">{children}</span>
          </li>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote className="border-l-4 border-terracotta bg-terracotta/5 pl-4 py-3 my-4 rounded-r-lg" {...props}>
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
          <em className="italic text-secondary-foreground" {...props}>
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
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-ink/10 border border-ink/10 rounded-lg" {...props}>
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
          <tbody className="bg-white divide-y divide-ink/10" {...props}>
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
          <td className="px-4 py-3 text-sm text-secondary-foreground" {...props}>
            {children}
          </td>
        ),
        hr: ({ ...props }) => (
          <hr className="my-6 border-t border-divider" {...props} />
        ),
        // Custom components for strategic content
        img: ({ src, alt, ...props }) => (
          <div className="my-4">
            <img 
              src={src} 
              alt={alt}
              className="rounded-lg border border-divider shadow-sm max-w-full h-auto"
              {...props}
            />
            {alt && (
              <p className="text-xs text-secondary text-center mt-2 italic">{alt}</p>
            )}
          </div>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  )
}