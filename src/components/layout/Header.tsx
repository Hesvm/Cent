import { useState } from 'react'
import { useExpense } from '../../context/MockExpenseContext'
import { formatAmount } from '../../utils/formatCurrency'
import { BudgetModal } from './BudgetModal'
import { AboutSheet } from './AboutSheet'

const BUDGET = 6000 // monthly budget baseline

function BudgetRing({ balance, budget }: { balance: number; budget: number }) {
  const used = Math.max(0, budget - balance)
  const ratio = Math.min(1, used / budget)

  // Color: 0–0.6 green, 0.6–0.85 yellow, 0.85+ red
  let strokeColor: string
  if (ratio < 0.6) {
    // green → yellow interpolation
    const t = ratio / 0.6
    const r = Math.round(46 + (234 - 46) * t)
    const g = Math.round(125 + (179 - 125) * t)
    const b = Math.round(50 + (8 - 50) * t)
    strokeColor = `rgb(${r},${g},${b})`
  } else if (ratio < 0.85) {
    // yellow → orange
    const t = (ratio - 0.6) / 0.25
    const r = Math.round(234 + (211 - 234) * t)
    const g = Math.round(179 + (47 - 179) * t)
    const b = Math.round(8 + (47 - 8) * t)
    strokeColor = `rgb(${r},${g},${b})`
  } else {
    // red
    strokeColor = '#D32F2F'
  }

  const SIZE = 22
  const STROKE = 3
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  // offset = full circumference means nothing drawn (0% spent); 0 means full circle (100% spent)
  const dashoffset = CIRC * (1 - ratio)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
      {/* Track */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none"
        stroke="#D8D8D8"
        strokeWidth={STROKE}
      />
      {/* Progress — starts at top (rotate -90), fills clockwise as spending increases */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none"
        stroke={strokeColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

export function Header() {
  const { balance } = useExpense()
  const [showBudget, setShowBudget] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-bg-page z-10">
      {/* Cent logo — tap for About */}
      <button
        onClick={() => setShowAbout(true)}
        className="w-[42px] h-[42px] rounded-2xl overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
      >
        <img src="/cent-logo.svg" alt="Cent" className="w-full h-full object-cover" />
      </button>

      {/* Balance pill — tap to see breakdown */}
      <button
        onClick={() => setShowBudget(true)}
        className="flex items-center gap-2 bg-white rounded-pill px-4 py-2 float-shadow hover:bg-gray-50 transition-colors"
      >
        <BudgetRing balance={balance} budget={BUDGET} />
        <span className="text-[15px] font-semibold text-text-primary whitespace-nowrap font-rounded">
          ${formatAmount(Math.max(0, balance))} left
        </span>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors float-shadow-sm"
          aria-label="Settings"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors float-shadow-sm"
          aria-label="Analytics"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
      </div>

      {showBudget && <BudgetModal budget={BUDGET} onClose={() => setShowBudget(false)} />}
      {showAbout && <AboutSheet onClose={() => setShowAbout(false)} />}
    </header>
  )
}
