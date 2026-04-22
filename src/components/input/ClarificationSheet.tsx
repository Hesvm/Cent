import { useRef, useState, useEffect } from 'react'
import type { ClarificationStep } from '../../types'

interface ClarificationSheetProps {
  step: ClarificationStep
  onAnswer: (value: string) => void
  onDismiss: () => void
}

export function ClarificationSheet({ step, onAnswer, onDismiss: _onDismiss }: ClarificationSheetProps) {
  const [textValue, setTextValue] = useState('')
  const [visible, setVisible] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTextValue('')
    setVisible(true)
    if (step.options === null || step.options === undefined) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [step])

  function handleOptionTap(value: string) {
    setVisible(false)
    setTimeout(() => onAnswer(value), 150)
  }

  function handleTextSubmit() {
    const v = textValue.trim()
    if (!v) return
    setVisible(false)
    setTimeout(() => onAnswer(v), 150)
  }

  const hasOptions = step.options && step.options.length > 0

  return (
    <div
      className={`mx-2 mb-2 rounded-3xl border border-[#EBEBEB] bg-white px-5 py-4 transition-all ${
        visible ? 'animate-clarify-up' : 'animate-clarify-down opacity-0'
      }`}
    >
      {step.question && (
        <p className="text-[14px] text-text-secondary mb-3">{step.question}</p>
      )}

      {hasOptions ? (
        <div>
          {step.options!.map((opt, i) => (
            <div key={`${opt.value}-${i}`}>
              <button
                onClick={() => handleOptionTap(opt.value)}
                className="w-full flex items-center gap-3 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="w-5 h-5 rounded-full bg-bg-tag flex items-center justify-center text-[12px] font-medium text-text-primary flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-[15px] font-medium text-text-primary">{opt.label}</span>
              </button>
              {i < step.options!.length - 1 && (
                <div className="border-t border-dashed border-divider" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type={step.field === 'amount' ? 'number' : 'text'}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit() }}
            className="flex-1 text-[15px] text-text-primary border-b border-divider bg-transparent py-2 focus:outline-none placeholder:text-text-hint"
            placeholder={step.field === 'amount' ? '0.00' : 'Type here...'}
          />
          <button
            onClick={handleTextSubmit}
            className="w-8 h-8 rounded-full bg-send flex items-center justify-center flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
