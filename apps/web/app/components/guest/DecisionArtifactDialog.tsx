'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, Copy, Check, Link2, Loader2, X, Mail } from 'lucide-react'
import MarkdownRenderer from '../chat/MarkdownRenderer'

export interface DecisionArtifact {
  title: string
  content: string
}

interface DecisionArtifactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artifact: DecisionArtifact | null
  loading: boolean
  error: string | null
  pathway: string
  onRetry?: () => void
}

function slugifyFilename(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || 'decision-record'}.md`
}

export default function DecisionArtifactDialog({
  open,
  onOpenChange,
  artifact,
  loading,
  error,
  pathway,
  onRetry,
}: DecisionArtifactDialogProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const handleDownload = () => {
    if (!artifact) return
    const blob = new Blob([artifact.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = slugifyFilename(artifact.title)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!artifact) return
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setShareError('Could not copy to clipboard.')
    }
  }

  const createShare = async (withEmail?: string) => {
    if (!artifact) return null
    const res = await fetch('/api/artifact/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: artifact.title,
        content: artifact.content,
        pathway,
        source: 'guest',
        email: withEmail,
        // Reuse the existing row (e.g. when emailing after already creating a link) instead of minting a duplicate.
        token: shareToken ?? undefined,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    const data = await res.json()
    if (data.token) setShareToken(data.token)
    return (data.absoluteUrl || `${window.location.origin}${data.url}`) as string
  }

  const handleShare = async () => {
    setSharing(true)
    setShareError(null)
    try {
      const url = await createShare()
      setShareUrl(url)
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Could not create a share link.')
    } finally {
      setSharing(false)
    }
  }

  const handleCopyShare = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      /* no-op */
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setEmailState('saving')
    try {
      const url = await createShare(email.trim())
      if (url) setShareUrl(url)
      setEmailState('done')
    } catch {
      setEmailState('error')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-ink/10 bg-cream shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-divider px-6 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-lg font-semibold text-ink">
                Your decision record
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-ink-light">
                A defensible summary of what you decided, what is still open, and your next move.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex-shrink-0 rounded-md p-1 text-ink-light transition-colors hover:bg-parchment hover:text-ink"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" data-ph-mask>
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-light">
                <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                <p className="text-sm">Synthesizing your decision record…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-sm text-rust">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="rounded-lg border border-ink/15 bg-parchment px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {!loading && !error && artifact && (
              <MarkdownRenderer content={artifact.content} />
            )}
          </div>

          {!loading && !error && artifact && (
            <div className="flex-shrink-0 space-y-3 border-t border-divider bg-parchment/50 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
                >
                  <Download className="h-4 w-4" /> Download markdown
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-cream px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
                >
                  {copied ? <Check className="h-4 w-4 text-forest" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {shareUrl ? (
                  <button
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-2 rounded-lg border border-forest/30 bg-forest/10 px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest/15"
                  >
                    {shareCopied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    {shareCopied ? 'Link copied' : 'Copy share link'}
                  </button>
                ) : (
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-cream px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25 disabled:opacity-60"
                  >
                    {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Get shareable link
                  </button>
                )}
              </div>

              {shareUrl && (
                <p className="break-all rounded-lg border border-ink/10 bg-cream px-3 py-2 text-xs text-ink-light">
                  {shareUrl}
                </p>
              )}
              {shareError && <p className="text-xs text-rust">{shareError}</p>}

              {emailState === 'done' ? (
                <p className="flex items-center gap-2 text-sm text-forest">
                  <Check className="h-4 w-4" /> Sent. Check your inbox for the link and more on ThinkHaven.
                </p>
              ) : (
                <form onSubmit={handleEmail} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label htmlFor="artifact-email" className="text-sm text-ink-light">
                    Email it to yourself and learn more:
                  </label>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      id="artifact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink-light/60 focus:border-terracotta focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={emailState === 'saving' || !email.trim()}
                      className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25 disabled:opacity-60"
                    >
                      {emailState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Email me this
                    </button>
                  </div>
                </form>
              )}
              {emailState === 'error' && (
                <p className="text-xs text-rust">Could not send right now. Your link is still available above.</p>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
