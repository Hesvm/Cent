import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

export type RecurringTransaction = {
  id: string
  name: string
  amount: number
  type: 'expense' | 'income'
  category: string | null
  frequency: 'monthly' | 'weekly' | 'yearly' | 'daily'
  last_logged_at: string
  created_at: string
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

  const fetchRecurring = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: supaError } = await supabase
        .from('transactions')
        .select('id, name, amount, type, category, frequency, last_logged_at, created_at')
        .eq('user_id', user.id)
        .neq('frequency', 'none')
        .not('frequency', 'is', null)
        .order('amount', { ascending: false })

      if (supaError) throw supaError
      setTransactions((data ?? []) as RecurringTransaction[])
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
    await supabase
      .from('transactions')
      .update({ frequency })
      .eq('id', id)
      .eq('user_id', user.id)
    await fetchRecurring()
  }

  const deleteRecurring = async (id: string) => {
    if (!user?.id) return
    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    await fetchRecurring()
  }

  return { transactions, monthlyBurn, staleItems, isLoading, error, refetch: fetchRecurring, updateFrequency, deleteRecurring }
}
