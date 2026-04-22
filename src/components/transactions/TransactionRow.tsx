import type { Transaction } from '../../types'
import { TagPill } from '../ui/Tag'
import { TransactionImage } from '../ui/TransactionImage'
import { formatAmount } from '../../utils/formatCurrency'

// Weight scales with amount magnitude. Tiny amounts feel light; big amounts feel heavy.
function amountWeight(amount: number): number {
  if (amount >= 500) return 800
  if (amount >= 100) return 700
  if (amount >= 20) return 600
  if (amount >= 5) return 500
  return 400
}

interface TransactionRowProps {
  transaction: Transaction
  onClick: () => void
  isLast: boolean
  isPending?: boolean
}

const MAX_NAME_LENGTH = 24

export function TransactionRow({ transaction, onClick, isLast, isPending }: TransactionRowProps) {
  const { name, amount, type, tags, category } = transaction
  const isIncome = type === 'income'
  const displayName = name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) + '…' : name

  return (
    <>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-4 py-2 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors text-left ${isPending ? 'opacity-60' : ''}`}
        style={{ minHeight: '42px' }}
      >
        {/* 3D Image */}
        <TransactionImage category={category} name={name} size={30} />

        {/* Name + Tags */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
          <span className="text-[14px] font-semibold text-text-primary leading-tight font-rounded">
            {displayName}
          </span>
          {tags.map((tag) => (
            <TagPill key={tag.label} label={tag.label} />
          ))}
          {isPending && (
            <span className="text-[10px] text-text-hint">saving…</span>
          )}
        </div>

        {/* Recurring income: calendar icon */}
        {isIncome && transaction.frequency !== 'none' && (
          <span className="text-text-secondary mr-0.5 text-[13px]">🗓️</span>
        )}

        {/* Amount + Icon */}
        <div className={`flex items-center gap-1 flex-shrink-0 ${isIncome ? 'text-income' : 'text-expense'}`}>
          <span className="text-[14px] font-rounded tabular-nums" style={{ fontWeight: amountWeight(amount) }}>${formatAmount(amount)}</span>
          {isIncome ? (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#43A047" strokeWidth="1.5" />
              <line x1="10" y1="6" x2="10" y2="14" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#D32F2F" strokeWidth="1.5" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </button>

      {!isLast && (
        <div style={{ marginLeft: '16px', marginRight: '16px', borderTop: '1.5px dashed #C4C4C4' }} />
      )}
    </>
  )
}
