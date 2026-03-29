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
  const isListeningRef = useRef(false)
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
      if (event.error !== 'aborted') {
        console.error('[SpeechRecognition] Error:', event.error)
      }
      isListeningRef.current = false
      setIsListening(false)
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    try {
      recognitionRef.current.start()
      isListeningRef.current = true
      setIsListening(true)
    } catch {
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return
    recognitionRef.current.stop()
  }, [])

  return { isListening, isSupported, start, stop }
}
