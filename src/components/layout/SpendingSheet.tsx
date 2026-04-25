import { useEffect, useRef, useState, useMemo } from 'react'
import { useExpense } from '../../context/ExpenseContext'
import { formatHeaderNumber, CATEGORY_COLORS } from '../../context/MockExpenseContext'
import type { Budget, Transaction } from '../../types'
import { TransactionImage } from '../ui/TransactionImage'

// ─── View period ──────────────────────────────────────────────────────────────
type ViewPeriod = 'D' | 'W' | 'M' | 'Y'

interface BarItem {
  label: string
  total: number
  dominantCategory: string | null
  dominantColor: string
  isToday?: boolean
}

// ─── Period range helpers ─────────────────────────────────────────────────────
function getPeriodRange(vp: ViewPeriod, viewDate: Date): { start: Date; end: Date; label: string; isCurrentPeriod: boolean } {
  const d = new Date(viewDate)
  const now = new Date()

  if (vp === 'D') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    const isToday = start.toDateString() === now.toDateString()
    const label = isToday ? 'Today' : start.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
    return { start, end, label, isCurrentPeriod: isToday }
  }

  if (vp === 'W') {
    const day = d.getDay()
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((day + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    sun.setHours(23, 59, 59, 999)
    const label = `${mon.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
    return { start: mon, end: sun, label, isCurrentPeriod: now >= mon && now <= sun }
  }

  if (vp === 'M') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const label = start.toLocaleDateString('default', { month: 'long', year: 'numeric' })
    return { start, end, label, isCurrentPeriod: now >= start && now <= end }
  }

  // Y
  const start = new Date(d.getFullYear(), 0, 1)
  const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { start, end, label: String(d.getFullYear()), isCurrentPeriod: now >= start && now <= end }
}

function navigateDate(vp: ViewPeriod, viewDate: Date, dir: -1 | 1): Date {
  const d = new Date(viewDate)
  if (vp === 'D') d.setDate(d.getDate() + dir)
  else if (vp === 'W') d.setDate(d.getDate() + dir * 7)
  else if (vp === 'M') d.setMonth(d.getMonth() + dir)
  else d.setFullYear(d.getFullYear() + dir)
  return d
}

// ─── Bar computation ──────────────────────────────────────────────────────────
function makeBucketBar(label: string, txns: Transaction[], isToday?: boolean): BarItem {
  const total = txns.reduce((s, t) => s + t.amount, 0)
  const catMap = new Map<string, number>()
  for (const t of txns) {
    const cat = t.category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount)
  }
  let dominantCategory: string | null = null
  let maxAmt = 0
  catMap.forEach((amt, cat) => { if (amt > maxAmt) { maxAmt = amt; dominantCategory = cat } })
  const dominantColor = dominantCategory ? (CATEGORY_COLORS[dominantCategory] ?? '#B2BEC3') : '#B2BEC3'
  return { label, total, dominantCategory, dominantColor, isToday }
}

function computeBars(
  transactions: Transaction[],
  vp: ViewPeriod,
  viewDate: Date,
  filterCategory: string | null
): BarItem[] {
  const { start } = getPeriodRange(vp, viewDate)
  const now = new Date()

  // Filter to period + expenses + optional category
  const txns = transactions.filter(t =>
    t.type === 'expense' &&
    (filterCategory === null || t.category === filterCategory)
  )

  if (vp === 'D') {
    return Array.from({ length: 12 }, (_, i) => {
      const h = i * 2
      const hour12 = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`
      const dayStart = new Date(start)
      const bucketStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), h, 0, 0, 0)
      const bucketEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), h + 1, 59, 59, 999)
      const b = txns.filter(t => t.date >= bucketStart && t.date <= bucketEnd)
      return makeBucketBar(hour12, b)
    })
  }

  if (vp === 'W') {
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0)
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999)
      const b = txns.filter(t => t.date >= dayStart && t.date <= dayEnd)
      const isToday = dayStart.toDateString() === now.toDateString()
      return makeBucketBar(dayLetters[i], b, isToday)
    })
  }

  if (vp === 'M') {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dayStart = new Date(start.getFullYear(), start.getMonth(), day, 0, 0, 0, 0)
      const dayEnd = new Date(start.getFullYear(), start.getMonth(), day, 23, 59, 59, 999)
      const b = txns.filter(t => t.date >= dayStart && t.date <= dayEnd)
      const isToday = dayStart.toDateString() === now.toDateString()
      return makeBucketBar(String(day), b, isToday)
    })
  }

  // Y — 12 months
  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  return Array.from({ length: 12 }, (_, i) => {
    const mStart = new Date(start.getFullYear(), i, 1)
    const mEnd = new Date(start.getFullYear(), i + 1, 0, 23, 59, 59, 999)
    const b = txns.filter(t => t.date >= mStart && t.date <= mEnd)
    const isCurrent = now >= mStart && now <= mEnd
    return makeBucketBar(monthLabels[i], b, isCurrent)
  })
}

// ─── Stats computation ────────────────────────────────────────────────────────
function computeStats(transactions: Transaction[], vp: ViewPeriod, viewDate: Date) {
  const { start, end } = getPeriodRange(vp, viewDate)
  const txns = transactions.filter(t => t.type === 'expense' && t.date >= start && t.date <= end)
  const total = txns.reduce((s, t) => s + t.amount, 0)

  // Days elapsed (or full period for past periods)
  const now = new Date()
  const periodEnd = end < now ? end : now
  const msElapsed = periodEnd.getTime() - start.getTime()
  const daysElapsed = Math.max(1, Math.ceil(msElapsed / 86400000))

  const avgPerDay = daysElapsed > 0 ? total / daysElapsed : 0
  const biggest = txns.length > 0 ? txns.reduce((m, t) => t.amount > m.amount ? t : m, txns[0]) : null

  // No-spend days (only meaningful for M/Y/W)
  let noSpendDays = 0
  if (vp === 'M') {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const today = now.getDate()
    const checkUntil = start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
      ? today : daysInMonth
    for (let d = 1; d <= checkUntil; d++) {
      const ds = new Date(start.getFullYear(), start.getMonth(), d, 0, 0, 0, 0)
      const de = new Date(start.getFullYear(), start.getMonth(), d, 23, 59, 59, 999)
      if (!txns.some(t => t.date >= ds && t.date <= de)) noSpendDays++
    }
  } else if (vp === 'W') {
    for (let i = 0; i < 7; i++) {
      const ds = new Date(start)
      ds.setDate(start.getDate() + i)
      ds.setHours(0, 0, 0, 0)
      if (ds > now) break
      const de = new Date(ds)
      de.setHours(23, 59, 59, 999)
      if (!txns.some(t => t.date >= ds && t.date <= de)) noSpendDays++
    }
  }

  return { count: txns.length, avgPerDay, biggest, noSpendDays, total }
}

// ─── Interesting facts ────────────────────────────────────────────────────────
function computeInsights(transactions: Transaction[], vp: ViewPeriod, viewDate: Date): Array<{ emoji: string; text: string }> {
  const { start, end } = getPeriodRange(vp, viewDate)
  const txns = transactions.filter(t => t.type === 'expense' && t.date >= start && t.date <= end)
  if (txns.length === 0) return []

  const facts: Array<{ emoji: string; text: string }> = []
  const total = txns.reduce((s, t) => s + t.amount, 0)

  // Category frequency + totals
  const catCount = new Map<string, number>()
  const catTotal = new Map<string, number>()
  for (const t of txns) {
    const cat = t.category ?? 'Other'
    catCount.set(cat, (catCount.get(cat) ?? 0) + 1)
    catTotal.set(cat, (catTotal.get(cat) ?? 0) + t.amount)
  }

  let topFreqCat = '', topFreqCount = 0
  catCount.forEach((count, cat) => { if (count > topFreqCount) { topFreqCount = count; topFreqCat = cat } })

  let topSpendCat = '', topSpendAmt = 0
  catTotal.forEach((amt, cat) => { if (amt > topSpendAmt) { topSpendAmt = amt; topSpendCat = cat } })

  // Biggest single transaction
  const biggest = txns.reduce((m, t) => t.amount > m.amount ? t : m, txns[0])

  // No-spend days
  let noSpendDays = 0
  if (vp === 'M') {
    const now = new Date()
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const checkUntil = start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
      ? now.getDate() : daysInMonth
    for (let d = 1; d <= checkUntil; d++) {
      const ds = new Date(start.getFullYear(), start.getMonth(), d, 0, 0, 0, 0)
      const de = new Date(start.getFullYear(), start.getMonth(), d, 23, 59, 59, 999)
      if (!txns.some(t => t.date >= ds && t.date <= de)) noSpendDays++
    }
  }

  // Weekend spending
  const weekendTxns = txns.filter(t => { const wd = t.date.getDay(); return wd === 0 || wd === 6 })
  const weekendTotal = weekendTxns.reduce((s, t) => s + t.amount, 0)
  const weekendPct = total > 0 ? Math.round((weekendTotal / total) * 100) : 0

  // Best day of week (most spend)
  if (topFreqCat && topFreqCount >= 2) {
    facts.push({ emoji: '🔁', text: `${topFreqCat} was your most frequent — ${topFreqCount} times` })
  }

  if (biggest && biggest.amount > 0) {
    facts.push({ emoji: '💸', text: `Biggest purchase: ${biggest.name} at ${formatHeaderNumber(biggest.amount)}` })
  }

  if (noSpendDays > 0) {
    facts.push({ emoji: '🎯', text: `${noSpendDays} no-spend ${noSpendDays === 1 ? 'day' : 'days'} — nice discipline!` })
  }

  if (weekendPct > 30 && txns.length >= 4) {
    facts.push({ emoji: '🏖️', text: `${weekendPct}% of spending happened on weekends` })
  }

  if (topSpendCat && topSpendAmt > 0 && topSpendCat !== topFreqCat) {
    facts.push({ emoji: '📊', text: `${topSpendCat} was the biggest category at ${formatHeaderNumber(topSpendAmt)}` })
  }

  const avgTx = txns.length > 0 ? total / txns.length : 0
  if (avgTx > 0) {
    facts.push({ emoji: '🧮', text: `Average transaction: ${formatHeaderNumber(Math.round(avgTx))}` })
  }

  return facts.slice(0, 3)
}

// ─── Top categories for the period ───────────────────────────────────────────
function getTopCategories(transactions: Transaction[], vp: ViewPeriod, viewDate: Date): string[] {
  const { start, end } = getPeriodRange(vp, viewDate)
  const catTotal = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || t.date < start || t.date > end) continue
    const cat = t.category ?? 'Other'
    catTotal.set(cat, (catTotal.get(cat) ?? 0) + t.amount)
  }
  return Array.from(catTotal.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat)
}

// ─── Bar chart component ──────────────────────────────────────────────────────
function SpendingChart({ bars, viewPeriod, animated }: { bars: BarItem[]; viewPeriod: ViewPeriod; animated: boolean }) {
  const maxVal = Math.max(...bars.map(b => b.total), 1)
  const CHART_HEIGHT = 96

  const showLabel = (i: number): boolean => {
    if (viewPeriod === 'M') {
      const n = bars.length
      return i === 0 || i === n - 1 || (i + 1) % 7 === 0
    }
    if (viewPeriod === 'D') return i % 3 === 0
    return true
  }

  return (
    <div className="flex items-end gap-[2px] px-1" style={{ height: CHART_HEIGHT + 16 }}>
      {bars.map((bar, i) => {
        const barH = bar.total > 0
          ? Math.max(4, (bar.total / maxVal) * CHART_HEIGHT)
          : 3
        return (
          <div key={i} className="flex flex-col items-center justify-end flex-1 min-w-0">
            <div
              className="w-full rounded-t-[3px] transition-all duration-700"
              style={{
                height: animated ? barH : 3,
                background: bar.total > 0 ? bar.dominantColor : 'var(--color-border)',
                opacity: bar.total > 0 ? 1 : 0.4,
                transitionDelay: `${i * 18}ms`,
                outline: bar.isToday ? '2px solid var(--color-text-primary)' : 'none',
                outlineOffset: '1px',
              }}
            />
            <span
              className="font-rounded leading-none mt-1 truncate"
              style={{
                fontSize: viewPeriod === 'M' ? 7 : 9,
                color: bar.isToday ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                fontWeight: bar.isToday ? 700 : 400,
                opacity: showLabel(i) ? 1 : 0,
                maxWidth: '100%',
              }}
            >
              {bar.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-2xl px-4 py-3.5 bg-bg-secondary min-w-0">
      <p className="text-[11px] text-text-secondary font-rounded mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-[17px] font-bold text-text-primary font-rounded tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-text-tertiary font-rounded mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[14px] text-text-primary font-rounded">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-income' : 'bg-bg-secondary'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ─── Budget Settings Sheet (stacked on top) ───────────────────────────────────
function BudgetSettingsSheet({ budget, onSave, onRemove, onClose }: {
  budget: Budget | null
  onSave: (b: Budget) => void
  onRemove: () => void
  onClose: () => void
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '')
  const [period, setPeriod] = useState<Budget['period']>(budget?.period ?? 'monthly')
  const [alertThreshold, setAlertThreshold] = useState(budget?.alert_threshold ?? 0.75)
  const [countIncome, setCountIncome] = useState(budget?.count_income ?? false)
  const [rollover, setRollover] = useState(budget?.rollover_enabled ?? false)
  const [notifications, setNotifications] = useState(budget?.notifications_enabled ?? true)
  const [amountError, setAmountError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  function close() { setIsClosing(true); setTimeout(onClose, 280) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function handleSave() {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!parsed || parsed <= 0) { setAmountError('Budget must be more than $0'); return }
    setAmountError('')
    const now = new Date()
    onSave({
      id: budget?.id ?? String(Date.now()),
      amount: parsed, period,
      period_start_day: budget?.period_start_day ?? 1,
      alert_threshold: alertThreshold,
      alert_fired_at: null,
      notifications_enabled: notifications,
      count_income: countIncome,
      rollover_enabled: rollover,
      created_at: budget?.created_at ?? now,
      updated_at: now,
    })
    close()
  }

  const dragStart = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) { dragStart.current = e.touches[0]?.clientY ?? null }
  function onTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    if ((e.changedTouches[0]?.clientY ?? 0) - dragStart.current > 80) close()
    dragStart.current = null
  }

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-[60] flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.3)' }}
      onClick={(e) => { if (e.target === backdropRef.current) close() }}
    >
      <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div
        className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow overflow-y-auto no-scrollbar ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ maxHeight: 'calc(88vh - max(8px, env(safe-area-inset-bottom)))' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-[5px] pb-3"><div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} /></div>
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <span className="text-[17px] font-semibold text-text-primary font-rounded">
            {budget ? 'Edit budget' : 'Set a budget'}
          </span>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center text-text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 space-y-5" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          <div>
            <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Budget amount</p>
            <div className="flex items-center bg-bg-secondary rounded-xl px-4 py-3 gap-1">
              <span className="text-[17px] font-semibold text-text-primary font-rounded">$</span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
                placeholder="0"
                className="flex-1 text-[17px] font-semibold text-text-primary font-rounded bg-transparent focus:outline-none"
              />
            </div>
            {amountError && <p className="text-[12px] text-expense mt-1">{amountError}</p>}
          </div>

          <div>
            <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Period</p>
            <div className="flex gap-2">
              {(['monthly', 'weekly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`flex-1 py-2.5 rounded-full text-[13px] font-semibold font-rounded transition-colors ${period === p ? 'bg-text-primary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12px] text-text-secondary font-rounded mb-1.5">Alert me at</p>
            <div className="flex gap-2">
              {[0.5, 0.6, 0.75, 0.9].map((t) => (
                <button key={t} onClick={() => setAlertThreshold(t)}
                  className={`flex-1 py-2.5 rounded-full text-[13px] font-semibold font-rounded transition-colors ${alertThreshold === t ? 'bg-text-primary text-white' : 'bg-bg-secondary text-text-secondary'}`}>
                  {Math.round(t * 100)}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <ToggleRow label="Push notifications" value={notifications} onChange={setNotifications} />
            <ToggleRow label="Count income toward budget" value={countIncome} onChange={setCountIncome} />
            <ToggleRow label="Roll over unspent budget" value={rollover} onChange={setRollover} />
          </div>

          <button onClick={handleSave}
            className="w-full py-3.5 rounded-full bg-text-primary text-white text-[15px] font-semibold font-rounded">
            Save
          </button>

          {budget && !confirmRemove && (
            <button onClick={() => setConfirmRemove(true)}
              className="w-full py-2 text-[13px] text-text-secondary font-rounded text-center">
              Remove budget
            </button>
          )}
          {budget && confirmRemove && (
            <div className="rounded-xl px-4 py-3 budget-danger-bg">
              <p className="text-[13px] text-text-primary font-rounded mb-3">
                Remove your budget? Your spending history is kept.
              </p>
              <div className="flex gap-2">
                <button onClick={() => { onRemove(); close() }}
                  className="flex-1 py-2 rounded-full bg-expense text-white text-[13px] font-semibold font-rounded">Remove</button>
                <button onClick={() => setConfirmRemove(false)}
                  className="flex-1 py-2 rounded-full bg-bg-secondary text-text-secondary text-[13px] font-semibold font-rounded">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

// ─── SpendingSheet ────────────────────────────────────────────────────────────
interface SpendingSheetProps {
  onClose: () => void
  initialScrollToSettings?: boolean
}

export function SpendingSheet({ onClose, initialScrollToSettings }: SpendingSheetProps) {
  const { transactions, budget, setBudget } = useExpense()
  const [isClosing, setIsClosing] = useState(false)
  const [animated, setAnimated] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('M')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showBudgetSettings, setShowBudgetSettings] = useState(initialScrollToSettings ?? false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  function close() { setIsClosing(true); setTimeout(onClose, 300) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Drag to close
  const dragStart = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) { dragStart.current = e.touches[0]?.clientY ?? null }
  function onTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    if ((e.changedTouches[0]?.clientY ?? 0) - dragStart.current > 80) close()
    dragStart.current = null
  }

  // Recompute everything when period/date/filter changes
  const { start: _s, end: _e, label: periodLabel, isCurrentPeriod } = useMemo(
    () => getPeriodRange(viewPeriod, viewDate), [viewPeriod, viewDate]
  )

  const bars = useMemo(
    () => computeBars(transactions, viewPeriod, viewDate, filterCategory),
    [transactions, viewPeriod, viewDate, filterCategory]
  )

  const stats = useMemo(
    () => computeStats(transactions, viewPeriod, viewDate),
    [transactions, viewPeriod, viewDate]
  )

  const topCategories = useMemo(
    () => getTopCategories(transactions, viewPeriod, viewDate),
    [transactions, viewPeriod, viewDate]
  )

  const insights = useMemo(
    () => computeInsights(transactions, viewPeriod, viewDate),
    [transactions, viewPeriod, viewDate]
  )

  // Budget info for current period
  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPeriodRange(viewPeriod, viewDate), [viewPeriod, viewDate]
  )
  const periodExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date >= periodStart && t.date <= periodEnd)
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, periodStart, periodEnd])

  const budgetRemaining = budget ? budget.amount - periodExpenses : null
  const budgetPct = budget ? Math.max(0, Math.min(1, (budgetRemaining ?? 0) / budget.amount)) : null
  const isOverBudget = budgetRemaining !== null && budgetRemaining < 0

  function switchPeriod(p: ViewPeriod) {
    setAnimated(false)
    setViewPeriod(p)
    setViewDate(new Date())
    setFilterCategory(null)
    setTimeout(() => setAnimated(true), 60)
  }

  function navigatePeriod(dir: -1 | 1) {
    setAnimated(false)
    setViewDate(prev => navigateDate(viewPeriod, prev, dir))
    setTimeout(() => setAnimated(true), 60)
  }

  return (
    <>
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={(e) => { if (e.target === backdropRef.current) close() }}
      >
        <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          <div
            ref={sheetRef}
            className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow overflow-y-auto no-scrollbar ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            style={{ maxHeight: 'calc(92vh - max(8px, env(safe-area-inset-bottom)))' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Grabber ── */}
            <div className="flex justify-center pt-[5px] pb-2">
              <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
            </div>

            {/* ── Period nav header ── */}
            <div className="flex items-center justify-between px-5 pt-2 pb-1">
              <button
                onClick={() => navigatePeriod(-1)}
                className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-[14px] font-semibold font-rounded text-text-secondary">{periodLabel}</span>
              <button
                onClick={() => { if (!isCurrentPeriod) navigatePeriod(1) }}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${isCurrentPeriod ? 'opacity-20 pointer-events-none' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* ── Big metric ── */}
            <div className="px-6 pt-2 pb-0">
              <p className="text-[13px] text-text-secondary font-rounded mb-0.5">Total spent</p>
              <div className="flex items-end gap-3">
                <span
                  className="text-[42px] font-bold font-rounded tabular-nums leading-none"
                  style={{ color: isOverBudget ? 'var(--color-expense)' : 'var(--color-text-primary)' }}
                >
                  {formatHeaderNumber(stats.total)}
                </span>
                {budget && isCurrentPeriod && (
                  <span className="text-[14px] text-text-secondary font-rounded mb-1.5">
                    of {formatHeaderNumber(budget.amount)}
                  </span>
                )}
              </div>

              {/* Budget progress bar */}
              {budget && budgetPct !== null && (
                <div className="mt-3 mb-1">
                  <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: animated ? `${Math.min(100, (1 - budgetPct) * 100)}%` : '0%',
                        background: isOverBudget
                          ? 'var(--color-red-progress)'
                          : budgetPct > 0.4
                            ? 'var(--color-green-progress)'
                            : budgetPct > 0.1
                              ? 'var(--color-orange-progress)'
                              : 'var(--color-red-progress)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-text-secondary font-rounded">
                      {isOverBudget
                        ? `${formatHeaderNumber(Math.abs(budgetRemaining!))} over budget`
                        : `${formatHeaderNumber(budgetRemaining!)} left`}
                    </span>
                    <span className="text-[11px] text-text-secondary font-rounded">
                      {Math.round((1 - budgetPct) * 100)}% used
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── D/W/M/Y tabs ── */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex gap-1 bg-bg-secondary rounded-full p-1">
                {(['D', 'W', 'M', 'Y'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => switchPeriod(p)}
                    className={`flex-1 py-1.5 rounded-full text-[13px] font-semibold font-rounded transition-all ${
                      viewPeriod === p
                        ? 'bg-bg-card text-text-primary float-shadow-sm'
                        : 'text-text-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Bar chart ── */}
            <div className="px-5 pt-2 pb-1">
              {bars.every(b => b.total === 0) ? (
                <div className="h-28 flex items-center justify-center">
                  <p className="text-[14px] text-text-hint font-rounded">No spending data</p>
                </div>
              ) : (
                <SpendingChart bars={bars} viewPeriod={viewPeriod} animated={animated} />
              )}
            </div>

            {/* ── Category filter chips ── */}
            {topCategories.length > 0 && (
              <div className="px-5 pt-2 pb-3">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  {/* All chip */}
                  <button
                    onClick={() => setFilterCategory(null)}
                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold font-rounded transition-all ${
                      filterCategory === null
                        ? 'bg-text-primary text-white'
                        : 'bg-bg-secondary text-text-secondary'
                    }`}
                  >
                    All
                  </button>
                  {topCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                      className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold font-rounded transition-all ${
                        filterCategory === cat
                          ? 'text-white'
                          : 'bg-bg-secondary text-text-secondary'
                      }`}
                      style={filterCategory === cat ? { background: CATEGORY_COLORS[cat] ?? '#B2BEC3' } : {}}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[cat] ?? '#B2BEC3' }}
                      />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Stats 2×2 grid ── */}
            <div className="px-5 pb-4">
              <div className="flex gap-2 mb-2">
                <StatCard label="Transactions" value={String(stats.count)} />
                <StatCard
                  label="Avg / day"
                  value={stats.avgPerDay > 0 ? formatHeaderNumber(Math.round(stats.avgPerDay)) : '—'}
                />
              </div>
              <div className="flex gap-2">
                <StatCard
                  label="Biggest"
                  value={stats.biggest ? formatHeaderNumber(stats.biggest.amount) : '—'}
                  sub={stats.biggest?.name}
                />
                {(viewPeriod === 'M' || viewPeriod === 'W') ? (
                  <StatCard
                    label="No-spend days"
                    value={stats.noSpendDays > 0 ? String(stats.noSpendDays) : '0'}
                    sub={stats.noSpendDays > 0 ? 'great job!' : undefined}
                  />
                ) : (
                  <StatCard
                    label="Total income"
                    value={formatHeaderNumber(
                      transactions
                        .filter(t => t.type === 'income' && t.date >= periodStart && t.date <= periodEnd)
                        .reduce((s, t) => s + t.amount, 0)
                    )}
                  />
                )}
              </div>
            </div>

            {/* ── Category breakdown ── */}
            {topCategories.length > 0 && !filterCategory && (
              <div className="px-5 pb-4">
                <p className="text-[12px] font-semibold text-text-secondary font-rounded uppercase tracking-wide mb-3">By category</p>
                <div className="space-y-3">
                  {topCategories.map((cat, i) => {
                    const catAmount = transactions
                      .filter(t => t.type === 'expense' && t.category === cat && t.date >= periodStart && t.date <= periodEnd)
                      .reduce((s, t) => s + t.amount, 0)
                    const pct = stats.total > 0 ? catAmount / stats.total : 0
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <TransactionImage category={cat} name="" size={28} />
                          <span className="flex-1 text-[13px] font-semibold text-text-primary font-rounded truncate">{cat}</span>
                          <span className="text-[13px] font-semibold text-text-primary font-rounded tabular-nums">{formatHeaderNumber(catAmount)}</span>
                          <span className="text-[11px] text-text-secondary font-rounded w-8 text-right">{Math.round(pct * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden ml-10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: animated ? `${pct * 100}%` : '0%',
                              background: CATEGORY_COLORS[cat] ?? '#B2BEC3',
                              transition: `width 500ms ease-out ${i * 60}ms`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Interesting facts ── */}
            {insights.length > 0 && (
              <div className="px-5 pb-4">
                <p className="text-[12px] font-semibold text-text-secondary font-rounded uppercase tracking-wide mb-3">Insights</p>
                <div className="space-y-2">
                  {insights.map((fact, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-2xl px-4 py-3 bg-bg-secondary"
                    >
                      <span className="text-[20px] leading-none mt-0.5">{fact.emoji}</span>
                      <p className="text-[13px] text-text-primary font-rounded leading-snug">{fact.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Budget CTA ── */}
            <div className="px-5 pb-8">
              {!budget ? (
                <button
                  onClick={() => setShowBudgetSettings(true)}
                  className="w-full py-3.5 rounded-full bg-text-primary text-white text-[15px] font-semibold font-rounded"
                >
                  Set a budget →
                </button>
              ) : (
                <button
                  onClick={() => setShowBudgetSettings(true)}
                  className="w-full py-2.5 rounded-full bg-bg-secondary text-text-secondary text-[13px] font-semibold font-rounded"
                >
                  Edit budget ✏
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBudgetSettings && (
        <BudgetSettingsSheet
          budget={budget}
          onSave={(b) => setBudget(b)}
          onRemove={() => setBudget(null)}
          onClose={() => setShowBudgetSettings(false)}
        />
      )}
    </>
  )
}
