import { createContext, useContext, useState, useRef, type ReactNode } from 'react'
import type { Transaction, Budget } from '../types'

interface PendingDeletion {
  transaction: Transaction
  expiresAt: number
}

interface ExpenseContextType {
  transactions: Transaction[]
  budgets: Budget[]
  balance: number
  isLoading: boolean
  isOffline: boolean
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  fetchTransactions: () => Promise<void>
  pendingDeletion: PendingDeletion | null
  undoDelete: () => void
}

const ExpenseContext = createContext<ExpenseContextType | null>(null)

const SEED: Transaction[] = [
  {
    id: '1',
    name: 'Box subscription',
    amount: 50,
    type: 'expense',
    category: 'Fitness',
    tags: [{ label: 'Monthly', type: 'frequency' }],
    frequency: 'monthly',
    date: new Date(Date.now() - 86400000),
    notes: '',
    emoji: '🥊',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Sam americano',
    amount: 50,
    type: 'expense',
    category: 'Dining',
    tags: [],
    frequency: 'none',
    date: new Date(Date.now() - 86400000),
    notes: '',
    emoji: '🧋',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'January salary',
    amount: 4000,
    type: 'income',
    category: 'Income',
    tags: [],
    frequency: 'monthly',
    date: new Date(Date.now() - 86400000),
    notes: '',
    emoji: '💵',
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Box subscription',
    amount: 50,
    type: 'expense',
    category: 'Fitness',
    tags: [{ label: 'Gym', type: 'category' }, { label: 'Monthly', type: 'frequency' }],
    frequency: 'monthly',
    date: new Date(),
    notes: '',
    emoji: '🥊',
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Sam americano',
    amount: 50,
    type: 'expense',
    category: 'Dining',
    tags: [],
    frequency: 'none',
    date: new Date(),
    notes: '',
    emoji: '🧋',
    createdAt: new Date(),
  },
  {
    id: '6',
    name: 'January salary',
    amount: 4000,
    type: 'income',
    category: 'Income',
    tags: [],
    frequency: 'monthly',
    date: new Date(),
    notes: '',
    emoji: '💵',
    createdAt: new Date(),
  },
]

const UNDO_WINDOW_MS = 5000

export function MockExpenseProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED)
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null)
  const undoTimer = useRef<number | null>(null)

  const balance = transactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
    0
  )

  async function addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>) {
    const newT: Transaction = { ...t, id: String(Date.now()), createdAt: new Date() }
    setTransactions((prev) => [newT, ...prev])
  }

  async function deleteTransaction(id: string) {
    const target = transactions.find((t) => t.id === id)
    if (!target) return
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    setPendingDeletion({ transaction: target, expiresAt: Date.now() + UNDO_WINDOW_MS })
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setPendingDeletion(null), UNDO_WINDOW_MS)
  }

  function undoDelete() {
    if (!pendingDeletion) return
    const t = pendingDeletion.transaction
    setTransactions((prev) => [t, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()))
    setPendingDeletion(null)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        budgets: [],
        balance,
        isLoading: false,
        isOffline: false,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        fetchTransactions: async () => {},
        pendingDeletion,
        undoDelete,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpense(): ExpenseContextType {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpense must be used inside MockExpenseProvider')
  return ctx
}
