import { useState, useEffect, useRef, useCallback } from 'react'
import { useExpense } from '../../context/ExpenseContext'
import type { Transaction } from '../../types'
import { TransactionSection } from './TransactionSection'
import { TransactionDetail } from './TransactionDetail'
import { SkeletonSection } from '../ui/SkeletonRow'
import { isSameDay } from '../../utils/formatDate'
import { RecurringHub } from '../RecurringHub'

const PAGE_SIZE = 30

export function TransactionList() {
  const { transactions, isLoading } = useExpense()
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [recurringHubOpen, setRecurringHubOpen] = useState(false)
  const [recurringHubFilter, setRecurringHubFilter] = useState<'all' | 'monthly' | 'weekly' | 'yearly' | 'daily'>('all')
  const [page, setPage] = useState(1)

  function openRecurringHub(frequency: string) {
    const validFreqs = ['monthly', 'weekly', 'yearly', 'daily'] as const
    const filter = (validFreqs as readonly string[]).includes(frequency)
      ? frequency as typeof validFreqs[number]
      : 'all'
    setRecurringHubFilter(filter)
    setRecurringHubOpen(true)
  }
  const scrollRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const didScrollToBottom = useRef(false)

  // transactions is newest-first; take the most-recent N then reverse to oldest-first for display
  const visible = transactions.slice(0, page * PAGE_SIZE)
  const visibleOldestFirst = [...visible].reverse()

  // Group into day sections (oldest-first order)
  const grouped: { date: Date; items: Transaction[] }[] = []
  for (const t of visibleOldestFirst) {
    const last = grouped[grouped.length - 1]
    if (last && isSameDay(last.date, t.date)) {
      last.items.push(t)
    } else {
      grouped.push({ date: t.date, items: [t] })
    }
  }

  // Scroll to bottom on first render so newest (bottom) is visible
  useEffect(() => {
    if (didScrollToBottom.current) return
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
      didScrollToBottom.current = true
    }
  })

  // Load older items when the top sentinel becomes visible
  const loadMore = useCallback(() => {
    if (page * PAGE_SIZE < transactions.length) setPage((p) => p + 1)
  }, [page, transactions.length])

  useEffect(() => {
    const el = topRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <SkeletonSection />
        <SkeletonSection />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <p className="text-[17px] font-semibold text-text-primary mb-2 font-rounded">No transactions yet</p>
        <p className="text-[14px] text-text-secondary font-rounded">Type or speak your first expense below</p>
      </div>
    )
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {/* sentinel: scrolling up to here loads older transactions */}
        <div ref={topRef} className="h-1" />
        {grouped.map((group) => (
          <TransactionSection
            key={group.date.toISOString()}
            date={group.date}
            transactions={group.items}
            onRowClick={setSelected}
            onFrequencyPillClick={openRecurringHub}
          />
        ))}
        {/* breathing room between the last transaction and the input bar */}
        <div className="h-6" />
      </div>

      {selected && (
        <TransactionDetail
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <RecurringHub
        isOpen={recurringHubOpen}
        onClose={() => setRecurringHubOpen(false)}
        defaultFrequency={recurringHubFilter}
      />
    </>
  )
}
