import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpeakerMessage from '../../../app/components/board/SpeakerMessage'
import type { BoardMember, ChatMessage } from '../../../lib/ai/board-types'

const message: ChatMessage = {
  id: 'msg-1',
  role: 'assistant',
  content: 'Pressure-test the economics first.',
  timestamp: new Date().toISOString(),
  metadata: { speaker: 'victoria' },
}

const boardMember: BoardMember = {
  id: 'victoria',
  name: 'Victoria',
  role: 'Investor',
  worldview: 'Financial discipline',
  bias: 'Unit economics before narrative',
  voiceDescription: 'Direct investor scrutiny',
  color: '#D4A84B',
  isOptIn: false,
}

describe('SpeakerMessage', () => {
  it('renders speaker identity without the removed heavy side stripe', () => {
    const { container } = render(<SpeakerMessage message={message} boardMember={boardMember} />)

    expect(screen.getByText('Victoria')).toBeInTheDocument()
    expect(screen.getByText('Pressure-test the economics first.')).toBeInTheDocument()
    expect(container.querySelector('.board-speaker-message')).not.toHaveStyle({ borderLeftColor: boardMember.color })
  })
})
