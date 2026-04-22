import { useEffect, useRef, useState } from 'react'
import { useExpense } from '../../context/MockExpenseContext'
import {
  getPeriodSummary, getCircleColor, formatHeaderNumber,
} from '../../context/MockExpenseContext'
import type { Budget, PeriodSummary } from '../../types'

interface SpendingSheetProps {
  onClose: () => void
  initialScrollToSettings?: boolean
}

// ─── Large circle for overview ────────────────────────────────────────────────
function LargeCircle({ percent, color, isSolidRed, animate }: {
  percent: number; color: string; isSolidRed: boolean; animate: boolean
}) {
  const SIZE = 80
  const STROKE = 6
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  const [drawn, setDrawn] = useState(0)

  useEffect(() => {
    if (!animate) { setDrawn(percent); return }
    setDrawn(0)
    const t = setTimeout(() => setDrawn(percent), 50)
    return () => clearTimeout(t)
  }, [percent, animate])

  if (isSolidRed) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="#D32F2F" />
      </svg>
    )
  }

  const dashoffset = CIRC * (1 - drawn)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#E0E0E0" strokeWidth={STROKE} />
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none" stroke={color || '#4CAF50'} strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: animate ? 'stroke-dashoffset 0.8s ease-out, stroke 0.6s ease' : 'none' }}
      />
    </svg>
  )
}

// ─── Budget settings form ─────────────────────────────────────────────────────
function BudgetSettings({ budget, onSave, onRemove }: {
  budget: Budget | null
  onSave: (b: Budget) => void
  onRemove: () => void
}) {
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '')
  const [period, setPeriod] = useState<Budget['period']>(budget?.period ?? 'monthly')
  const [alertThreshold, setAlertThreshold] = useState(budget?.alert_threshold ?? 0.75)
  const [countIncome, setCountIncome] = useState(budget?.count_income ?? false)
  const [rollover, setRollover] = useState(budget?.rollover_enabled ?? false)
  const [notifications, setNotifications] = useState(budget?.notifications_enabled ?? true)
  const [amountError, setAmountError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)

  function handleSave() {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!parsed || parsed <= 0) {
      setAmountError('Budget must be more than $0')
      return
    }
    setAmountError('')
    const now = new Date()
    onSave({
      id: budget?.id ?? String(Date.now()),
      amount: parsed,
      period,
      period_start_day: budget?.period_start_day ?? 1,
      alert_threshold: alertThreshold,
      alert_fired_at: null,
      notifications_enabled: notifications,
      count_income: countIncome,
      rollover_enabled: rollover,
      created_at: budget?.created_at ?? now,
      updated_at: now,
    })
  }

  return (
    <div className="px-6 pb-8">
      <p className="text-[15px] font-semibold text-text-primary font-rounded mb-5">Budget settings</p>

      {/* Amount */}
      <div className="mb-4">
        <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Budget amount</p>
        <div className="flex items-center bg-[#F5F5F5] rounded-xl px-4 py-3 gap-1">
          <span className="text-[16px] font-semibold text-text-primary font-rounded">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
            placeholder="0"
            className="flex-1 text-[16px] font-semibold text-text-primary font-rounded bg-transparent focus:outline-none"
          />
        </div>
        {amountError && <p className="text-[12px] text-expense mt-1">{amountError}</p>}
      </div>

      {/* Period */}
      <div className="mb-4">
        <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Period</p>
        <div className="flex gap-2">
          {(['monthly', 'weekly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-full text-[13px] font-semibold font-rounded transition-colors ${
                period === p ? 'bg-text-primary text-white' : 'bg-[#F5F5F5] text-text-secondary'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alert threshold */}
      <div className="mb-4">
        <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Alert me at</p>
        <div className="flex gap-2 flex-wrap">
          {[0.5, 0.6, 0.75, 0.9].map((t) => (
            <button
              key={t}
              onClick={() => setAlertThreshold(t)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold font-rounded transition-colors ${
                alertThreshold === t ? 'bg-text-primary text-white' : 'bg-[#F5F5F5] text-text-secondary'
              }`}
            >
              {Math.round(t * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 mb-6">
        <ToggleRow label="Push notifications" value={notifications} onChange={setNotifications} />
        <ToggleRow label="Count income toward budget" value={countIncome} onChange={setCountIncome} />
        <ToggleRow label="Roll over unspent budget" value={rollover} onChange={setRollover} />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-full bg-text-primary text-white text-[15px] font-semibold font-rounded mb-4"
      >
        Save
      </button>

      {/* Remove */}
      {budget && !confirmRemove && (
        <button
          onClick={() => setConfirmRemove(true)}
          className="w-full py-2 text-[13px] text-text-secondary font-rounded text-center"
        >
          Remove budget
        </button>
      )}
      {budget && confirmRemove && (
        <div className="rounded-xl bg-[#FFF3F3] border border-expense/20 px-4 py-3">
          <p className="text-[13px] text-text-primary font-rounded mb-3">
            Remove your budget? Your spending history is kept.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onRemove}
              className="flex-1 py-2 rounded-full bg-expense text-white text-[13px] font-semibold font-rounded"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="flex-1 py-2 rounded-full bg-[#F5F5F5] text-text-secondary text-[13px] font-semibold font-rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[14px] text-text-primary font-rounded">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-income' : 'bg-[#E0E0E0]'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ─── SpendingSheet ────────────────────────────────────────────────────────────
export function SpendingSheet({ onClose, initialScrollToSettings }: SpendingSheetProps) {
  const { transactions, budget, setBudget } = useExpense()
  const [isClosing, setIsClosing] = useState(false)
  const [viewDate, setViewDate] = useState(new Date()) // date used for period navigation
  const [animatedIn, setAnimatedIn] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const summary: PeriodSummary = getPeriodSummary(transactions, budget, viewDate)

  // Circle animation on open
  useEffect(() => {
    const t = setTimeout(() => setAnimatedIn(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Scroll to settings if requested
  useEffect(() => {
    if (initialScrollToSettings && settingsRef.current) {
      setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' }), 400)
    }
  }, [initialScrollToSettings])

  function close() {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  // Period navigation
  function navigatePeriod(dir: -1 | 1) {
    setAnimatedIn(false)
    const next = new Date(viewDate)
    if (!budget || budget.period === 'monthly') {
      next.setMonth(next.getMonth() + dir)
    } else {
      next.setDate(next.getDate() + dir * 7)
    }
    setViewDate(next)
    setTimeout(() => setAnimatedIn(true), 50)
  }

  const now = new Date()
  const isCurrentPeriod = summary.is_current
  const isPast = viewDate < now && !isCurrentPeriod

  // Circle state
  const hasCircle = budget !== null
  const percentRemaining = summary.budget_percent_remaining ?? 0
  const circleColor = hasCircle ? getCircleColor(percentRemaining) : '#4CAF50'
  const isSolidRed = hasCircle && (summary.budget_remaining ?? 1) <= 0
  const displayNumber = hasCircle
    ? Math.abs(summary.budget_remaining ?? 0)
    : summary.total_spent
  const isNegative = hasCircle && (summary.budget_remaining ?? 0) < 0
  const numberColor = hasCircle
    ? (isSolidRed ? '#D32F2F' : circleColor)
    : '#1A1A1A'

  // Month progress
  const monthProgress = summary.days_total > 0 ? summary.days_elapsed / summary.days_total : 0
  const monthPct = Math.round(monthProgress * 100)

  // Burn rate
  const projectedOverBudget = budget && summary.projected_spend !== null
    && summary.projected_spend > budget.amount

  // Overspent banner
  const overspent = hasCircle && (summary.budget_remaining ?? 0) < 0
  const overspentAmount = overspent ? Math.abs(summary.budget_remaining ?? 0) : 0

  // Drag to close
  const dragStart = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) { dragStart.current = e.touches[0]?.clientY ?? null }
  function onTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    if ((e.changedTouches[0]?.clientY ?? 0) - dragStart.current > 80) close()
    dragStart.current = null
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === backdropRef.current) close() }}
    >
      <div
        ref={sheetRef}
        className={`bg-white rounded-t-[28px] w-full max-w-lg mx-auto overflow-y-auto max-h-[92vh] ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-divider" />
        </div>

        {/* Period navigation */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <button
            onClick={() => navigatePeriod(-1)}
            className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span
            className="text-[16px] font-semibold font-rounded"
            style={{ color: isPast ? '#888888' : '#1A1A1A' }}
          >
            {summary.label}
          </span>
          <button
            onClick={() => { if (!isCurrentPeriod) navigatePeriod(1) }}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${isCurrentPeriod ? 'opacity-30 pointer-events-none' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* ── SECTION 1: OVERVIEW ── */}
        <div className="px-6 pb-6">
          {/* Overspent banner */}
          {overspent && (
            <div className="mb-4 rounded-xl px-4 py-3" style={{ background: '#FFF3F3', borderLeft: '4px solid #D32F2F' }}>
              <p className="text-[13px] text-expense font-rounded">
                You're {formatHeaderNumber(overspentAmount)} over your {summary.label.split(' ')[0]} budget.
              </p>
            </div>
          )}

          {/* Large circle */}
          <div className="flex justify-center mb-2">
            <LargeCircle
              percent={hasCircle ? Math.max(0, Math.min(1, percentRemaining)) : 0}
              color={circleColor}
              isSolidRed={isSolidRed}
              animate={animatedIn}
            />
          </div>

          {/* Amount below circle */}
          <div className="flex justify-center mb-1">
            <span
              className="text-[28px] font-bold font-rounded tabular-nums"
              style={{ color: numberColor }}
            >
              {isNegative ? '-' : ''}{formatHeaderNumber(displayNumber)}
            </span>
          </div>
          {summary.total_spent === 0 && !hasCircle && (
            <p className="text-center text-[13px] text-text-hint font-rounded mb-4">No data for this period.</p>
          )}

          {/* Stat cards */}
          <div className="flex gap-3 mb-4 mt-3">
            <div className="flex-1 rounded-xl px-4 py-3.5" style={{ background: '#F5F5F5' }}>
              <p className="text-[12px] text-text-secondary font-rounded mb-0.5">Spent</p>
              <p className="text-[18px] font-semibold text-text-primary font-rounded tabular-nums">
                {formatHeaderNumber(summary.total_spent)}
              </p>
            </div>
            <div className="flex-1 rounded-xl px-4 py-3.5" style={{ background: '#F5F5F5' }}>
              <p className="text-[12px] text-text-secondary font-rounded mb-0.5">Budget</p>
              <p className="text-[18px] font-semibold text-text-primary font-rounded tabular-nums">
                {budget ? formatHeaderNumber(budget.amount) : '—'}
              </p>
            </div>
          </div>

          {/* Month progress bar */}
          <div className="mb-1">
            <div className="h-1 rounded-full bg-divider overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${monthPct}%`, background: '#BBBBBB' }}
              />
            </div>
            <p className="text-[12px] text-text-secondary font-rounded mt-1">
              {monthPct}% of {summary.label.split(' ')[0]} passed
            </p>
          </div>

          {/* Burn rate */}
          {summary.projected_spend !== null && (
            <p
              className="text-[13px] font-rounded mt-1 mb-1"
              style={{ color: projectedOverBudget ? '#D32F2F' : '#888888' }}
            >
              At this pace: ~{formatHeaderNumber(summary.projected_spend)} this month
              {projectedOverBudget ? ' ⚠' : ''}
            </p>
          )}

          {/* Income row */}
          {summary.total_income > 0 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-[13px] text-text-secondary font-rounded">
                Income: {formatHeaderNumber(summary.total_income)}
              </span>
              <span>📈</span>
            </div>
          )}

          {/* Budget CTA */}
          {!budget && (
            <button
              onClick={() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full mt-4 py-3.5 rounded-full bg-text-primary text-white text-[15px] font-medium font-rounded"
            >
              Set a budget →
            </button>
          )}
          {budget && (
            <button
              onClick={() => settingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full mt-3 py-2 text-[13px] text-text-secondary font-rounded text-center"
            >
              Edit budget ✏
            </button>
          )}
        </div>

        {/* ── SECTION 2: CATEGORIES ── */}
        {summary.by_category.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-[13px] text-text-secondary font-rounded mb-3">Categories</p>
            <div className="space-y-3">
              {summary.by_category.map((cat, i) => (
                <div key={cat.category} style={{ animationDelay: `${i * 80}ms` }} className="animate-slide-in-bottom">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold text-text-primary font-rounded">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-text-primary font-rounded tabular-nums">
                        {formatHeaderNumber(cat.total_spent)}
                      </span>
                      <span className="text-[12px] text-text-secondary font-rounded w-8 text-right">
                        {Math.round(cat.percent_of_total * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-divider overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: animatedIn ? `${cat.percent_of_total * 100}%` : '0%',
                        background: cat.color,
                        transition: `width 400ms ease-out ${i * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-divider mx-6 mb-6" />

        {/* ── SECTION 3: BUDGET SETTINGS ── */}
        <div ref={settingsRef}>
          <BudgetSettings
            budget={budget}
            onSave={(b) => setBudget(b)}
            onRemove={() => { setBudget(null); close() }}
          />
        </div>
      </div>
    </div>
  )
}
