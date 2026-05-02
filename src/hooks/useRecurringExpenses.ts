import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import type { RecurringConfig } from '../types'
import { createRecurringConfig } from '../utils/recurring'

export type RecurringTransaction = {
  id: string
  name: string
  amount: number
  type: 'expense' | 'income'
  category: string | null
  frequency: 'monthly' | 'weekly' | 'yearly' | 'daily'
  last_logged_at: string
  created_at: string
  recurring: RecurringConfig
}

export type RecurringSummary = {
  transactions: RecurringTransaction[]
  monthlyBurn: number
  staleItems: RecurringTransaction[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFrequency: (id: string, frequency: string) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
}

function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':  return amount * 4.33
    case 'daily':   return amount * 30
    case 'yearly':  return amount / 12
    case 'monthly': return amount
    default:        return 0
  }
}

export function useRecurringExpenses(): RecurringSummary {
  const { user } = useUser()
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const parseRecurring = (value: unknown): RecurringConfig | null => {
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as RecurringConfig
      } catch {
        return null
      }
    }
    return value as RecurringConfig
  }

  const fetchRecurring = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: supaError } = await supabase
        .from('transactions')
        .select('id, name, amount, type, category, frequency, recurring, date, created_at, is_auto_generated')
        .eq('user_id', user.id)
        .neq('frequency', 'none')
        .order('amount', { ascending: false })

      if (supaError) throw supaError
      const recurringItems: RecurringTransaction[] = []
      for (const row of data ?? []) {
        if (row.is_auto_generated) continue
          const recurring = parseRecurring(row.recurring)
          if (!recurring) continue
          recurringItems.push({
            id: row.id as string,
            name: row.name as string,
            amount: Number(row.amount),
            type: row.type as 'expense' | 'income',
            category: (row.category as string) ?? null,
            frequency: row.frequency as RecurringTransaction['frequency'],
            last_logged_at: recurring.lastGeneratedAt,
            created_at: row.created_at as string,
            recurring,
          })
      }
      setTransactions(recurringItems)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring expenses')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  const monthlyBurn = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + toMonthlyAmount(t.amount, t.frequency), 0)

  const fortyFiveDaysAgo = new Date()
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)
  const staleItems = transactions.filter(
    t => t.type === 'expense' && new Date(t.last_logged_at) < fortyFiveDaysAgo
  )

  const updateFrequency = async (id: string, frequency: string) => {
    if (!user?.id) return
    const current = transactions.find((item) => item.id === id)
    if (!current) return
    const updates = frequency === 'none'
      ? { frequency, recurring: null }
      : {
          frequency,
          recurring: createRecurringConfig(
            frequency as RecurringTransaction['frequency'],
            new Date(current.created_at),
            { ...current.recurring, frequency: frequency as RecurringTransaction['frequency'] }
          ),
        }
    await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
    await fetchRecurring()
  }

  const deleteRecurring = async (id: string) => {
    if (!user?.id) return
    await supabase
      .from('transactions')
      .update({ frequency: 'none', recurring: null })
      .eq('id', id)
      .eq('user_id', user.id)
    await fetchRecurring()
  }

  return { transactions, monthlyBurn, staleItems, isLoading, error, refetch: fetchRecurring, updateFrequency, deleteRecurring }
}
