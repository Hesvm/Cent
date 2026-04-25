import { useEffect, useRef, useState } from 'react'
import type { Transaction, Frequency } from '../../types'
import { useExpense } from '../../context/ExpenseContext'
import { formatDetailDate } from '../../utils/formatDate'
import { formatAmount } from '../../utils/formatCurrency'
import { TransactionImage } from '../ui/TransactionImage'
import { CATEGORIES, CATEGORY_GROUP_ORDER, getCategoriesByGroup } from '../../config/categories'

const FREQUENCIES: Frequency[] = ['none', 'daily', 'weekly', 'monthly', 'yearly']

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

// ─── Category Picker ──────────────────────────────────────────────────────────
function CategoryPicker({
  current,
  onSelect,
  onClose,
}: {
  current: string | null
  onSelect: (cat: string | null) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const byGroup = getCategoriesByGroup()

  const filtered = search.trim()
    ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      {/* Floating card wrapper */}
      <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div
        className="bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow no-scrollbar"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-[5px] pb-3 flex-shrink-0">
          <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
        </div>

        <div className="px-4 pb-2 flex-shrink-0">
          {/* Current selection */}
          {current && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <TransactionImage category={current} name={current} size={24} />
                <span className="text-[14px] font-medium text-text-primary font-rounded">{current}</span>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="text-[13px] text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Remove
              </button>
            </div>
          )}

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 rounded-[10px]"
            style={{ background: 'var(--color-bg-secondary)', height: 36 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-hint focus:outline-none font-rounded"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto no-scrollbar px-4 pb-8" style={{ flex: 1 }}>
          {filtered ? (
            // Search results — flat list
            filtered.length === 0 ? (
              <p className="text-center text-text-hint text-[14px] py-8">No categories found</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 py-2">
                {filtered.map((cat) => (
                  <CategoryCell
                    key={cat.name}
                    name={cat.name}
                    selected={current === cat.name}
                    onSelect={() => onSelect(cat.name)}
                  />
                ))}
              </div>
            )
          ) : (
            // Grouped grid
            CATEGORY_GROUP_ORDER.map((group) => (
              <div key={group}>
                <p
                  className="uppercase tracking-wider font-rounded"
                  style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.8px', marginTop: 20, marginBottom: 10 }}
                >
                  {group}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(byGroup[group] ?? []).map((cat) => (
                    <CategoryCell
                      key={cat.name}
                      name={cat.name}
                      selected={current === cat.name}
                      onSelect={() => onSelect(cat.name)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

function CategoryCell({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
      style={{
        background: selected ? 'var(--color-bg-secondary)' : 'transparent',
        border: selected ? '1.5px solid var(--color-text-primary)' : '1.5px solid transparent',
      }}
    >
      <TransactionImage category={name} name={name} size={40} />
      <span
        className="text-center font-rounded leading-tight"
        style={{
          fontSize: 10,
          fontWeight: 400,
          color: 'var(--color-text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        {name}
      </span>
    </button>
  )
}

// ─── Main sheet ───────────────────────────────────────────────────────────────
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
  const [localCategory, setLocalCategory] = useState(transaction.category)
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

  async function handleCategorySelect(cat: string | null) {
    setShowCategoryPicker(false)
    setLocalCategory(cat)
    if (cat !== transaction.category) {
      await updateTransaction(transaction.id, { category: cat })
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-50 flex flex-col justify-end ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={handleBackdropClick}
      >
        {/* Floating card wrapper */}
        <div className="px-2 w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div
          ref={sheetRef}
          className={`bg-bg-card rounded-[36px] max-w-lg mx-auto float-shadow ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-[5px] pb-3">
            <div className="w-9 h-[5px] rounded-full" style={{ background: 'var(--grabber-color)' }} />
          </div>

          <div className="px-6 pb-8">
            {/* Top-right buttons */}
            <div className="flex justify-end gap-2 mb-4">
              <button
                className="w-9 h-9 rounded-full border border-border bg-bg-card flex items-center justify-center hover:bg-bg-secondary transition-colors"
                aria-label="Delete"
                onClick={handleDelete}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-expense)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>

            {deleteError && (
              <p className="text-center text-expense text-[13px] mb-2">Couldn't delete. Try again?</p>
            )}

            {/* Image */}
            <div className="flex justify-center mb-3">
              <TransactionImage category={localCategory} name={transaction.name} size={72} />
            </div>

            {/* Name */}
            {editingName ? (
              <input
                autoFocus value={name}
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

            {/* Amount */}
            <div className={`flex items-center justify-center gap-1 mb-6 ${isIncome ? 'text-income' : 'text-expense'}`}>
              {isIncome ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="var(--color-income)" strokeWidth="1.5" />
                  <line x1="10" y1="6" x2="10" y2="14" stroke="var(--color-income)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="6" y1="10" x2="14" y2="10" stroke="var(--color-income)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="var(--color-expense)" strokeWidth="1.5" />
                  <line x1="6" y1="10" x2="14" y2="10" stroke="var(--color-expense)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {editingAmount ? (
                <input
                  autoFocus type="number" inputMode="decimal"
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

              {/* Category row */}
              <button type="button" onClick={() => setShowCategoryPicker(true)} className="w-full text-left">
                <DetailRow
                  label="Category"
                  value={localCategory ?? ''}
                  placeholder="Add category"
                  hasEdit
                />
              </button>

              {/* Frequency row */}
              <button type="button" onClick={() => setShowFreqPicker((v) => !v)} className="w-full text-left">
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
                          : 'bg-bg-card text-text-primary hover:bg-bg-secondary'
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
      </div>

      {showCategoryPicker && (
        <CategoryPicker
          current={localCategory}
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </>
  )
}

function DetailRow({
  label,
  value,
  placeholder,
  hasEdit,
}: {
  label: string
  value: string
  placeholder?: string
  hasEdit?: boolean
}) {
  return (
    <div className="rounded-xl bg-[#F8F8F8] px-4 py-3.5 flex items-center justify-between">
      <span className="text-[14px] text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {value ? (
          <span className="text-[14px] font-medium text-text-primary">{value}</span>
        ) : placeholder ? (
          <span className="text-[14px] text-text-hint">{placeholder}</span>
        ) : null}
        {hasEdit && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
