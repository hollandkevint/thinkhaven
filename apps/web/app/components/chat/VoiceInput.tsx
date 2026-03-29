'use client'

import { Mic, MicOff } from 'lucide-react'
import { useSpeechRecognition } from '@/lib/voice/useSpeechRecognition'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const { isListening, isSupported, start, stop } = useSpeechRecognition({
    onTranscript,
  })

  // Don't render on unsupported browsers
  if (!isSupported) return null

  const handleClick = () => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'text-cream bg-rust'
          : 'text-slate-blue hover:text-ink hover:bg-parchment'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isListening ? 'Stop recording' : 'Voice input (Chrome/Edge)'}
    >
      {isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  )
}
