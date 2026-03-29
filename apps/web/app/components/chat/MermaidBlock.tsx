'use client'

import dynamic from 'next/dynamic'

const MermaidBlockInner = dynamic(() => import('./MermaidBlockInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg bg-parchment border border-ink/8 p-8 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

interface MermaidBlockProps {
  code: string
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  return <MermaidBlockInner code={code} />
}
