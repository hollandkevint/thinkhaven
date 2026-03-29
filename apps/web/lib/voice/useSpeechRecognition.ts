'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionOptions {
  lang?: string
  onTranscript?: (text: string) => void
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
}

export function useSpeechRecognition({
  lang = 'en-US',
  onTranscript,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  // Keep callback ref current without re-creating recognition
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Initialize on mount (must be in useEffect for SSR safety)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setIsSupported(false)
      return
    }
    setIsSupported(true)

    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build transcript from all results
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      onTranscriptRef.current?.(transcript)
    }

    recognition.onerror = (event) => {
      // "aborted" fires on manual stop, not a real error
      if (event.error !== 'aborted') {
        console.error('[SpeechRecognition] Error:', event.error)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // InvalidStateError if already running
      setIsListening(false)
    }
  }, [isListening])

  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    recognitionRef.current.stop()
  }, [isListening])

  return { isListening, isSupported, start, stop }
}
