export type TransactionType = 'expense' | 'income'

export type Frequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Category =
  | 'Dining'
  | 'Fitness'
  | 'Groceries'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Housing'
  | 'Utilities'
  | 'Income'
  | 'Other'

export interface Tag {
  label: string
  type: 'category' | 'frequency' | 'custom'
}

export interface Transaction {
  id: string
  name: string
  amount: number
  type: TransactionType
  category: Category
  tags: Tag[]
  frequency: Frequency
  date: Date
  notes: string
  account?: string
  emoji: string
  createdAt: Date
}

export interface ParsedExpense {
  name: string | null
  amount: number | null
  type: TransactionType | null
  category: Category | null
  frequency: Frequency | null
  tags: string[]
  confidence: {
    name: number
    amount: number
    category: number
    frequency: number
  }
}

export interface ClarificationStep {
  field: 'name' | 'amount' | 'category' | 'frequency' | 'type' | 'confirm'
  question: string
  options?: ClarificationOption[] | null
}

export interface ClarificationOption {
  id: string | number
  label: string
  value: string
}

export interface Budget {
  id: string
  amount: number
  period: 'monthly' | 'weekly' | 'custom'
  period_start_day: number       // 1–28
  alert_threshold: number        // 0–1, default 0.75
  alert_fired_at: Date | null
  notifications_enabled: boolean
  count_income: boolean          // default false
  rollover_enabled: boolean      // default false
  created_at: Date
  updated_at: Date
}

export interface CategorySummary {
  category: Category
  total_spent: number
  percent_of_total: number
  color: string
}

export interface PeriodSummary {
  period_start: Date
  period_end: Date
  label: string
  is_current: boolean
  total_spent: number
  total_income: number
  budget_amount: number | null
  budget_remaining: number | null
  budget_percent_remaining: number | null
  days_elapsed: number
  days_total: number
  projected_spend: number | null
  by_category: CategorySummary[]
}

export interface HeaderState {
  has_budget: boolean
  show_carousel: boolean
  display_number: number
  is_negative: boolean
  circle_percent: number
  circle_color: string
  is_solid_red: boolean
}

export type InputState =
  | 'idle'
  | 'typing'
  | 'parsing'
  | 'clarifying'
  | 'confirming'
  | 'saving'
  | 'done'
