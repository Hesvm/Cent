import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react'
import type { Transaction, Budget, PeriodSummary, CategorySummary, HeaderState, Insight } from '../types'
import { useInsights } from '../hooks/useInsights'

// ─── Category colors (30-category guide system) ───────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  // Food & Drink
  'Restaurants & Dining':       '#FF6B6B',
  'Coffee & Cafés':             '#D7816A',
  'Groceries':                  '#96CEB4',
  'Alcohol & Bars':             '#C56BFF',
  // Transport & Travel
  'Transport':                  '#4ECDC4',
  'Travel':                     '#0077B6',
  // Health & Wellness
  'Health & Medical':           '#54A0FF',
  'Fitness & Sports':           '#45B7D1',
  'Personal Care & Beauty':     '#F72585',
  // Entertainment
  'Entertainment':              '#F4A261',
  'Streaming & Subscriptions':  '#FF9FF3',
  'Gaming':                     '#6C63FF',
  'Books & Reading':            '#FB8500',
  // Home & Life
  'Housing & Rent':             '#5F27CD',
  'Utilities':                  '#00D2D3',
  'Home Maintenance & Repairs': '#6A4C93',
  'Pets':                       '#52B788',
  'Childcare & Kids':           '#74C69D',
  // Shopping
  'Shopping':                   '#FECA57',
  'Gifts & Occasions':          '#FF006E',
  'Charity & Donations':        '#E9C46A',
  // Finance
  'Insurance':                  '#2D6A4F',
  'Banking & Finance':          '#457B9D',
  'Investments':                '#B7B7A4',
  'Government & Taxes':         '#6B705C',
  // Work & Education
  'Education':                  '#E63946',
  'Office & Work Expenses':     '#1D3557',
  // Income
  'Salary & Income':            '#2E7D32',
  'Freelance & Side Income':    '#388E3C',
  'Rental Income':              '#43A047',
  // Legacy fallback
  'Other':                      '#B2BEC3',
}

// ─── Calculation helpers (Part 10) ────────────────────────────────────────────
export function getCircleColor(percentRemaining: number): string {
  if (percentRemaining > 0.6) return '#4CAF50'
  if (percentRemaining > 0.3) return '#F9A825'
  if (percentRemaining > 0.1) return '#FF6D00'
  return '#D32F2F'
}

export function getPeriodBounds(budget: Budget | null, referenceDate: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(referenceDate)
  if (!budget || budget.period === 'monthly') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }
  if (budget.period === 'weekly') {
    const day = d.getDay() // 0=Sun
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((day + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    sun.setHours(23, 59, 59, 999)
    return { start: mon, end: sun }
  }
  // custom: period_start_day
  const startDay = budget.period_start_day || 1
  let start: Date
  if (d.getDate() >= startDay) {
    start = new Date(d.getFullYear(), d.getMonth(), startDay)
  } else {
    start = new Date(d.getFullYear(), d.getMonth() - 1, startDay)
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, startDay - 1, 23, 59, 59, 999)
  return { start, end }
}

export function getHeaderState(
  transactions: Transaction[],
  budget: Budget | null,
): HeaderState {
  const period = getPeriodBounds(budget)
  const periodTxns = transactions.filter(t => t.date >= period.start && t.date <= period.end)
  const expenses = periodTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const income = periodTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const hasTransactions = periodTxns.length > 0

  if (!budget) {
    return {
      has_budget: false,
      show_carousel: !hasTransactions,
      display_number: expenses,
      is_negative: false,
      circle_percent: 0,
      circle_color: '#1A1A1A',
      is_solid_red: false,
    }
  }

  const effectiveBudget = budget.count_income ? budget.amount + income : budget.amount
  const remaining = effectiveBudget - expenses
  const percentRemaining = effectiveBudget > 0 ? remaining / effectiveBudget : 0

  return {
    has_budget: true,
    show_carousel: false,
    display_number: Math.abs(remaining),
    is_negative: remaining < 0,
    circle_percent: Math.max(0, Math.min(1, percentRemaining)),
    circle_color: getCircleColor(percentRemaining),
    is_solid_red: remaining <= 0,
  }
}

export function getPeriodSummary(
  transactions: Transaction[],
  budget: Budget | null,
  referenceDate: Date,
): PeriodSummary {
  const period = getPeriodBounds(budget, referenceDate)
  const now = new Date()
  const periodTxns = transactions.filter(t => t.date >= period.start && t.date <= period.end)
  const expenses = periodTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const income = periodTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const totalMs = period.end.getTime() - period.start.getTime()
  const daysTotal = Math.round(totalMs / 86400000) + 1
  const elapsedMs = Math.min(now.getTime(), period.end.getTime()) - period.start.getTime()
  const daysElapsed = Math.max(0, Math.floor(elapsedMs / 86400000))

  // Burn rate (only if ≥7 days elapsed)
  let projectedSpend: number | null = null
  if (daysElapsed >= 7 && expenses > 0) {
    const dailyRate = expenses / daysElapsed
    projectedSpend = Math.round(dailyRate * daysTotal)
  }

  // Budget remaining
  let budgetRemaining: number | null = null
  let percentRemaining: number | null = null
  if (budget) {
    const effectiveBudget = budget.count_income ? budget.amount + income : budget.amount
    budgetRemaining = effectiveBudget - expenses
    percentRemaining = effectiveBudget > 0 ? budgetRemaining / effectiveBudget : 0
  }

  // Category breakdown
  const catMap = new Map<string, number>()
  for (const t of periodTxns.filter(t => t.type === 'expense')) {
    const cat = t.category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount)
  }
  const byCategory: CategorySummary[] = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      category: cat,
      total_spent: total,
      percent_of_total: expenses > 0 ? total / expenses : 0,
      color: CATEGORY_COLORS[cat] ?? '#B2BEC3',
    }))

  // Period label
  const monthName = period.start.toLocaleString('default', { month: 'long' })
  const year = period.start.getFullYear()
  const isCurrent = now >= period.start && now <= period.end
  const label = budget?.period === 'weekly'
    ? `${period.start.toLocaleString('default', { month: 'short' })} ${period.start.getDate()}–${period.end.getDate()}`
    : `${monthName} ${year}`

  return {
    period_start: period.start,
    period_end: period.end,
    label,
    is_current: isCurrent,
    total_spent: expenses,
    total_income: income,
    budget_amount: budget?.amount ?? null,
    budget_remaining: budgetRemaining,
    budget_percent_remaining: percentRemaining,
    days_elapsed: daysElapsed,
    days_total: daysTotal,
    projected_spend: projectedSpend,
    by_category: byCategory,
  }
}

// ─── Number formatting (Part 1) ───────────────────────────────────────────────
export function formatHeaderNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 100_000) return `$${Math.round(n / 1000)}K`
  if (n >= 10_000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface PendingDeletion {
  transaction: Transaction
  expiresAt: number
}

interface ExpenseContextType {
  transactions: Transaction[]
  budget: Budget | null
  setBudget: (b: Budget | null) => void
  balance: number
  isLoading: boolean
  isOffline: boolean
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  fetchTransactions: () => Promise<void>
  pendingDeletion: PendingDeletion | null
  undoDelete: () => void
  // Insights
  insights: Insight[]
  activeInsights: Insight[]
  dismissInsight: (id: string) => void
  checkRealtimeTriggers: (newTx: Transaction, allTxns: Transaction[]) => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextType | null>(null)

const SEED: Transaction[] = [
  {
    id: '1', name: 'Box subscription', amount: 50, type: 'expense', category: 'Fitness & Sports',
    frequency: 'monthly', date: new Date(Date.now() - 86400000), notes: '', emoji: '🥊', createdAt: new Date(),
  },
  {
    id: '2', name: 'Sam americano', amount: 50, type: 'expense', category: 'Coffee & Cafés',
    frequency: 'none', date: new Date(Date.now() - 86400000), notes: '', emoji: '🧋', createdAt: new Date(),
  },
  {
    id: '3', name: 'January salary', amount: 4000, type: 'income', category: 'Salary & Income',
    frequency: 'monthly', date: new Date(Date.now() - 86400000), notes: '', emoji: '💵', createdAt: new Date(),
  },
  {
    id: '4', name: 'Box subscription', amount: 50, type: 'expense', category: 'Fitness & Sports',
    frequency: 'monthly', date: new Date(), notes: '', emoji: '🥊', createdAt: new Date(),
  },
  {
    id: '5', name: 'Sam americano', amount: 50, type: 'expense', category: 'Coffee & Cafés',
    frequency: 'none', date: new Date(), notes: '', emoji: '🧋', createdAt: new Date(),
  },
  {
    id: '6', name: 'January salary', amount: 4000, type: 'income', category: 'Salary & Income',
    frequency: 'monthly', date: new Date(), notes: '', emoji: '💵', createdAt: new Date(),
  },
]

const UNDO_WINDOW_MS = 5000

export function MockExpenseProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(SEED)
  const [budget, setBudgetState] = useState<Budget | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null)
  const undoTimer = useRef<number | null>(null)

  const {
    insights,
    activeInsights,
    dismissInsight,
    checkRealtimeTriggers,
    resetBudgetThresholds,
  } = useInsights(transactions, budget)

  const balance = transactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0
  )

  const setBudget = useCallback((b: Budget | null) => {
    setBudgetState(b)
    resetBudgetThresholds()
  }, [resetBudgetThresholds])

  async function addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>) {
    const newT: Transaction = { ...t, id: String(Date.now()), createdAt: new Date() }
    setTransactions((prev) => {
      // Fire realtime triggers after state update (fire-and-forget)
      const updated = [newT, ...prev]
      setTimeout(() => { void checkRealtimeTriggers(newT, updated) }, 0)
      return updated
    })
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
    <ExpenseContext.Provider value={{
      transactions, budget, setBudget, balance,
      isLoading: false, isOffline: false,
      addTransaction, deleteTransaction, updateTransaction,
      fetchTransactions: async () => {},
      pendingDeletion, undoDelete,
      insights, activeInsights, dismissInsight, checkRealtimeTriggers,
    }}>
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpense(): ExpenseContextType {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpense must be used inside MockExpenseProvider')
  return ctx
}
