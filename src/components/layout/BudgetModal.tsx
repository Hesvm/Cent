import { useEffect, useRef, useState } from 'react'
import { useExpense } from '../../context/ExpenseContext'
import { formatAmount } from '../../utils/formatCurrency'
import { TransactionImage } from '../ui/TransactionImage'

interface BudgetModalProps {
  budget: number
  onClose: () => void
}

export function BudgetModal({ budget, onClose }: BudgetModalProps) {
  const { transactions } = useExpense()
  const [isClosing, setIsClosing] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  function close() {
    setIsClosing(true)
    setTimeout(onClose, 250)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date >= monthStart
  )

  const byCategory = new Map<string, number>()
  for (const t of monthExpenses) {
    const cat = t.category ?? 'Other'
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + t.amount)
  }
  const breakdown = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])
  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0)
  const remaining = Math.max(0, budget - totalSpent)
  const ratio = Math.min(1, totalSpent / budget)

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === backdropRef.current) close() }}
    >
      {/* Floating card wrapper */}
      <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div
          className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grabber */}
          <div className="flex justify-center pt-[5px] pb-3">
            <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
          </div>

          <div className="px-6 pb-8">
            <p className="text-center text-[14px] text-text-secondary mb-1 font-rounded">This month</p>
            <p className="text-center text-[28px] font-bold text-text-primary mb-2 font-rounded tabular-nums">
              ${formatAmount(remaining)} left
            </p>
            <p className="text-center text-[13px] text-text-secondary mb-4 font-rounded">
              of ${formatAmount(budget)} budget · ${formatAmount(totalSpent)} spent
            </p>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-bg-secondary overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${ratio * 100}%`,
                  background: ratio < 0.6 ? 'var(--color-green-progress)' : ratio < 0.85 ? 'var(--color-yellow-progress)' : 'var(--color-red-progress)',
                }}
              />
            </div>

            <p className="text-[13px] text-text-secondary mb-2 font-rounded">By category</p>

            {breakdown.length === 0 ? (
              <p className="text-center text-[14px] text-text-hint py-8 font-rounded">No expenses this month yet</p>
            ) : (
              <div className="space-y-2">
                {breakdown.map(([cat, amount]) => {
                  const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                  return (
                    <div key={cat} className="flex items-center gap-3 rounded-xl bg-[#F8F8F8] px-3 py-2.5">
                      <TransactionImage category={cat} name="" size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-text-primary font-rounded">{cat}</span>
                          <span className="text-[14px] font-semibold text-text-primary font-rounded tabular-nums">
                            ${formatAmount(amount)}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-bg-secondary overflow-hidden mt-1.5">
                          <div className="h-full bg-text-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
