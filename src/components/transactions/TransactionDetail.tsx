import { useEffect, useRef, useState } from 'react'
import type { Transaction, Category, Frequency } from '../../types'
import { useExpense } from '../../context/MockExpenseContext'
import { formatDetailDate } from '../../utils/formatDate'
import { formatAmount } from '../../utils/formatCurrency'
import { TransactionImage } from '../ui/TransactionImage'

const CATEGORIES: Category[] = [
  'Dining', 'Fitness', 'Groceries', 'Transport', 'Shopping',
  'Entertainment', 'Health', 'Housing', 'Utilities', 'Income', 'Other',
]
const FREQUENCIES: Frequency[] = ['none', 'daily', 'weekly', 'monthly', 'yearly']

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const { deleteTransaction, updateTransaction } = useExpense()
  const [notes, setNotes] = useState(transaction.notes)
  const [isClosing, setIsClosing] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(transaction.name)
  const [editingAmount, setEditingAmount] = useState(false)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [showFreqPicker, setShowFreqPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const isIncome = transaction.type === 'income'

  function close() {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) close()
  }

  async function handleDelete() {
    try {
      await deleteTransaction(transaction.id)
      close()
    } catch {
      setDeleteError(true)
      setTimeout(() => setDeleteError(false), 3000)
    }
  }

  async function handleNotesBlur() {
    if (notes !== transaction.notes) {
      await updateTransaction(transaction.id, { notes })
    }
  }

  async function commitName() {
    setEditingName(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== transaction.name) {
      await updateTransaction(transaction.id, { name: trimmed })
    } else {
      setName(transaction.name)
    }
  }

  async function commitAmount() {
    setEditingAmount(false)
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed) && parsed > 0 && parsed !== transaction.amount) {
      await updateTransaction(transaction.id, { amount: parsed })
    } else {
      setAmount(String(transaction.amount))
    }
  }

  async function setFrequency(f: Frequency) {
    setShowFreqPicker(false)
    if (f !== transaction.frequency) {
      await updateTransaction(transaction.id, { frequency: f })
    }
  }

  async function setCategory(c: Category) {
    setShowCategoryPicker(false)
    if (c !== transaction.category) {
      await updateTransaction(transaction.id, { category: c })
    }
  }

  // Drag to close
  const dragStart = useRef<number | null>(null)
  function handleTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0]?.clientY ?? null
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    const delta = (e.changedTouches[0]?.clientY ?? 0) - dragStart.current
    if (delta > 80) close()
    dragStart.current = null
  }

  // Keyboard shortcut: Escape
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
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`bg-white rounded-t-[20px] w-full max-w-lg mx-auto ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-divider" />
        </div>

        <div className="px-6 pb-8">
          {/* Top-right buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <button
              className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors"
              aria-label="Edit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Delete"
              onClick={handleDelete}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>

          {deleteError && (
            <p className="text-center text-expense text-[13px] mb-2">Couldn't delete. Try again?</p>
          )}

          {/* Transaction image */}
          <div className="flex justify-center mb-3">
            <TransactionImage category={transaction.category} name={transaction.name} size={72} />
          </div>

          {/* Name — tap to edit */}
          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName() }}
              className="w-full text-center text-[22px] font-bold text-text-primary mb-1 bg-transparent focus:outline-none border-b border-border font-rounded"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="block w-full text-center text-[22px] font-bold text-text-primary mb-1 hover:opacity-70 transition-opacity font-rounded"
            >
              {transaction.name}
            </button>
          )}

          {/* Amount — tap to edit */}
          <div className={`flex items-center justify-center gap-1 mb-6 ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#43A047" strokeWidth="1.5" />
                <line x1="10" y1="6" x2="10" y2="14" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="#D32F2F" strokeWidth="1.5" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {editingAmount ? (
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={commitAmount}
                onKeyDown={(e) => { if (e.key === 'Enter') commitAmount() }}
                className="text-[20px] font-semibold bg-transparent focus:outline-none border-b border-current w-32 text-center font-rounded"
              />
            ) : (
              <button onClick={() => setEditingAmount(true)} className="text-[20px] font-semibold hover:opacity-70 transition-opacity font-rounded">
                ${formatAmount(transaction.amount)}
              </button>
            )}
          </div>

          {/* Detail rows */}
          <div className="space-y-2">
            <DetailRow label="Date & Time" value={formatDetailDate(transaction.date)} />
            {transaction.tags.length > 0 && (
              <DetailRow
                label="Tags"
                value={transaction.tags.map((t) => t.label).join(', ')}
              />
            )}
            <button
              type="button"
              onClick={() => setShowCategoryPicker((v) => !v)}
              className="w-full text-left"
            >
              <DetailRow
                label="Category"
                value={transaction.category}
                hasEdit
              />
            </button>
            {showCategoryPicker && (
              <div className="rounded-xl bg-[#F8F8F8] p-2 grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-[13px] font-rounded rounded-lg py-2 transition-colors ${
                      transaction.category === c
                        ? 'bg-text-primary text-white font-semibold'
                        : 'bg-white text-text-primary hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowFreqPicker((v) => !v)}
              className="w-full text-left"
            >
              <DetailRow
                label="Frequency"
                value={transaction.frequency === 'none' ? 'One-time' : capitalize(transaction.frequency)}
                hasEdit
              />
            </button>
            {showFreqPicker && (
              <div className="rounded-xl bg-[#F8F8F8] p-2 flex flex-wrap gap-2">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`text-[13px] font-rounded rounded-pill px-3 py-1.5 transition-colors ${
                      transaction.frequency === f
                        ? 'bg-text-primary text-white font-semibold'
                        : 'bg-white text-text-primary hover:bg-gray-50'
                    }`}
                  >
                    {f === 'none' ? 'One-time' : capitalize(f)}
                  </button>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="rounded-xl bg-[#F8F8F8] px-4 py-3.5">
              <p className="text-[14px] text-text-secondary mb-1">Notes</p>
              <textarea
                className="w-full text-[14px] text-text-primary bg-transparent resize-none focus:outline-none min-h-[60px] placeholder:text-text-hint"
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, hasEdit }: { label: string; value: string; hasEdit?: boolean }) {
  return (
    <div className="rounded-xl bg-[#F8F8F8] px-4 py-3.5 flex items-center justify-between">
      <span className="text-[14px] text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-[14px] font-medium text-text-primary">{value}</span>}
        {hasEdit && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        )}
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
