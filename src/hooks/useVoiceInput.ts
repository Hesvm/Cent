import { useState, useRef, useCallback } from 'react'

interface UseVoiceInputResult {
  isSupported: boolean
  isRecording: boolean
  error: string | null
  startRecording: (onResult: (transcript: string) => void) => void
  stopRecording: () => void
}

export function useVoiceInput(): UseVoiceInputResult {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = typeof window !== 'undefined' ? (window as any) : null
  const SpeechRecognition = w ? (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) : null

  const isSupported = SpeechRecognition !== null

  const startRecording = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!SpeechRecognition) return

      setError(null)
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript ?? ''
        if (transcript.trim()) {
          onResult(transcript.trim())
        } else {
          setError("I didn't catch that. Try again?")
          setTimeout(() => setError(null), 3000)
        }
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setError("Couldn't hear you. Try again.")
        setTimeout(() => setError(null), 3000)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)

      // Max 10 seconds
      timeoutRef.current = setTimeout(() => {
        recognition.stop()
      }, 10000)
    },
    [SpeechRecognition]
  )

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsRecording(false)
  }, [])

  return { isSupported, isRecording, error, startRecording, stopRecording }
}
