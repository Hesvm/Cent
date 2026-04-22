import { useState, useEffect, useRef, useCallback } from 'react'
import { useExpense } from '../../context/MockExpenseContext'
import type { Transaction } from '../../types'
import { TransactionSection } from './TransactionSection'
import { TransactionDetail } from './TransactionDetail'
import { SkeletonSection } from '../ui/SkeletonRow'
import { isSameDay } from '../../utils/formatDate'

const PAGE_SIZE = 30

export function TransactionList() {
  const { transactions, isLoading } = useExpense()
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [page, setPage] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  const visible = transactions.slice(0, page * PAGE_SIZE)

  const grouped: { date: Date; items: Transaction[] }[] = []
  for (const t of visible) {
    const last = grouped[grouped.length - 1]
    if (last && isSameDay(last.date, t.date)) {
      last.items.push(t)
    } else {
      grouped.push({ date: t.date, items: [t] })
    }
  }

  const loadMore = useCallback(() => {
    if (page * PAGE_SIZE < transactions.length) setPage((p) => p + 1)
  }, [page, transactions.length])

  useEffect(() => {
    const el = bottomRef.current
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
      <div className="flex-1 overflow-y-auto">
        {grouped.map((group) => (
          <TransactionSection
            key={group.date.toISOString()}
            date={group.date}
            transactions={group.items}
            onRowClick={setSelected}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {selected && (
        <TransactionDetail
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
