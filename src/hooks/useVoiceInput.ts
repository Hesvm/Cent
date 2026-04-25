import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState = 'idle' | 'listening' | 'recording' | 'processing' | 'reviewing' | 'error'

interface UseVoiceInputResult {
  state: VoiceState
  transcript: string
  errorMessage: string
  // legacy compat
  isRecording: boolean
  error: string | null
  isSupported: boolean
  start: () => void
  stop: () => void
  confirmTranscript: (text: string) => void
  dismissReview: () => void
  // legacy compat
  startRecording: (onResult: (t: string) => void) => void
  stopRecording: () => void
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function isWebSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech':            "I didn't catch that. Try again.",
  'not-allowed':          'Microphone access denied. Check your browser settings.',
  'network':              'No connection. Try typing instead.',
  'audio-capture':        'No microphone found on this device.',
  'aborted':              '',
  'empty-transcript':     "I didn't catch that. Try again.",
  'transcription-failed': "Couldn't transcribe. Try typing instead.",
  'file-too-large':       'Recording too long. Try a shorter message.',
  'service-not-allowed':  '', // triggers Groq fallback silently
  'unknown':              'Something went wrong. Try again.',
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useVoiceInput(): UseVoiceInputResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Callbacks set at call time
  const onReadyRef = useRef<((transcript: string) => void) | null>(null)

  // Web Speech
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const webSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // MediaRecorder (Groq path)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)

  const isSupported =
    isWebSpeechSupported() ||
    (typeof window !== 'undefined' && 'MediaRecorder' in window)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (webSpeechTimerRef.current) clearTimeout(webSpeechTimerRef.current)
      mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function handleError(code: string) {
    const msg = ERROR_MESSAGES[code] ?? ERROR_MESSAGES['unknown']
    if (msg) {
      setVoiceState('error')
      setErrorMessage(msg)
      setTimeout(() => {
        setVoiceState('idle')
        setErrorMessage('')
      }, 3000)
    } else {
      // Silent reset (e.g. 'aborted')
      setVoiceState('idle')
      setErrorMessage('')
    }
  }

  // ── Layer 1: Web Speech API ─────────────────────────────────────────────────
  function startWebSpeech() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    setVoiceState('listening')
    startTimeRef.current = Date.now()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      if (webSpeechTimerRef.current) clearTimeout(webSpeechTimerRef.current)
      const result = e.results[0]?.[0]
      const text: string = result?.transcript?.trim() ?? ''
      const conf: number = result?.confidence ?? 0

      if (!text) {
        handleError('no-speech')
        return
      }

      setTranscript(text)

      if (conf >= 0.70 || conf === 0) {
        // conf=0 on some browsers means unknown — trust it
        setVoiceState('idle')
        onReadyRef.current?.(text)
      } else {
        setVoiceState('reviewing')
      }
    }

    recognition.onerror = (e: { error: string }) => {
      if (webSpeechTimerRef.current) clearTimeout(webSpeechTimerRef.current)
      if (e.error === 'service-not-allowed') {
        // Fallback to Groq silently
        startGroqFlow()
        return
      }
      handleError(e.error)
    }

    recognition.onend = () => {
      if (webSpeechTimerRef.current) clearTimeout(webSpeechTimerRef.current)
    }

    recognition.start()
    recognitionRef.current = recognition

    // 10-second safety cap
    webSpeechTimerRef.current = setTimeout(() => {
      recognition.stop()
    }, 10000)
  }

  // ── Layer 2: Groq Whisper ───────────────────────────────────────────────────
  async function startGroqFlow() {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      handleError('not-allowed')
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    startTimeRef.current = Date.now()

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      streamRef.current = null

      const elapsed = Date.now() - startTimeRef.current
      if (elapsed < 1000 || chunksRef.current.length === 0) {
        handleError('no-speech')
        return
      }

      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
      if (blob.size === 0) {
        handleError('no-speech')
        return
      }

      setVoiceState('processing')

      try {
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const data = await response.json() as { error?: string }
          throw new Error(data.error ?? 'transcription-failed')
        }

        const data = await response.json() as { transcript: string; confidence: number | null }
        const text = data.transcript?.trim()

        if (!text) {
          handleError('empty-transcript')
          return
        }

        setTranscript(text)
        // Groq path: always show review
        setVoiceState('reviewing')
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          handleError('transcription-failed')
        } else {
          handleError('transcription-failed')
        }
      }
    }

    setVoiceState('recording')
    recorder.start(100) // collect data every 100ms

    // 60-second max
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, 60000)
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (isWebSpeechSupported()) {
      startWebSpeech()
    } else if (typeof MediaRecorder !== 'undefined') {
      startGroqFlow()
    } else {
      handleError('audio-capture')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    if (webSpeechTimerRef.current) clearTimeout(webSpeechTimerRef.current)
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    // If still in listening/recording without data, just reset
    if (voiceState === 'listening' || voiceState === 'recording') {
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed < 1000) {
        setVoiceState('idle')
      }
      // otherwise onstop handler will fire
    }
  }, [voiceState])

  const confirmTranscript = useCallback((text: string) => {
    setVoiceState('idle')
    setTranscript('')
    onReadyRef.current?.(text)
  }, [])

  const dismissReview = useCallback(() => {
    setVoiceState('idle')
    setTranscript('')
  }, [])

  // ── Legacy compat for InputBar ──────────────────────────────────────────────
  const startRecording = useCallback((onResult: (t: string) => void) => {
    onReadyRef.current = onResult
    start()
  }, [start])

  const stopRecording = useCallback(() => {
    stop()
  }, [stop])

  return {
    state: voiceState,
    transcript,
    errorMessage,
    isRecording: voiceState === 'listening' || voiceState === 'recording',
    error: errorMessage || null,
    isSupported,
    start,
    stop,
    confirmTranscript,
    dismissReview,
    startRecording,
    stopRecording,
  }
}
