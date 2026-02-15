'use client'

interface HandoffAnnotationProps {
  fromSpeaker: string
  toSpeaker: string
  reason: string
}

export default function HandoffAnnotation({
  fromSpeaker,
  toSpeaker,
  reason,
}: HandoffAnnotationProps) {
  return (
    <div className="board-handoff" role="separator" aria-label={`${fromSpeaker} brought in ${toSpeaker}`}>
      <span>
        {fromSpeaker} brought in {toSpeaker} &mdash; {reason}
      </span>
    </div>
  )
}
