import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try ThinkHaven - Free AI Business Strategy Session',
  description: 'Pressure-test a real decision with Mary and the ThinkHaven board. Try 10 free messages, no signup required.',
}

export default function TryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout is minimal - page.tsx handles its own layout now
  return <>{children}</>
}
