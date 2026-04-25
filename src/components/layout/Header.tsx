import { useState, useEffect } from 'react'
import { Setting2, ChartSquare } from 'iconsax-react'
import { useExpense } from '../../context/ExpenseContext'
import { getHeaderState, formatHeaderNumber } from '../../context/MockExpenseContext'
import { SpendingSheet } from './SpendingSheet'
import { AboutSheet } from './AboutSheet'
import { SettingsSheet } from './SettingsSheet'

// ─── Budget ring (pill size: 20px, 2.5px stroke) ─────────────────────────────
function BudgetRing({ percent, color, isSolidRed }: { percent: number; color: string; isSolidRed: boolean }) {
  const SIZE = 20
  const STROKE = 2.5
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R

  if (isSolidRed) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="var(--color-red-progress)" />
      </svg>
    )
  }

  // percent = remaining (1 = full circle, 0 = empty)
  const dashoffset = CIRC * (1 - percent)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--color-border-dashed)" strokeWidth={STROKE} />
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
  const [showSettings, setShowSettings] = useState(false)
  const [scrollToSettings, setScrollToSettings] = useState(false)

  const hs = getHeaderState(transactions, budget)

  const numberColor = hs.has_budget
    ? (hs.is_solid_red ? 'var(--color-red-progress)' : hs.circle_color)
    : 'var(--color-text-primary)'

  function openBudgetSettings() {
    setScrollToSettings(true)
    setShowSpending(true)
  }

  return (
    <header className="relative flex items-center justify-between px-4 py-3 bg-bg-page z-10">
      {/* Logo */}
      <button
        onClick={() => setShowAbout(true)}
        className="w-[42px] h-[42px] rounded-2xl overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
      >
        <img src="/cent-logo.svg" alt="Cent" className="w-full h-full object-cover" />
      </button>

      {/* Pill — absolutely centered so it's always in the middle regardless of side widths */}
      <div className="absolute inset-x-0 flex justify-center pointer-events-none">
        <button
          onClick={() => { setScrollToSettings(false); setShowSpending(true) }}
          className="flex items-center gap-2 bg-bg-card rounded-pill px-4 py-2 float-shadow hover:bg-bg-secondary transition-colors pointer-events-auto"
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
              {hs.is_negative ? '-' : ''}{formatHeaderNumber(hs.display_number)}{hs.has_budget && !hs.is_negative ? ' left' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:bg-bg-secondary transition-colors float-shadow-sm"
          aria-label="Settings"
        >
          <Setting2 size={18} variant="Linear" color="currentColor" />
        </button>
        <button
          className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:bg-bg-secondary transition-colors float-shadow-sm"
          aria-label="Analytics"
        >
          <ChartSquare size={17} variant="Linear" color="currentColor" />
        </button>
      </div>

      {showSpending && (
        <SpendingSheet
          onClose={() => setShowSpending(false)}
          initialScrollToSettings={scrollToSettings}
        />
      )}
      {showAbout && <AboutSheet onClose={() => setShowAbout(false)} />}
      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          onOpenBudget={() => { setScrollToSettings(true); setShowSpending(true) }}
        />
      )}
    </header>
  )
}
