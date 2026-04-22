import { useState, useEffect } from 'react'
import { useExpense } from '../../context/MockExpenseContext'
import { getHeaderState, formatHeaderNumber } from '../../context/MockExpenseContext'
import { SpendingSheet } from './SpendingSheet'
import { AboutSheet } from './AboutSheet'

// ─── Budget ring (pill size: 20px, 2.5px stroke) ─────────────────────────────
function BudgetRing({ percent, color, isSolidRed }: { percent: number; color: string; isSolidRed: boolean }) {
  const SIZE = 20
  const STROKE = 2.5
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R

  if (isSolidRed) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="#D32F2F" />
      </svg>
    )
  }

  // percent = remaining (1 = full circle, 0 = empty)
  const dashoffset = CIRC * (1 - percent)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#E0E0E0" strokeWidth={STROKE} />
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none" stroke={color} strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Carousel (no budget, no transactions) ────────────────────────────────────
function PillCarousel({ onSetBudget }: { onSetBudget: () => void }) {
  const [slide, setSlide] = useState(0) // 0 = $0, 1 = "Set a budget"
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const durations = [3000, 2000]
    const timer = setTimeout(() => {
      setAnimating(true)
      setTimeout(() => {
        setSlide((s) => (s + 1) % 2)
        setAnimating(false)
      }, 300)
    }, durations[slide])
    return () => clearTimeout(timer)
  }, [slide, animating])

  const sparkleStyle: React.CSSProperties = {
    display: 'inline-block',
    animation: 'sparkle-pulse 1.5s ease-in-out infinite',
  }

  return (
    <div style={{ overflow: 'hidden', height: 22, display: 'flex', alignItems: 'center' }}>
      <style>{`
        @keyframes sparkle-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes slide-up-out { from{transform:translateY(0);opacity:1} to{transform:translateY(-100%);opacity:0} }
        @keyframes slide-up-in  { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
      <div
        key={slide}
        style={{
          animation: animating ? 'slide-up-out 300ms ease-in-out forwards' : 'slide-up-in 300ms ease-in-out forwards',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {slide === 0 ? (
          <span className="text-[15px] font-semibold text-text-primary font-rounded">$0</span>
        ) : (
          <button onClick={onSetBudget} className="flex items-center gap-1">
            <span style={sparkleStyle}>✨</span>
            <span className="text-[13px] font-medium text-text-primary font-rounded">Set a budget</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const { transactions, budget } = useExpense()
  const [showSpending, setShowSpending] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [scrollToSettings, setScrollToSettings] = useState(false)

  const hs = getHeaderState(transactions, budget)

  const numberColor = hs.has_budget
    ? (hs.is_solid_red ? '#D32F2F' : hs.circle_color)
    : '#1A1A1A'

  function openBudgetSettings() {
    setScrollToSettings(true)
    setShowSpending(true)
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-bg-page z-10">
      {/* Logo */}
      <button
        onClick={() => setShowAbout(true)}
        className="w-[42px] h-[42px] rounded-2xl overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
      >
        <img src="/cent-logo.svg" alt="Cent" className="w-full h-full object-cover" />
      </button>

      {/* Pill */}
      <button
        onClick={() => { setScrollToSettings(false); setShowSpending(true) }}
        className="flex items-center gap-2 bg-white rounded-pill px-4 py-2 float-shadow hover:bg-gray-50 transition-colors"
      >
        {hs.has_budget && (
          <BudgetRing percent={hs.circle_percent} color={hs.circle_color} isSolidRed={hs.is_solid_red} />
        )}

        {hs.show_carousel ? (
          <PillCarousel onSetBudget={openBudgetSettings} />
        ) : (
          <span
            className="text-[15px] font-semibold font-rounded tabular-nums whitespace-nowrap"
            style={{ color: numberColor }}
          >
            {hs.is_negative ? '-' : ''}{formatHeaderNumber(hs.display_number)}
          </span>
        )}
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

      {showSpending && (
        <SpendingSheet
          onClose={() => setShowSpending(false)}
          initialScrollToSettings={scrollToSettings}
        />
      )}
      {showAbout && <AboutSheet onClose={() => setShowAbout(false)} />}
    </header>
  )
}
