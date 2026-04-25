import { useState, useRef, useEffect, useCallback } from 'react'
import { ScanBarcode, ArrowUp } from 'iconsax-react'
import type { TransactionType, InputState } from '../../types'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useAIParsing } from '../../hooks/useAIParsing'
import { useExpense } from '../../context/ExpenseContext'
import { ClarificationSheet } from './ClarificationSheet'
import { VoiceButton } from './VoiceButton'
import { PriceWheel } from '../ui/PriceWheel'

// ─── Transcript review card ────────────────────────────────────────────────────
function TranscriptReview({
  transcript,
  onConfirm,
  onDismiss,
}: {
  transcript: string
  onConfirm: (text: string) => void
  onDismiss: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(transcript)

  return (
    <div className="mx-2 mb-2 rounded-3xl bg-bg-card border border-[var(--color-border)] px-5 py-4 animate-clarify-up">
      <p className="text-[13px] text-text-secondary font-rounded mb-2">
        {editing ? 'Edit and correct:' : 'I heard:'}
      </p>

      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()) }}
          className="w-full text-[15px] text-text-primary bg-transparent focus:outline-none border-b border-[#E0E0E0] pb-1 mb-4 font-rounded"
        />
      ) : (
        <p className="text-[15px] text-text-primary font-rounded mb-4">"{transcript}"</p>
      )}

      <div className="flex gap-2">
        {editing ? (
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            className="flex-1 rounded-pill py-2.5 text-[14px] font-semibold font-rounded text-white bg-[#1A1A1A] transition-colors"
          >
            Submit ↑
          </button>
        ) : (
          <>
            <button
              onClick={() => onConfirm(transcript)}
              className="flex-1 rounded-pill py-2.5 text-[14px] font-semibold font-rounded text-white bg-[#1A1A1A] transition-colors"
            >
              Looks right ✓
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex-1 rounded-pill py-2.5 text-[14px] font-semibold font-rounded text-text-primary bg-[#F5F5F5] transition-colors"
            >
              Edit ✏
            </button>
          </>
        )}
        <button onClick={onDismiss} className="px-3 text-text-hint hover:text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Quick amount chips (shown below the wheel) ────────────────────────────────
const FIXED_AMOUNTS = [5, 10, 20]

function QuickAmountChips({
  expenseName,
  expenseCategory,
  onSelect,
}: {
  expenseName: string | null
  expenseCategory: string | null
  onSelect: (amount: number) => void
}) {
  const { transactions } = useExpense()

  const suggestedAmounts: number[] = []
  const seen = new Set<number>()

  // Pass 1 — name match (most recent first)
  if (expenseName) {
    const nameLower = expenseName.toLowerCase()
    for (const t of [...transactions].reverse()) {
      if (
        t.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(t.name.toLowerCase())
      ) {
        if (!seen.has(t.amount) && !FIXED_AMOUNTS.includes(t.amount)) {
          seen.add(t.amount)
          suggestedAmounts.push(t.amount)
          if (suggestedAmounts.length >= 3) break
        }
      }
    }
  }

  // Pass 2 — category fallback (fill up to 3)
  if (suggestedAmounts.length < 3 && expenseCategory) {
    const catLower = expenseCategory.toLowerCase()
    for (const t of [...transactions].reverse()) {
      if (suggestedAmounts.length >= 3) break
      if ((t.category ?? '').toLowerCase() === catLower) {
        if (!seen.has(t.amount) && !FIXED_AMOUNTS.includes(t.amount)) {
          seen.add(t.amount)
          suggestedAmounts.push(t.amount)
        }
      }
    }
  }

  return (
    <div className="mx-2 mb-2 flex flex-wrap gap-2 px-1">
      {FIXED_AMOUNTS.map((amt) => (
        <button
          key={amt}
          onClick={() => onSelect(amt)}
          className="rounded-pill px-4 py-2 text-[14px] font-semibold font-rounded transition-colors"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', boxShadow: '0 0 0 1px var(--color-border)' }}
        >
          ${amt}
        </button>
      ))}

      {suggestedAmounts.map((amt) => (
        <button
          key={`last-${amt}`}
          onClick={() => onSelect(amt)}
          className="rounded-pill px-4 py-2 text-[14px] font-semibold font-rounded transition-colors flex items-center gap-1"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', boxShadow: '0 0 0 1px var(--color-border)' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.34" />
          </svg>
          ${amt}
        </button>
      ))}
    </div>
  )
}

const TOAST_DURATION = 3000

// Persistent expense/income segmented toggle
function TypeToggle({
  selected,
  onChange,
}: {
  selected: TransactionType
  onChange: (t: TransactionType) => void
}) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onChange('expense')}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected === 'expense' ? 'scale-110' : 'opacity-30'
        }`}
        aria-label="Expense"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#D32F2F" strokeWidth="1.6" />
          <line x1="6" y1="10" x2="14" y2="10" stroke="#D32F2F" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <button
        onClick={() => onChange('income')}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected === 'income' ? 'scale-110' : 'opacity-30'
        }`}
        aria-label="Income"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#43A047" strokeWidth="1.6" />
          <line x1="10" y1="6" x2="10" y2="14" stroke="#43A047" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="6" y1="10" x2="14" y2="10" stroke="#43A047" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export function InputBar() {
  const [inputState, setInputState] = useState<InputState>('idle')
  const [text, setText] = useState('')
  const [selectedType, setSelectedType] = useState<TransactionType>('expense')
  const [toast, setToast] = useState<string | null>(null)
  const [voiceTimer, setVoiceTimer] = useState(0)
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addTransaction, isOffline } = useExpense()
  const voice = useVoiceInput()
  const ai = useAIParsing()

  // Timer for VoiceButton display
  useEffect(() => {
    const isActive = voice.state === 'listening' || voice.state === 'recording'
    if (isActive) {
      setVoiceTimer(0)
      voiceTimerRef.current = setInterval(() => setVoiceTimer(t => t + 1), 1000)
    } else {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current)
      setVoiceTimer(0)
    }
    return () => { if (voiceTimerRef.current) clearInterval(voiceTimerRef.current) }
  }, [voice.state])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), TOAST_DURATION)
  }

  const currentStep = ai.clarificationQueue[ai.currentStepIndex]
  const queueDone = inputState === 'clarifying'
    && ai.clarificationQueue.length > 0
    && ai.currentStepIndex >= ai.clarificationQueue.length

  // When clarification step is a plain amount input (no options) → show price wheel
  const isAskingAmount = currentStep?.field === 'amount' && !currentStep?.options

  // §2E — show "not an expense" toast when question/command detected
  useEffect(() => {
    if (ai.notExpense) {
      showToast("I can only log expenses. Try: 'Coffee $5' or 'Gym 50'")
      ai.reset()
      setInputState('idle')
    }
  }, [ai.notExpense]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(
    async (value: string, type: TransactionType) => {
      if (!value.trim()) return
      setInputState('parsing')
      await ai.parse(value, type)
      setInputState('clarifying')
    },
    [ai]
  )

  const handleSend = useCallback(() => {
    submit(text, selectedType)
    setText('')
  }, [text, selectedType, submit])

  const handleVoiceStart = useCallback(() => {
    voice.start()
  }, [voice])

  const handleVoiceStop = useCallback(() => {
    voice.stop()
  }, [voice])

  const handleVoiceConfirm = useCallback((text: string) => {
    voice.confirmTranscript(text)
    submit(text, selectedType)
  }, [voice, selectedType, submit])

  const handleVoiceDismiss = useCallback(() => {
    voice.dismissReview()
  }, [voice])

  const handleScanClick = useCallback(() => showToast('Coming soon'), [])

  // Auto-save when no clarification needed OR all steps answered
  useEffect(() => {
    if (!queueDone) return
    const data = ai.collectedData
    if (!data.name || !data.amount) return
    setInputState('saving')
    addTransaction({
      name: data.name,
      amount: data.amount,
      type: data.type,
      category: data.category ?? null,
      frequency: data.frequency,
      date: new Date(),
      notes: '',
      emoji: '',
    })
      .then(() => {
        setInputState('done')
        setTimeout(() => { setInputState('idle'); ai.reset(); setText('') }, 400)
      })
      .catch(() => {
        showToast("Couldn't save. Try again?")
        setInputState('idle')
        ai.reset()
        setText('')
      })
  }, [queueDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also auto-save when queue is empty (no clarification needed at all)
  useEffect(() => {
    if (inputState !== 'clarifying') return
    if (ai.clarificationQueue.length > 0) return
    const data = ai.collectedData
    if (!data.name || !data.amount) return
    setInputState('saving')
    addTransaction({
      name: data.name,
      amount: data.amount,
      type: data.type,
      category: data.category ?? null,
      frequency: data.frequency,
      date: new Date(),
      notes: '',
      emoji: '',
    })
      .then(() => {
        setInputState('done')
        setTimeout(() => { setInputState('idle'); ai.reset(); setText('') }, 400)
      })
      .catch(() => {
        showToast("Couldn't save. Try again?")
        setInputState('idle')
        ai.reset()
        setText('')
      })
  }, [inputState, ai.clarificationQueue.length]) // eslint-disable-line react-hooks/exhaustive-deps


  function handleDismissClarification() {
    ai.reset(); setInputState('idle'); setText('')
  }

  function handleWheelConfirm(value: number) {
    ai.answerStep(String(value))
  }

  const isTyping = text.length > 0

  useEffect(() => {
    if (text.length > 0 && inputState === 'idle') setInputState('typing')
    if (text.length === 0 && inputState === 'typing') setInputState('idle')
  }, [text, inputState])

  const showClarification = inputState === 'clarifying' && !!currentStep && !isAskingAmount
  const showAmountPicker = inputState === 'clarifying' && isAskingAmount

  return (
    <div className="bg-bg-page safe-bottom">
      {/* Status messages */}
      {isOffline && (
        <p className="text-center text-expense text-[12px] py-1">Offline</p>
      )}
      {voice.errorMessage && (
        <p className="text-center text-expense text-[12px] py-1">{voice.errorMessage}</p>
      )}
      {toast && (
        <p className="text-center text-text-secondary text-[12px] py-1 animate-fade-in">{toast}</p>
      )}

      {/* Transcript review card */}
      {voice.state === 'reviewing' && (
        <TranscriptReview
          transcript={voice.transcript}
          onConfirm={handleVoiceConfirm}
          onDismiss={handleVoiceDismiss}
        />
      )}

      {/* Amount picker: wheel on top, quick chips below */}
      {showAmountPicker && (
        <>
          <PriceWheel
            onConfirm={handleWheelConfirm}
            onDismiss={handleDismissClarification}
            initialValue={0}
            type={selectedType}
          />
          <QuickAmountChips
            expenseName={ai.collectedData.name}
            expenseCategory={ai.collectedData.category}
            onSelect={(amt) => ai.answerStep(String(amt))}
          />
        </>
      )}

      {/* Clarification sheet */}
      {showClarification && (
        <ClarificationSheet
          step={currentStep}
          onAnswer={ai.answerStep}
          onDismiss={handleDismissClarification}
        />
      )}

      {/* Main input row */}
      <div className="flex items-center gap-1.5 px-2 py-2">
        {/* Voice active: hide text input, show only VoiceButton centered */}
        {voice.isSupported && (voice.state === 'listening' || voice.state === 'recording' || voice.state === 'processing') ? (
          <div className="flex-1 flex items-center justify-center py-1">
            <VoiceButton
              state={voice.state}
              onStart={handleVoiceStart}
              onStop={handleVoiceStop}
              time={voiceTimer}
            />
          </div>
        ) : (
          <>
            {/* Input pill */}
            <div className="flex-1 min-w-0 flex items-center bg-white rounded-pill px-3 h-[52px] gap-2 float-shadow">
              <TypeToggle selected={selectedType} onChange={setSelectedType} />

              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                onFocus={() => { if (inputState === 'idle') setInputState('typing') }}
                onBlur={() => { if (!text && inputState === 'typing') setInputState('idle') }}
                placeholder={selectedType === 'income' ? 'New income...' : 'New expense...'}
                className="flex-1 min-w-0 text-[15px] bg-transparent focus:outline-none text-text-primary placeholder:text-text-hint font-rounded"
                disabled={inputState === 'parsing' || inputState === 'saving'}
              />

              {isTyping && (
                <button
                  onClick={handleSend}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in transition-colors ${
                    selectedType === 'income' ? 'bg-income hover:bg-green-700' : 'bg-send hover:bg-red-600'
                  }`}
                  aria-label="Send"
                >
                  <ArrowUp size={15} variant="Bold" color="white" />
                </button>
              )}

              {inputState === 'parsing' && (
                <div className="w-5 h-5 border-2 border-send border-t-transparent rounded-full animate-spin-slow" />
              )}
            </div>

            {/* Voice + Scan buttons (only when not typing) */}
            {!isTyping && inputState !== 'parsing' && (
              <>
                {voice.isSupported && (
                  <div className="flex-shrink-0">
                    <VoiceButton
                      state={voice.state}
                      onStart={handleVoiceStart}
                      onStop={handleVoiceStop}
                      time={voiceTimer}
                    />
                  </div>
                )}
                <button
                  onClick={handleScanClick}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition-colors float-shadow text-text-secondary"
                  aria-label="Scan receipt"
                >
                  <ScanBarcode size={18} variant="Linear" color="currentColor" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
