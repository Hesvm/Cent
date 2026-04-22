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
  category: Category | 'all'
  amount: number
  period: 'monthly' | 'weekly'
  alertThreshold: number
}

export type InputState =
  | 'idle'
  | 'typing'
  | 'parsing'
  | 'clarifying'
  | 'confirming'
  | 'saving'
  | 'done'
