import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import type { Transaction, Budget, Insight } from '../types'
import { useInsights } from '../hooks/useInsights'

// ─── Types ────────────────────────────────────────────────────────────────────
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
  insights: Insight[]
  activeInsights: Insight[]
  dismissInsight: (id: string) => void
  checkRealtimeTriggers: (newTx: Transaction, allTxns: Transaction[]) => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextType | null>(null)

const UNDO_WINDOW_MS = 5000

// ─── Row mappers ──────────────────────────────────────────────────────────────
function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    type: row.type as Transaction['type'],
    category: (row.category as string) ?? null,
    frequency: (row.frequency as Transaction['frequency']) ?? 'none',
    date: new Date(row.date as string),
    notes: (row.notes as string) ?? '',
    account: (row.account as string) ?? undefined,
    emoji: (row.emoji as string) ?? '💳',
    createdAt: new Date(row.created_at as string),
  }
}

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    amount: Number(row.amount),
    period: row.period as Budget['period'],
    period_start_day: Number(row.period_start_day),
    alert_threshold: Number(row.alert_threshold),
    alert_fired_at: row.alert_fired_at ? new Date(row.alert_fired_at as string) : null,
    notifications_enabled: Boolean(row.notifications_enabled),
    count_income: Boolean(row.count_income),
    rollover_enabled: Boolean(row.rollover_enabled),
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const userId = user?.id ?? null

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budget, setBudgetState] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null)
  const undoTimerRef = useRef<number | null>(null)
  const pendingDeleteRef = useRef<{ id: string; timer: number } | null>(null)

  const { insights, activeInsights, dismissInsight, checkRealtimeTriggers, resetBudgetThresholds } =
    useInsights(transactions, budget)

  // ── Online/offline tracking ──
  useEffect(() => {
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(500)
      if (error) throw error
      setTransactions((data ?? []).map(rowToTransaction))
    } catch {
      // offline or DB error — keep whatever is in state
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // ── Fetch budget ──
  const fetchBudget = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      setBudgetState(data ? rowToBudget(data as Record<string, unknown>) : null)
    } catch {
      // keep existing state
    }
  }, [userId])

  // ── Initial load + realtime subscription ──
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    fetchTransactions()
    fetchBudget()

    const channel = supabase
      .channel(`transactions-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => { fetchTransactions() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchTransactions, fetchBudget])

  // ── Set budget (optimistic + persist) ──
  const setBudget = useCallback((b: Budget | null) => {
    setBudgetState(b)
    resetBudgetThresholds()
    if (!userId) return

    if (b === null) {
      supabase.from('budgets').delete().eq('user_id', userId).then()
    } else {
      supabase.from('budgets').upsert(
        {
          user_id: userId,
          amount: b.amount,
          period: b.period,
          period_start_day: b.period_start_day,
          alert_threshold: b.alert_threshold,
          alert_fired_at: b.alert_fired_at?.toISOString() ?? null,
          notifications_enabled: b.notifications_enabled,
          count_income: b.count_income,
          rollover_enabled: b.rollover_enabled,
        },
        { onConflict: 'user_id' }
      ).then()
    }
  }, [userId, resetBudgetThresholds])

  // ── Add transaction ──
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!userId) return
    const optimistic: Transaction = { ...t, id: `opt-${Date.now()}`, createdAt: new Date() }

    setTransactions((prev) => {
      const updated = [optimistic, ...prev]
      setTimeout(() => { void checkRealtimeTriggers(optimistic, updated) }, 0)
      return updated
    })

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category ?? null,
        frequency: t.frequency,
        date: t.date.toISOString(),
        notes: t.notes ?? '',
        account: t.account ?? null,
        emoji: t.emoji,
      })
      .select()
      .single()

    if (error || !data) {
      setTransactions((prev) => prev.filter((x) => x.id !== optimistic.id))
      throw error
    }

    setTransactions((prev) =>
      prev.map((x) => x.id === optimistic.id ? rowToTransaction(data as Record<string, unknown>) : x)
    )
  }, [userId, checkRealtimeTriggers])

  // ── Delete transaction (with undo window) ──
  const deleteTransaction = useCallback(async (id: string) => {
    const target = transactions.find((t) => t.id === id)
    if (!target) return

    setTransactions((prev) => prev.filter((t) => t.id !== id))
    setPendingDeletion({ transaction: target, expiresAt: Date.now() + UNDO_WINDOW_MS })

    // Clear any previous timers
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    if (pendingDeleteRef.current) window.clearTimeout(pendingDeleteRef.current.timer)

    // After undo window: actually delete from Supabase
    const deleteTimer = window.setTimeout(async () => {
      setPendingDeletion(null)
      await supabase.from('transactions').delete().eq('id', id)
    }, UNDO_WINDOW_MS)

    pendingDeleteRef.current = { id, timer: deleteTimer }
    undoTimerRef.current = window.setTimeout(() => setPendingDeletion(null), UNDO_WINDOW_MS)
  }, [transactions])

  // ── Undo delete ──
  const undoDelete = useCallback(() => {
    if (!pendingDeletion) return
    const t = pendingDeletion.transaction
    setTransactions((prev) => [t, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()))
    setPendingDeletion(null)
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    if (pendingDeleteRef.current) {
      window.clearTimeout(pendingDeleteRef.current.timer)
      pendingDeleteRef.current = null
    }
  }, [pendingDeletion])

  // ── Update transaction ──
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t))

    const { error } = await supabase
      .from('transactions')
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.frequency !== undefined && { frequency: updates.frequency }),
        ...(updates.date !== undefined && { date: updates.date.toISOString() }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.emoji !== undefined && { emoji: updates.emoji }),
      })
      .eq('id', id)

    if (error) {
      await fetchTransactions()
      throw error
    }
  }, [fetchTransactions])

  const balance = transactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0
  )

  return (
    <ExpenseContext.Provider value={{
      transactions, budget, setBudget, balance,
      isLoading, isOffline,
      addTransaction, deleteTransaction, updateTransaction, fetchTransactions,
      pendingDeletion, undoDelete,
      insights, activeInsights, dismissInsight, checkRealtimeTriggers,
    }}>
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpense(): ExpenseContextType {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpense must be used inside ExpenseProvider')
  return ctx
}
