import { useState, useRef, useEffect, useCallback } from 'react'
import type { TransactionType, InputState } from '../../types'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useAIParsing } from '../../hooks/useAIParsing'
import { useExpense } from '../../context/MockExpenseContext'
import { getEmoji } from '../../utils/categories'
import { getImageSlug, getImageUrl } from '../../utils/transactionImages'
import { ClarificationSheet } from './ClarificationSheet'
import { VoiceButton } from './VoiceButton'
import { PriceWheel } from '../ui/PriceWheel'

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
  const [showPriceWheel, setShowPriceWheel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addTransaction, isOffline } = useExpense()
  const voice = useVoiceInput()
  const ai = useAIParsing()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), TOAST_DURATION)
  }

  const currentStep = ai.clarificationQueue[ai.currentStepIndex]
  const isConfirming = currentStep?.field === 'confirm'

  // When clarification step is a plain amount input (no options) → show price wheel
  // Special amount steps (zero/large) have options, so they use ClarificationSheet
  const isAskingAmount = currentStep?.field === 'amount' && !currentStep?.options && !isConfirming

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

  const handleVoice = useCallback(() => {
    if (voice.isRecording) { voice.stopRecording(); return }
    voice.startRecording((transcript) => {
      setText(transcript)
      submit(transcript, selectedType)
    })
  }, [voice, selectedType, submit])

  const handleScanClick = useCallback(() => showToast('Coming soon'), [])

  // When all clarification answered → confirming
  useEffect(() => {
    if (inputState === 'clarifying' && isConfirming) setInputState('confirming')
  }, [inputState, isConfirming])

  // Show price wheel when amount clarification step reached
  useEffect(() => {
    if (inputState === 'clarifying' && isAskingAmount) {
      setShowPriceWheel(true)
    } else {
      setShowPriceWheel(false)
    }
  }, [inputState, isAskingAmount])

  async function handleConfirm() {
    const data = ai.collectedData
    if (!data.name || !data.amount || !data.category) return
    setInputState('saving')
    try {
      await addTransaction({
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        tags: data.frequency !== 'none'
          ? [{ label: capitalize(data.frequency), type: 'frequency' as const }]
          : [],
        frequency: data.frequency,
        date: new Date(),
        notes: '',
        emoji: getEmoji(data.category),
      })
      setInputState('done')
      setTimeout(() => { setInputState('idle'); ai.reset(); setText('') }, 400)
    } catch {
      showToast("Couldn't save. Try again?")
      setInputState('confirming')
    }
  }

  function handleDismissClarification() {
    ai.reset(); setInputState('idle'); setText(''); setShowPriceWheel(false)
  }

  function handleWheelConfirm(value: number) {
    setShowPriceWheel(false)
    ai.answerStep(String(value))
  }

  const isTyping = text.length > 0

  useEffect(() => {
    if (text.length > 0 && inputState === 'idle') setInputState('typing')
    if (text.length === 0 && inputState === 'typing') setInputState('idle')
  }, [text, inputState])

  const showClarification = (inputState === 'clarifying' || inputState === 'confirming') && currentStep && !isAskingAmount

  const confirmData = ai.collectedData
  const confirmImageSlug = confirmData.category
    ? getImageSlug(confirmData.category, confirmData.name ?? '')
    : 'credit-card'
  const isSaving = inputState === 'saving'

  return (
    <div className="bg-bg-page safe-bottom">
      {/* Status messages */}
      {isOffline && (
        <p className="text-center text-expense text-[12px] py-1">Offline</p>
      )}
      {voice.error && (
        <p className="text-center text-expense text-[12px] py-1">{voice.error}</p>
      )}
      {toast && (
        <p className="text-center text-text-secondary text-[12px] py-1 animate-fade-in">{toast}</p>
      )}

      {/* Price wheel (replaces clarification for amount) */}
      {showPriceWheel && (
        <PriceWheel
          onConfirm={handleWheelConfirm}
          onDismiss={handleDismissClarification}
          initialValue={0}
          type={selectedType}
        />
      )}

      {/* Clarification sheet */}
      {showClarification && !isConfirming && (
        <ClarificationSheet
          step={currentStep}
          onAnswer={ai.answerStep}
          onDismiss={handleDismissClarification}
        />
      )}

      {/* Confirmation card */}
      {inputState === 'confirming' && confirmData.name && (
        <div className="mx-2 mb-2 rounded-3xl border border-[#E3E3DE] bg-white px-4 py-3 flex items-center gap-3 animate-clarify-up">
          <img
            src={getImageUrl(confirmImageSlug)}
            alt={confirmData.name}
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-text-primary truncate font-rounded">{confirmData.name}</p>
            <p className="text-[13px] text-text-secondary font-rounded">
              ${confirmData.amount ?? 0}
              {confirmData.frequency !== 'none' && ` · ${capitalize(confirmData.frequency)}`}
              {confirmData.category && ` · ${confirmData.category}`}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className={`text-white text-[12px] font-semibold rounded-pill px-4 py-1.5 transition-colors disabled:opacity-60 font-rounded ${
              confirmData.type === 'income' ? 'bg-income hover:bg-green-700' : 'bg-send hover:bg-red-600'
            }`}
          >
            {isSaving ? '…' : 'Add'}
          </button>
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Input pill — toggle always visible inside */}
        <div className="flex-1 flex items-center bg-white rounded-pill px-3 h-[52px] gap-2 float-shadow">
          {/* Persistent type toggle — always shown */}
          <TypeToggle selected={selectedType} onChange={setSelectedType} />

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            onFocus={() => { if (inputState === 'idle') setInputState('typing') }}
            onBlur={() => { if (!text && inputState === 'typing') setInputState('idle') }}
            placeholder="New expense..."
            className="flex-1 text-[15px] bg-transparent focus:outline-none text-text-primary placeholder:text-text-hint font-rounded"
            disabled={inputState === 'parsing' || inputState === 'saving'}
          />

          {/* Send button — appears when typing */}
          {isTyping && (
            <button
              onClick={handleSend}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in transition-colors ${
                selectedType === 'income'
                  ? 'bg-income hover:bg-green-700'
                  : 'bg-send hover:bg-red-600'
              }`}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          )}

          {/* Parsing spinner */}
          {inputState === 'parsing' && (
            <div className="w-5 h-5 border-2 border-send border-t-transparent rounded-full animate-spin-slow" />
          )}
        </div>

        {/* Voice + Scan buttons */}
        {!isTyping && inputState !== 'parsing' && (
          <>
            {voice.isSupported && (
              <VoiceButton isRecording={voice.isRecording} onClick={handleVoice} />
            )}
            <button
              onClick={handleScanClick}
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition-colors float-shadow"
              aria-label="Scan receipt"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="16" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="16" width="5" height="5" rx="1" />
                <path d="M16 16h2v2h-2zM20 16v4M16 20h4" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
