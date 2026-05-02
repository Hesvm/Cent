import { useState, useRef, useEffect } from 'react'
import { useRecurringExpenses, type RecurringTransaction } from '../hooks/useRecurringExpenses'
import { TransactionImage } from './ui/TransactionImage'
import { formatAmount } from '../utils/formatCurrency'
import { getNextDate } from '../utils/recurring'

type FrequencyFilter = 'all' | 'monthly' | 'weekly' | 'yearly' | 'daily'

type Props = {
  isOpen: boolean
  onClose: () => void
  defaultFrequency?: FrequencyFilter
}

const FILTER_LABELS: { key: FrequencyFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'daily', label: 'Daily' },
]

const FREQ_ORDER: FrequencyFilter[] = ['monthly', 'weekly', 'daily', 'yearly']

function getNextExpectedDate(item: RecurringTransaction): string {
  const next = getNextDate(item.last_logged_at, item.recurring)

  const today = new Date()
  if (next < today) return 'Due now'

  const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `In ${diffDays} days`

  return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  return (
    <span
      className="inline-flex items-center rounded-pill whitespace-nowrap font-rounded"
      style={{
        fontSize: 10,
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-tertiary)',
        padding: '2px 7px',
      }}
    >
      {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
    </span>
  )
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-pill whitespace-nowrap font-rounded"
      style={{
        fontSize: 10,
        fontWeight: 400,
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-tertiary)',
        padding: '2px 7px',
        maxWidth: 90,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
  )
}

function StaleNudgeCard({
  item,
  onKeep,
  onRemove,
}: {
  item: RecurringTransaction
  onKeep: () => void
  onRemove: () => void
}) {
  const days = daysSince(item.last_logged_at)
  return (
    <div
      className="rounded-[16px] px-4 py-3 mb-2"
      style={{ background: 'rgba(245, 158, 11, 0.10)' }}
    >
      <p className="text-[13px] font-medium text-text-primary mb-2 font-rounded">
        {item.name} hasn't been logged in {days} days. Still paying for it?
      </p>
      <div className="flex gap-2">
        <button
          onClick={onKeep}
          className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
          style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
        >
          Yes, keep it
        </button>
        <button
          onClick={onRemove}
          className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
          style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-expense)' }}
        >
          Stop tracking
        </button>
      </div>
    </div>
  )
}

function RecurringRow({
  item,
  onUpdateFrequency,
  onDelete,
}: {
  item: RecurringTransaction
  onUpdateFrequency: (id: string, freq: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [showActions, setShowActions] = useState(false)
  const [showFreqPicker, setShowFreqPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [working, setWorking] = useState(false)

  const nextDate = getNextExpectedDate(item)
  const isDue = nextDate === 'Due now' || nextDate === 'Due today'

  async function handleFreqChange(freq: string) {
    setWorking(true)
    setShowFreqPicker(false)
    setShowActions(false)
    await onUpdateFrequency(item.id, freq)
    setWorking(false)
  }

  async function handleDelete() {
    setWorking(true)
    await onDelete(item.id)
    setWorking(false)
  }

  return (
    <div
      className="rounded-[14px] mb-1 overflow-hidden"
      style={{ opacity: working ? 0.5 : 1, background: 'var(--color-bg-secondary)' }}
    >
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        onClick={() => { setShowActions(v => !v); setConfirmDelete(false); setShowFreqPicker(false) }}
      >
        <TransactionImage category={item.category} name={item.name} size={32} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <span className="text-[14px] font-semibold text-text-primary font-rounded">{item.name}</span>
            {item.category && <CategoryBadge label={item.category} />}
            <FrequencyBadge frequency={item.frequency} />
          </div>
          <p className={`text-[11px] font-rounded ${isDue ? 'text-expense font-medium' : 'text-text-secondary'}`}>
            Next: {nextDate}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className="text-[15px] font-bold font-rounded tabular-nums"
            style={{ color: item.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)' }}
          >
            ${formatAmount(item.amount)}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: showActions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {showActions && !confirmDelete && !showFreqPicker && (
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={() => setShowFreqPicker(true)}
            className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            Change frequency
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
            style={{ background: 'rgba(239, 68, 68, 0.10)', color: 'var(--color-expense)' }}
          >
            Remove
          </button>
        </div>
      )}

      {showFreqPicker && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-text-secondary font-rounded mb-2">Change frequency</p>
          <div className="flex flex-wrap gap-1.5">
            {(['monthly', 'weekly', 'daily', 'yearly', 'none'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleFreqChange(f)}
                className="text-[12px] font-rounded rounded-pill px-3 py-1.5 transition-colors font-semibold"
                style={
                  item.frequency === f
                    ? { background: 'var(--color-text-primary)', color: 'var(--color-bg-page)' }
                    : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }
                }
              >
                {f === 'none' ? 'Not recurring' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFreqPicker(false)}
            className="mt-2 text-[11px] text-text-secondary font-rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="px-3 pb-3">
          <p className="text-[13px] font-medium text-text-primary font-rounded mb-2">
            Remove {item.name} from your history?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 text-[12px] font-semibold font-rounded rounded-pill py-1.5"
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-expense)' }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function RecurringHub({ isOpen, onClose, defaultFrequency = 'all' }: Props) {
  const { transactions, monthlyBurn, staleItems, isLoading, updateFrequency, deleteRecurring } = useRecurringExpenses()
  const [activeFilter, setActiveFilter] = useState<FrequencyFilter>(defaultFrequency)
  const [dismissedStale, setDismissedStale] = useState<Set<string>>(new Set())
  const [isClosing, setIsClosing] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)

  // Sync filter when defaultFrequency changes (hub opened with a specific freq)
  useEffect(() => {
    if (isOpen) {
      setActiveFilter(defaultFrequency)
      setIsClosing(false)
    }
  }, [isOpen, defaultFrequency])

  function close() {
    setIsClosing(true)
    setTimeout(onClose, 280)
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) close()
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0]?.clientY ?? null
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    const delta = (e.changedTouches[0]?.clientY ?? 0) - dragStart.current
    if (delta > 80) close()
    dragStart.current = null
  }

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!isOpen) return null

  const visibleStale = staleItems.filter(s => !dismissedStale.has(s.id))

  const filtered = activeFilter === 'all'
    ? transactions
    : transactions.filter(t => t.frequency === activeFilter)

  const grouped: { freq: FrequencyFilter; items: RecurringTransaction[] }[] =
    activeFilter === 'all'
      ? FREQ_ORDER
          .map(freq => ({ freq, items: transactions.filter(t => t.frequency === freq) }))
          .filter(g => g.items.length > 0)
      : [{ freq: activeFilter, items: filtered }]

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleBackdropClick}
    >
      <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div
          className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
          style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-[5px] pb-2 flex-shrink-0">
            <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
            <div>
              <h2 className="text-[18px] font-bold text-text-primary font-rounded">Recurring Expenses</h2>
              <p className="text-[12px] text-text-secondary font-rounded">Your fixed costs, laid bare.</p>
            </div>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto no-scrollbar px-5 pb-8" style={{ flex: 1 }}>
            {/* Monthly burn hero */}
            {monthlyBurn > 0 && (
              <div className="text-center mb-5 py-4 rounded-[20px]" style={{ background: 'var(--color-bg-secondary)' }}>
                <p
                  className="font-bold text-text-primary font-rounded tabular-nums"
                  style={{ fontSize: 40, lineHeight: 1.1 }}
                >
                  ${Math.round(monthlyBurn)}
                </p>
                <p className="text-[13px] text-text-secondary font-rounded mt-1">locked in every month</p>
                <p className="text-[12px] font-rounded mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  ${Math.round(monthlyBurn * 12)} this year
                </p>
              </div>
            )}

            {/* Stale nudge cards */}
            {visibleStale.length > 0 && (
              <div className="mb-4">
                {visibleStale.map(item => (
                  <StaleNudgeCard
                    key={item.id}
                    item={item}
                    onKeep={() => setDismissedStale(prev => new Set(prev).add(item.id))}
                    onRemove={async () => {
                      setDismissedStale(prev => new Set(prev).add(item.id))
                      await deleteRecurring(item.id)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
              {FILTER_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className="flex-shrink-0 text-[12px] font-semibold font-rounded rounded-pill px-3 py-1.5 transition-colors"
                  style={
                    activeFilter === key
                      ? { background: 'var(--color-text-primary)', color: 'var(--color-bg-page)' }
                      : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-16 rounded-[14px] animate-pulse"
                    style={{ background: 'var(--color-bg-secondary)' }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && transactions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-[16px] font-semibold text-text-primary font-rounded mb-1">No recurring expenses yet.</p>
                <p className="text-[13px] text-text-secondary font-rounded">Tag an expense as Monthly to start tracking your fixed costs.</p>
              </div>
            )}

            {/* Transaction groups */}
            {!isLoading && grouped.map(({ freq, items }) => (
              <div key={freq} className="mb-3">
                {activeFilter === 'all' && (
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide font-rounded mb-1.5 px-1">
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </p>
                )}
                {items.map(item => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onUpdateFrequency={updateFrequency}
                    onDelete={deleteRecurring}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
