import { useState, useCallback, useEffect } from 'react'
import type { Transaction, Budget, Insight } from '../types'
import { getPeriodBounds } from '../context/MockExpenseContext'

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRIGGER_PRIORITY: Record<string, number> = {
  'RT-01': 1, 'RT-04': 1,
  'RT-02': 2, 'DD-02': 2, 'DD-07': 2,
  'RT-03': 3, 'DD-01': 3, 'DD-04': 3, 'DD-08': 3,
  'DD-03': 4, 'DD-05': 4,
  'DD-06': 5,
}

const LS_INSIGHTS = 'cent_insights'
const LS_DAILY_CHECK = 'cent_daily_check'
const LS_THRESHOLDS = 'cent_budget_thresholds'
const LS_THRESHOLD_PERIOD = 'cent_threshold_period'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function loadInsights(): Insight[] {
  try {
    const raw = localStorage.getItem(LS_INSIGHTS)
    if (!raw) return []
    return (JSON.parse(raw) as Insight[]).map(i => ({
      ...i,
      dismissed_at: i.dismissed_at ? new Date(i.dismissed_at) : null,
      generated_at: new Date(i.generated_at),
    }))
  } catch {
    return []
  }
}

function saveInsightsToLS(insights: Insight[]): void {
  try {
    localStorage.setItem(LS_INSIGHTS, JSON.stringify(insights))
  } catch { /* ignore */ }
}

function loadThresholds(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_THRESHOLDS)
    return new Set(raw ? (JSON.parse(raw) as number[]) : [])
  } catch {
    return new Set()
  }
}

function saveThresholds(t: Set<number>): void {
  try {
    localStorage.setItem(LS_THRESHOLDS, JSON.stringify([...t]))
  } catch { /* ignore */ }
}

// ─── Trigger helpers ──────────────────────────────────────────────────────────

interface TriggerResult {
  fired: boolean
  id?: string
  priority?: number
  data?: Record<string, unknown>
}

function periodExpenses(txns: Transaction[], start: Date, end: Date): Transaction[] {
  return txns.filter(t => t.type === 'expense' && t.date >= start && t.date <= end)
}

function avgTransactionAmount(txns: Transaction[]): number {
  const expenses = txns.filter(t => t.type === 'expense')
  if (expenses.length === 0) return 0
  return expenses.reduce((s, t) => s + t.amount, 0) / expenses.length
}

// ── Realtime Triggers ─────────────────────────────────────────────────────────

function checkRT01(
  allTxns: Transaction[],
  budget: Budget,
  crossedThresholds: Set<number>,
): TriggerResult & { newThreshold?: number } {
  const { start, end } = getPeriodBounds(budget)
  const expenses = periodExpenses(allTxns, start, end)
  const total = expenses.reduce((s, t) => s + t.amount, 0)
  const pct = budget.amount > 0 ? total / budget.amount : 0

  const thresholds = [50, 75, 90, 100]
  for (const t of thresholds) {
    if (pct * 100 >= t && !crossedThresholds.has(t)) {
      const remaining = Math.max(0, Math.round(budget.amount - total))
      const catMap = new Map<string, number>()
      for (const tx of expenses) {
        const cat = tx.category ?? 'Other'
        catMap.set(cat, (catMap.get(cat) ?? 0) + tx.amount)
      }
      const category_breakdown = Object.fromEntries(catMap)
      return {
        fired: true,
        id: 'RT-01',
        priority: 1,
        newThreshold: t,
        data: {
          percent_used: t,
          amount_spent: Math.round(total),
          budget: budget.amount,
          amount_remaining: remaining,
          category_breakdown,
        },
      }
    }
  }
  return { fired: false }
}

function checkRT02(newTx: Transaction, allTxns: Transaction[]): TriggerResult {
  if (newTx.type !== 'expense') return { fired: false }
  if (newTx.amount <= 50) return { fired: false }

  const avg = avgTransactionAmount(allTxns)
  if (avg === 0 || newTx.amount <= avg * 3) return { fired: false }

  return {
    fired: true,
    id: 'RT-02',
    priority: 2,
    data: {
      transaction_name: newTx.name,
      amount: newTx.amount,
      user_avg_transaction: Math.round(avg),
      category: newTx.category ?? 'Unknown',
    },
  }
}

function checkRT03(newTx: Transaction, allTxns: Transaction[]): TriggerResult {
  if (newTx.type !== 'expense' || !newTx.category) return { fired: false }

  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayInCategory = allTxns.filter(
    t => t.type === 'expense' && t.category === newTx.category
      && t.date >= today && t.date < tomorrow
  )

  if (todayInCategory.length < 3) return { fired: false }

  const total = todayInCategory.reduce((s, t) => s + t.amount, 0)
  return {
    fired: true,
    id: 'RT-03',
    priority: 3,
    data: {
      category: newTx.category,
      daily_count: todayInCategory.length,
      daily_total_in_category: Math.round(total),
      category_examples: todayInCategory.slice(0, 3).map(t => t.name),
    },
  }
}

function checkRT04(allTxns: Transaction[], budget: Budget): TriggerResult {
  const { start, end } = getPeriodBounds(budget)
  const expenses = periodExpenses(allTxns, start, end)
  const total = expenses.reduce((s, t) => s + t.amount, 0)
  const remaining = budget.amount - total

  if (remaining >= 0) return { fired: false }

  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))

  return {
    fired: true,
    id: 'RT-04',
    priority: 1,
    data: {
      amount_over: Math.abs(Math.round(remaining)),
      budget: budget.amount,
      total_spent: Math.round(total),
      days_left_in_period: daysLeft,
    },
  }
}

// ── Daily Triggers ────────────────────────────────────────────────────────────

function checkDD01(txns: Transaction[]): TriggerResult {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const sameDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  const daysElapsed = now.getDate()
  if (daysElapsed < 7) return { fired: false }

  // Last month must have full data (at least 20 days of transactions)
  const lastMonthTxns = periodExpenses(txns, lastMonthStart, lastMonthEnd)
  if (lastMonthTxns.length < 5) return { fired: false }

  const thisMonthSpend = periodExpenses(txns, thisMonthStart, now).reduce((s, t) => s + t.amount, 0)
  const lastMonthSamePtSpend = periodExpenses(txns, lastMonthStart, sameDayLastMonth).reduce((s, t) => s + t.amount, 0)

  if (lastMonthSamePtSpend === 0) return { fired: false }

  const percentChange = Math.round(((thisMonthSpend - lastMonthSamePtSpend) / lastMonthSamePtSpend) * 100)
  if (Math.abs(percentChange) < 20) return { fired: false }

  return {
    fired: true,
    id: 'DD-01',
    priority: 3,
    data: {
      current_pace: Math.round(thisMonthSpend),
      last_month_same_point: Math.round(lastMonthSamePtSpend),
      percent_change: percentChange,
    },
  }
}

function checkDD02(txns: Transaction[], budget: Budget): TriggerResult {
  const { start, end } = getPeriodBounds(budget)
  const now = new Date()
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = now.getTime() - start.getTime()
  const daysElapsed = Math.floor(elapsedMs / 86400000)
  const daysTotal = Math.ceil(totalMs / 86400000)

  if (daysElapsed < 7) return { fired: false }

  const currentSpend = periodExpenses(txns, start, now).reduce((s, t) => s + t.amount, 0)
  const dailyRate = currentSpend / daysElapsed
  const projected = Math.round(dailyRate * daysTotal)

  if (projected <= budget.amount * 1.15) return { fired: false }

  return {
    fired: true,
    id: 'DD-02',
    priority: 2,
    data: {
      projected_spend: projected,
      budget: budget.amount,
      current_pace: Math.round(currentSpend),
      days_elapsed: daysElapsed,
      days_remaining: daysTotal - daysElapsed,
    },
  }
}

function checkDD03(txns: Transaction[], budget: Budget): TriggerResult {
  const { start, end } = getPeriodBounds(budget)
  const now = new Date()
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = now.getTime() - start.getTime()
  const daysElapsed = Math.floor(elapsedMs / 86400000)
  const daysTotal = Math.ceil(totalMs / 86400000)
  const percentThrough = elapsedMs / totalMs

  if (percentThrough < 0.5 || daysElapsed < 7) return { fired: false }

  const currentSpend = periodExpenses(txns, start, now).reduce((s, t) => s + t.amount, 0)
  const dailyRate = currentSpend / daysElapsed
  const projected = Math.round(dailyRate * daysTotal)

  if (projected >= budget.amount * 0.85) return { fired: false }

  return {
    fired: true,
    id: 'DD-03',
    priority: 4,
    data: {
      projected_spend: projected,
      budget: budget.amount,
      surplus: Math.round(budget.amount - projected),
      percent_through_month: Math.round(percentThrough * 100),
    },
  }
}

function checkDD04(txns: Transaction[], budget: Budget | null): TriggerResult {
  const { start, end } = getPeriodBounds(budget)
  const expenses = periodExpenses(txns, start, end)
  const total = expenses.reduce((s, t) => s + t.amount, 0)
  if (total < 100) return { fired: false }

  const catMap = new Map<string, number>()
  for (const t of expenses) {
    const cat = t.category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount)
  }

  let topCat = ''
  let topAmt = 0
  for (const [cat, amt] of catMap) {
    if (amt > topAmt) { topCat = cat; topAmt = amt }
  }

  const pct = Math.round((topAmt / total) * 100)
  if (pct < 45) return { fired: false }

  return {
    fired: true,
    id: 'DD-04',
    priority: 3,
    data: {
      dominant_category: topCat,
      category_amount: Math.round(topAmt),
      category_percent: pct,
      total_spent: Math.round(total),
    },
  }
}

function checkDD05(txns: Transaction[], budget: Budget): TriggerResult {
  const { start } = getPeriodBounds(budget)
  const now = new Date()
  const daysElapsed = Math.floor((now.getTime() - start.getTime()) / 86400000)
  if (daysElapsed < 5) return { fired: false }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyBudgetAvg = budget.amount / daysInMonth

  // Check consecutive days under daily avg
  let streak = 0
  let totalSaved = 0
  for (let i = 0; i < daysElapsed; i++) {
    const dayStart = new Date(now)
    dayStart.setDate(now.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const daySpend = periodExpenses(txns, dayStart, dayEnd).reduce((s, t) => s + t.amount, 0)
    if (daySpend < dailyBudgetAvg) {
      streak++
      totalSaved += dailyBudgetAvg - daySpend
    } else {
      break
    }
  }

  if (streak < 5) return { fired: false }
  // Fire at streak = 5, 10, 15, ...
  if (streak % 5 !== 0) return { fired: false }

  return {
    fired: true,
    id: 'DD-05',
    priority: 4,
    data: {
      streak_days: streak,
      daily_avg_budget: Math.round(dailyBudgetAvg),
      actual_daily_avg: Math.round((budget.amount - totalSaved) / Math.max(streak, 1)),
      total_saved_vs_avg: Math.round(totalSaved),
    },
  }
}

function checkDD06(txns: Transaction[]): TriggerResult {
  const thirtyDaysAgo = daysAgo(30)
  const recentTxns = txns.filter(t => t.date >= thirtyDaysAgo)
  if (recentTxns.length < 5) return { fired: false }

  const sorted = [...txns].sort((a, b) => b.date.getTime() - a.date.getTime())
  const last = sorted[0]
  if (!last) return { fired: false }

  const daysSince = Math.floor((Date.now() - last.date.getTime()) / 86400000)
  if (daysSince < 3) return { fired: false }

  return {
    fired: true,
    id: 'DD-06',
    priority: 5,
    data: {
      days_since_last_log: daysSince,
      last_transaction_name: last.name,
      last_transaction_date: last.date.toISOString().slice(0, 10),
    },
  }
}

function checkDD07(txns: Transaction[], budget: Budget | null): TriggerResult {
  const { start, end } = getPeriodBounds(budget)
  const now = new Date()
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000)

  // Fire on last day or first day of period
  if (daysLeft > 1 && now.getTime() > start.getTime() + 86400000) return { fired: false }

  const expenses = periodExpenses(txns, start, end)
  const total = expenses.reduce((s, t) => s + t.amount, 0)
  if (total === 0) return { fired: false }

  const catMap = new Map<string, number>()
  for (const t of expenses) {
    const cat = t.category ?? 'Other'
    catMap.set(cat, (catMap.get(cat) ?? 0) + t.amount)
  }
  let topCat = ''
  let topAmt = 0
  for (const [cat, amt] of catMap) {
    if (amt > topAmt) { topCat = cat; topAmt = amt }
  }

  const overOrUnder = budget ? Math.round(budget.amount - total) : null

  return {
    fired: true,
    id: 'DD-07',
    priority: 2,
    data: {
      month_name: start.toLocaleString('default', { month: 'long' }),
      total_spent: Math.round(total),
      budget: budget?.amount ?? null,
      over_or_under: overOrUnder,
      top_category: topCat,
      top_category_amount: Math.round(topAmt),
      num_transactions: expenses.length,
      days_total: daysTotal,
    },
  }
}

function checkDD08(txns: Transaction[], budget: Budget): TriggerResult {
  const { start } = getPeriodBounds(budget)
  const now = new Date()
  const daysElapsed = Math.floor((now.getTime() - start.getTime()) / 86400000)
  if (daysElapsed !== 7) return { fired: false }

  const week1End = new Date(start)
  week1End.setDate(week1End.getDate() + 7)

  const week1Txns = periodExpenses(txns, start, week1End)
  if (week1Txns.length < 3) return { fired: false }

  const week1Spent = Math.round(week1Txns.reduce((s, t) => s + t.amount, 0))
  const weeklyBudgetTarget = Math.round(budget.amount / 4)
  const pct = Math.round((week1Spent / budget.amount) * 100)

  return {
    fired: true,
    id: 'DD-08',
    priority: 3,
    data: {
      week1_spent: week1Spent,
      weekly_budget_target: weeklyBudgetTarget,
      percent_of_budget_used: pct,
    },
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function generateInsight(triggerId: string, data: Record<string, unknown>): Promise<{ message: string; emoji: string }> {
  try {
    const res = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_id: triggerId, data }),
    })
    if (!res.ok) throw new Error('API error')
    return await res.json() as { message: string; emoji: string }
  } catch {
    return { message: 'Something noteworthy about your spending.', emoji: '💡' }
  }
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useInsights(transactions: Transaction[], budget: Budget | null) {
  const [insights, setInsights] = useState<Insight[]>(() => loadInsights())

  // Sync state → localStorage whenever it changes
  useEffect(() => {
    saveInsightsToLS(insights)
  }, [insights])

  const activeInsights = insights
    .filter(i => i.dismissed_at === null)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)

  function hasShownToday(triggerId: string): boolean {
    const today = todayStr()
    return insights.some(i => i.trigger_id === triggerId && i.shown_date === today)
  }

  function addInsight(insight: Insight) {
    setInsights(prev => {
      const active = prev.filter(i => i.dismissed_at === null)
      let next = prev

      if (active.length >= 3) {
        if (insight.priority > 1) return prev // stack full, not priority 1
        // Replace lowest priority card
        const lowest = [...active].sort((a, b) => b.priority - a.priority)[0]
        if (lowest && lowest.priority > insight.priority) {
          next = prev.map(i =>
            i.id === lowest.id ? { ...i, dismissed_at: new Date() } : i
          )
        } else {
          return prev
        }
      }

      return [...next, insight]
    })
  }

  async function processTriggered(result: TriggerResult) {
    if (!result.fired || !result.id || !result.priority || !result.data) return
    if (hasShownToday(result.id)) return

    const { message, emoji } = await generateInsight(result.id, result.data)

    const insight: Insight = {
      id: `${result.id}-${Date.now()}`,
      trigger_id: result.id,
      message,
      emoji,
      priority: result.priority,
      shown_date: todayStr(),
      dismissed_at: null,
      generated_at: new Date(),
      trigger_data: result.data,
    }

    addInsight(insight)
  }

  // ── Public: dismiss ────────────────────────────────────────────────────────

  const dismissInsight = useCallback((id: string) => {
    setInsights(prev =>
      prev.map(i => (i.id === id ? { ...i, dismissed_at: new Date() } : i))
    )
  }, [])

  // ── Public: realtime triggers ──────────────────────────────────────────────

  const checkRealtimeTriggers = useCallback(async (
    newTx: Transaction,
    allTxns: Transaction[],
  ) => {
    // Need at least 5 total transactions to show insights
    if (allTxns.length < 5) return

    // Check in priority order (highest first)
    const triggers: TriggerResult[] = []

    if (budget) {
      // RT-04: overspent
      const rt04 = checkRT04(allTxns, budget)
      if (rt04.fired && !hasShownToday('RT-04')) triggers.push(rt04)

      // RT-01: threshold crossed
      const currentPeriodKey = getPeriodBounds(budget).start.toISOString().slice(0, 10)
      const storedPeriod = localStorage.getItem(LS_THRESHOLD_PERIOD)
      let thresholds = loadThresholds()

      if (storedPeriod !== currentPeriodKey) {
        // New period — reset thresholds
        thresholds = new Set()
        localStorage.setItem(LS_THRESHOLD_PERIOD, currentPeriodKey)
        saveThresholds(thresholds)
      }

      const rt01 = checkRT01(allTxns, budget, thresholds) as TriggerResult & { newThreshold?: number }
      if (rt01.fired && rt01.newThreshold) {
        thresholds.add(rt01.newThreshold)
        saveThresholds(thresholds)
        if (!hasShownToday('RT-01')) triggers.push(rt01)
      }
    }

    // RT-02: large transaction
    const rt02 = checkRT02(newTx, allTxns)
    if (rt02.fired && !hasShownToday('RT-02')) triggers.push(rt02)

    // RT-03: category spike
    const rt03 = checkRT03(newTx, allTxns)
    if (rt03.fired && !hasShownToday(`RT-03-${newTx.category}`)) triggers.push(rt03)

    for (const trigger of triggers) {
      await processTriggered(trigger)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, insights])

  // ── Public: daily triggers ─────────────────────────────────────────────────

  const checkDailyTriggers = useCallback(async () => {
    const today = todayStr()
    const lastCheck = localStorage.getItem(LS_DAILY_CHECK)
    if (lastCheck === today) return // already ran today

    localStorage.setItem(LS_DAILY_CHECK, today)

    // Need at least 5 total transactions
    if (transactions.length < 5) return

    const active = insights.filter(i => i.dismissed_at === null)
    if (active.length >= 3) return // stack full, skip daily digest

    const triggers = [
      budget ? checkDD04(transactions, budget) : checkDD04(transactions, null),
      ...(budget ? [checkDD02(transactions, budget)] : []),
      checkDD07(transactions, budget),
      ...(budget ? [checkDD08(transactions, budget)] : []),
      checkDD01(transactions),
      ...(budget ? [checkDD05(transactions, budget)] : []),
      ...(budget ? [checkDD03(transactions, budget)] : []),
      checkDD06(transactions),
    ]

    for (const trigger of triggers) {
      const current = insights.filter(i => i.dismissed_at === null)
      if (current.length >= 3) break
      await processTriggered(trigger)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, budget, insights])

  // ── Run daily triggers on mount ────────────────────────────────────────────

  useEffect(() => {
    // Small delay so transactions are loaded first
    const timer = setTimeout(() => { checkDailyTriggers() }, 1500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only on mount

  // ── Reset thresholds when budget changes ───────────────────────────────────

  const resetBudgetThresholds = useCallback(() => {
    saveThresholds(new Set())
    localStorage.removeItem(LS_THRESHOLD_PERIOD)
  }, [])

  return {
    insights,
    activeInsights,
    dismissInsight,
    checkRealtimeTriggers,
    checkDailyTriggers,
    resetBudgetThresholds,
  }
}
