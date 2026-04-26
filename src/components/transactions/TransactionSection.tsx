import type { Transaction } from '../../types'
import { TransactionRow } from './TransactionRow'
import { formatSectionDate } from '../../utils/formatDate'
import { formatAmount } from '../../utils/formatCurrency'

interface TransactionSectionProps {
  date: Date
  transactions: Transaction[]
  onRowClick: (t: Transaction) => void
  onFrequencyPillClick?: (frequency: string) => void
}

export function TransactionSection({ date, transactions, onRowClick, onFrequencyPillClick }: TransactionSectionProps) {
  const label = formatSectionDate(date)
  const isToday = label === 'Today'

  const totalSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <section className="mb-2">
      {/* Section header */}
      <div className="px-4 pt-6 pb-3">
        <span className="text-[13px] font-normal text-text-secondary">
          {label}
          {!isToday && totalSpent > 0 && `, $${formatAmount(totalSpent)} spent`}
        </span>
      </div>

      {/* Rows */}
      <div>
        {transactions.map((t, i) => (
          <div key={t.id} className="animate-slide-in-bottom">
            <TransactionRow
              transaction={t}
              onClick={() => onRowClick(t)}
              isLast={i === transactions.length - 1}
              onFrequencyPillClick={onFrequencyPillClick}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
