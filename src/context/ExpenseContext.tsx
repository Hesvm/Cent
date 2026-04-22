import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import type { Transaction, Budget, Category } from '../types'
import { getEmoji } from '../utils/categories'

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
}

const ExpenseContext = createContext<ExpenseContextType | null>(null)

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    type: row.type as Transaction['type'],
    category: row.category as Category,
    tags: (row.tags as Transaction['tags']) ?? [],
    frequency: (row.frequency as Transaction['frequency']) ?? 'none',
    date: new Date(row.date as string),
    notes: (row.notes as string) ?? '',
    account: row.account as string | undefined,
    emoji: (row.emoji as string) || getEmoji(row.category as Category),
    createdAt: new Date(row.created_at as string),
  }
}

function calcBalance(txns: Transaction[]): number {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return txns
    .filter((t) => t.date >= startOfMonth)
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

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

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100)
      if (error) throw error
      setTransactions((data ?? []).map(rowToTransaction))
    } catch {
      // offline or error — keep cached state
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchTransactions()

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => { fetchTransactions() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchTransactions])

  const addTransaction = useCallback(
    async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      if (!user) return
      const optimistic: Transaction = {
        ...t,
        id: `optimistic-${Date.now()}`,
        createdAt: new Date(),
      }
      setTransactions((prev) => [optimistic, ...prev])

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: t.name,
          amount: t.amount,
          type: t.type,
          category: t.category,
          tags: t.tags,
          frequency: t.frequency,
          date: t.date.toISOString(),
          notes: t.notes,
          account: t.account,
          emoji: t.emoji,
        })
        .select()
        .single()

      if (error || !data) {
        setTransactions((prev) => prev.filter((x) => x.id !== optimistic.id))
        throw error
      }
      setTransactions((prev) =>
        prev.map((x) => (x.id === optimistic.id ? rowToTransaction(data as Record<string, unknown>) : x))
      )
    },
    [user]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      const backup = transactions.find((t) => t.id === id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) {
        if (backup) setTransactions((prev) => [backup, ...prev])
        throw error
      }
    },
    [transactions]
  )

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
      const { error } = await supabase
        .from('transactions')
        .update({
          name: updates.name,
          amount: updates.amount,
          type: updates.type,
          category: updates.category,
          tags: updates.tags,
          frequency: updates.frequency,
          date: updates.date?.toISOString(),
          notes: updates.notes,
          account: updates.account,
          emoji: updates.emoji,
        })
        .eq('id', id)
      if (error) {
        await fetchTransactions()
        throw error
      }
    },
    [fetchTransactions]
  )

  const balance = calcBalance(transactions)

  return (
    <ExpenseContext.Provider
      value={{ transactions, budgets, balance, isLoading, isOffline, addTransaction, deleteTransaction, updateTransaction, fetchTransactions }}
    >
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpense(): ExpenseContextType {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error('useExpense must be used inside ExpenseProvider')
  return ctx
}
