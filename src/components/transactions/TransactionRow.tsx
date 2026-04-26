import type { Transaction } from '../../types'
import { TransactionImage } from '../ui/TransactionImage'
import { formatAmount } from '../../utils/formatCurrency'
import { ArrowCircleUp, ArrowCircleDown } from 'iconsax-react'

function amountWeight(amount: number): number {
  if (amount >= 500) return 800
  if (amount >= 100) return 700
  if (amount >= 20) return 600
  if (amount >= 5) return 500
  return 400
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-pill whitespace-nowrap font-rounded"
      style={{
        fontSize: 11,
        fontWeight: 400,
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-tertiary)',
        padding: '3px 8px',
        maxWidth: 120,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  onClick: () => void
  isLast: boolean
  isPending?: boolean
  onFrequencyPillClick?: (frequency: string) => void
}

const MAX_NAME_LENGTH = 24

export function TransactionRow({ transaction, onClick, isLast, isPending, onFrequencyPillClick }: TransactionRowProps) {
  const { name, amount, type, category, frequency } = transaction
  const isIncome = type === 'income'
  const displayName = name.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH) + '…' : name

  const showFrequency = frequency !== 'none'

  return (
    <>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-4 py-2 hover:bg-bg-secondary active:bg-bg-secondary transition-colors text-left ${isPending ? 'opacity-60' : ''}`}
        style={{ minHeight: '42px' }}
      >
        {/* Category image */}
        <TransactionImage category={category} name={name} size={30} />

        {/* Name + pills */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
          <span className="text-[14px] font-semibold text-text-primary leading-tight font-rounded">
            {displayName}
          </span>
          {category && <CategoryPill label={category} />}
          {showFrequency && (
            onFrequencyPillClick ? (
              <button
                onClick={(e) => { e.stopPropagation(); onFrequencyPillClick(frequency) }}
                className="inline-flex items-center rounded-pill whitespace-nowrap font-rounded"
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg-tertiary)',
                  padding: '3px 8px',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
              </button>
            ) : (
              <CategoryPill label={frequency.charAt(0).toUpperCase() + frequency.slice(1)} />
            )
          )}
          {isPending && (
            <span className="text-[10px] text-text-hint">saving…</span>
          )}
        </div>

        {/* Amount + icon */}
        <div className={`flex items-center gap-1 flex-shrink-0 ${isIncome ? 'text-income' : 'text-expense'}`}>
          <span
            className="text-[14px] font-rounded tabular-nums"
            style={{ fontWeight: amountWeight(amount) }}
          >
            ${formatAmount(amount)}
          </span>
          {isIncome ? (
            <ArrowCircleUp size={16} variant="Bold" color="var(--color-income)" />
          ) : (
            <ArrowCircleDown size={16} variant="Bold" color="var(--color-expense)" />
          )}
        </div>
      </button>

      {!isLast && (
        <div style={{ marginLeft: '16px', marginRight: '16px', borderTop: '1.5px dashed var(--color-border-dashed)' }} />
      )}
    </>
  )
}
