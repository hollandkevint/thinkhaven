'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { HelpCircle, X } from 'lucide-react'

interface BoardMember {
  name: string
  role: string
  shows_up: string
}

const BOARD_MEMBERS: BoardMember[] = [
  {
    name: 'Mary',
    role: 'The strategist',
    shows_up: 'Always. She frames the decision and picks which advisors to bring in.',
  },
  {
    name: 'Victoria',
    role: 'Devil’s advocate',
    shows_up: 'When the case feels too clean. She argues the opposite of your stated position.',
  },
  {
    name: 'Casey',
    role: 'Customer-side counsel',
    shows_up: 'When the plan is internal-facing. She asks what the buyer would actually do.',
  },
  {
    name: 'Elaine',
    role: 'Operations realist',
    shows_up: 'When the path involves people, process, or change management.',
  },
  {
    name: 'Omar',
    role: 'Numbers',
    shows_up: 'When the decision turns on unit economics, capital, or pricing.',
  },
  {
    name: 'Taylor',
    role: 'Builder',
    shows_up: 'When the question is whether a thing can be shipped, and how fast.',
  },
]

interface BoardExplainerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BoardExplainerSheet({ open, onOpenChange }: BoardExplainerSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cream rounded-lg shadow-xl max-w-lg w-full mx-4 z-50 p-8 focus:outline-none max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="font-display text-xl font-medium text-ink mb-4">
            What is the board?
          </Dialog.Title>
          <Dialog.Description className="font-body text-sm text-ink-light leading-relaxed mb-6">
            A small panel of advisors who pressure-test the decision you&rsquo;re trying to make. Different
            members show up at different moments. None of them are here to validate you.
          </Dialog.Description>

          <div className="space-y-4">
            <h3 className="font-display text-sm font-medium uppercase tracking-[0.05em] text-ink-light">
              Who&rsquo;s on it
            </h3>
            <ul className="space-y-3">
              {BOARD_MEMBERS.map((member) => (
                <li key={member.name} className="font-body text-sm leading-relaxed text-ink">
                  <span className="font-display font-medium">{member.name}</span>
                  <span className="text-ink-light">, {member.role}.</span>{' '}
                  <span className="text-ink-light">{member.shows_up}</span>
                </li>
              ))}
            </ul>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface BoardExplainerTriggerProps {
  onClick: () => void
}

export function BoardExplainerTrigger({ onClick }: BoardExplainerTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-ink-light hover:text-ink transition-colors"
      aria-label="What is the board?"
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  )
}
