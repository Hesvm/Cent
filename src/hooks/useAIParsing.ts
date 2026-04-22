import { useState, useCallback } from 'react'
import type { ParsedExpense, ClarificationStep, TransactionType, Category, Frequency } from '../types'

const RECURRING_KEYWORDS = ['rent', 'salary', 'subscription', 'membership', 'insurance', 'loan']

// ─── Local parser ───────────────────────────────────────────────────────────
// Runs synchronously before the API. If it can extract a name + amount with
// high confidence, the API call is skipped entirely.

const CATEGORY_KEYWORDS: [string[], Category][] = [
  [['coffee', 'latte', 'espresso', 'americano', 'cappuccino', 'matcha', 'starbucks', 'café', 'cafe', 'tea', 'lunch', 'dinner', 'breakfast', 'brunch', 'restaurant', 'pizza', 'burger', 'sushi', 'taco', 'ramen', 'sandwich', 'bar', 'beer', 'wine', 'cocktail', 'drink'], 'Dining'],
  [['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'train', 'bus', 'toll', 'transit', 'transport'], 'Transport'],
  [['gym', 'fitness', 'yoga', 'workout', 'crossfit', 'pilates', 'boxing', 'running', 'cycling', 'dumbbell', 'treadmill', 'membership'], 'Fitness'],
  [['grocery', 'groceries', 'supermarket', 'walmart', 'costco', 'trader', 'whole foods', 'safeway', 'kroger', 'market'], 'Groceries'],
  [['netflix', 'spotify', 'hulu', 'disney', 'apple', 'amazon prime', 'subscription', 'icloud'], 'Entertainment'],
  [['amazon', 'target', 'shopping', 'clothes', 'shoes', 'shirt', 'jacket', 'dress', 'sneakers', 'ikea', 'zara', 'h&m'], 'Shopping'],
  [['rent', 'mortgage', 'housing', 'landlord', 'utilities', 'electricity', 'water', 'internet', 'wifi', 'phone', 'insurance'], 'Housing'],
  [['doctor', 'dentist', 'pharmacy', 'prescription', 'hospital', 'clinic', 'health', 'vet', 'medical'], 'Health'],
  [['salary', 'paycheck', 'income', 'freelance', 'bonus', 'dividend', 'transfer', 'deposit', 'refund', 'cashback'], 'Income'],
]

const FREQUENCY_KEYWORDS: [string[], Frequency][] = [
  [['daily', 'every day', 'per day'], 'daily'],
  [['weekly', 'every week', 'per week'], 'weekly'],
  [['monthly', 'every month', 'per month', 'month'], 'monthly'],
  [['yearly', 'annual', 'annually', 'per year', 'every year'], 'yearly'],
]

function localParse(text: string, type: TransactionType): ParsedExpense {
  const lower = text.toLowerCase().trim()

  // Extract amount — find first number (handles $50, 50.00, 1,200, etc.)
  const amountMatch = lower.match(/\$?([\d,]+(?:\.\d{1,2})?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null

  // Remove the amount token to isolate the name portion
  const withoutAmount = lower.replace(/\$?[\d,]+(?:\.\d{1,2})?/, ' ').trim()

  // Strip filler words to get a clean name
  const fillerWords = /^(for|on|at|a|an|the|i|spent|paid|bought|got|had)\b/gi
  const rawName = withoutAmount.replace(fillerWords, '').trim()
    .replace(/\s+/g, ' ')

  // Detect frequency keywords
  let frequency: Frequency = 'none'
  let nameWithoutFreq = rawName
  for (const [kws, freq] of FREQUENCY_KEYWORDS) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        frequency = freq
        nameWithoutFreq = nameWithoutFreq.replace(new RegExp(kw, 'gi'), '').trim()
        break
      }
    }
    if (frequency !== 'none') break
  }

  // Also treat RECURRING_KEYWORDS as implicit monthly if no frequency stated
  if (frequency === 'none') {
    const isRecurring = RECURRING_KEYWORDS.some((k) => lower.includes(k))
    if (isRecurring) frequency = 'monthly'
  }

  // Detect category
  let category: Category | null = null
  for (const [kws, cat] of CATEGORY_KEYWORDS) {
    if (kws.some((kw) => lower.includes(kw))) {
      category = cat
      break
    }
  }
  // Income type override
  if (type === 'income' && !category) category = 'Income'

  // Capitalize name properly
  const name = nameWithoutFreq
    ? nameWithoutFreq.charAt(0).toUpperCase() + nameWithoutFreq.slice(1)
    : null

  // Confidence: high when both name and amount found
  const amountConf = amount !== null && amount > 0 ? 0.95 : 0
  const nameConf = name && name.length > 1 ? 0.9 : 0
  const catConf = category ? 0.85 : 0

  return {
    name: name || null,
    amount,
    type,
    category,
    frequency,
    tags: [],
    confidence: {
      name: nameConf,
      amount: amountConf,
      category: catConf,
      frequency: 0.9,
    },
  }
}

// Returns true when local parse is confident enough to skip the API
function isLocalConfident(p: ParsedExpense): boolean {
  return p.confidence.amount >= 0.9 && p.confidence.name >= 0.9
}

function buildClarificationQueue(parsed: ParsedExpense, _userSelectedType: TransactionType): ClarificationStep[] {
  const steps: ClarificationStep[] = []

  if (!parsed.amount || parsed.confidence.amount < 0.5) {
    steps.push({
      field: 'amount',
      question: parsed.name ? `How much was ${parsed.name}?` : 'How much was this?',
      options: null,
    })
  }

  // Skip name question if we already have a confident category — the category
  // itself is enough context; user can rename later from detail view.
  const categoryIsObvious = parsed.category && parsed.confidence.category >= 0.7
  if ((!parsed.name || parsed.confidence.name < 0.5) && !categoryIsObvious) {
    steps.push({
      field: 'name',
      question: parsed.amount ? `What was the $${parsed.amount} for?` : 'What was this for?',
      options: null,
    })
  }

  if (parsed.confidence.frequency < 0.8 && parsed.frequency !== 'none') {
    steps.push({
      field: 'frequency',
      question: 'Is this a frequent expense?',
      options: [
        { id: 1, label: 'Monthly', value: 'monthly' },
        { id: 2, label: 'Weekly', value: 'weekly' },
        { id: 3, label: 'No', value: 'none' },
      ],
    })
  }

  // Always confirm frequency for recurring keywords — auto-detection may be wrong
  const inputHasRecurring = [parsed.name, ...(parsed.tags ?? [])]
    .filter(Boolean)
    .some((s) => RECURRING_KEYWORDS.some((k) => s!.toLowerCase().includes(k)))
  const alreadyAskedFreq = steps.some((s) => s.field === 'frequency')
  if (inputHasRecurring && !alreadyAskedFreq) {
    steps.push({
      field: 'frequency',
      question: parsed.frequency !== 'none'
        ? `I'm guessing this is ${parsed.frequency} — correct?`
        : 'How often does this repeat?',
      options: [
        { id: 1, label: 'Monthly', value: 'monthly' },
        { id: 2, label: 'Weekly', value: 'weekly' },
        { id: 3, label: 'Yearly', value: 'yearly' },
        { id: 4, label: 'One-time', value: 'none' },
      ],
    })
  }

  if (!parsed.category || parsed.confidence.category < 0.6) {
    steps.push({
      field: 'category',
      question: 'What category is this?',
      options: [
        { id: 1, label: 'Dining', value: 'Dining' },
        { id: 2, label: 'Fitness', value: 'Fitness' },
        { id: 3, label: 'Groceries', value: 'Groceries' },
        { id: 4, label: 'Transport', value: 'Transport' },
        { id: 5, label: 'Shopping', value: 'Shopping' },
        { id: 6, label: 'Other', value: 'Other' },
      ],
    })
  }

  steps.push({ field: 'confirm', question: '', options: null })

  return steps
}

interface CollectedData {
  name: string | null
  amount: number | null
  type: TransactionType
  category: Category | null
  frequency: Frequency
  tags: string[]
}

interface UseAIParsingResult {
  isParsing: boolean
  parseError: string | null
  clarificationQueue: ClarificationStep[]
  currentStepIndex: number
  collectedData: CollectedData
  parse: (text: string, type: TransactionType) => Promise<void>
  answerStep: (value: string) => void
  reset: () => void
}

const DEFAULT_DATA: CollectedData = {
  name: null,
  amount: null,
  type: 'expense',
  category: null,
  frequency: 'none',
  tags: [],
}

export function useAIParsing(): UseAIParsingResult {
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [clarificationQueue, setClarificationQueue] = useState<ClarificationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [collectedData, setCollectedData] = useState<CollectedData>({ ...DEFAULT_DATA })

  const reset = useCallback(() => {
    setIsParsing(false)
    setParseError(null)
    setClarificationQueue([])
    setCurrentStepIndex(0)
    setCollectedData({ ...DEFAULT_DATA })
  }, [])

  const parse = useCallback(async (text: string, type: TransactionType) => {
    if (!text.trim()) return
    setIsParsing(true)
    setParseError(null)

    // Try local parser first — if confident, skip the API entirely
    const local = localParse(text, type)
    let parsed: ParsedExpense

    if (isLocalConfident(local)) {
      parsed = local
    } else {
      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, type }),
        })
        if (!res.ok) throw new Error('API error')
        parsed = await res.json() as ParsedExpense
      } catch {
        // API unavailable — use whatever local extracted
        parsed = local
      }
    }

    // Handle amount > 999999
    if (parsed.amount && parsed.amount > 999999) {
      parsed.confidence.amount = 0.1
    }

    // If category is obvious but no name, default name to category label
    let derivedName = parsed.name
    if (!derivedName && parsed.category && parsed.confidence.category >= 0.7) {
      derivedName = parsed.category
    }

    setCollectedData({
      name: derivedName,
      amount: parsed.amount,
      type: parsed.type ?? type,
      category: parsed.category,
      frequency: parsed.frequency ?? 'none',
      tags: parsed.tags,
    })

    const queue = buildClarificationQueue(parsed, type)
    setClarificationQueue(queue)
    setCurrentStepIndex(0)
    setIsParsing(false)
  }, [])

  const answerStep = useCallback((value: string) => {
    const step = clarificationQueue[currentStepIndex]
    if (!step) return

    setCollectedData((prev) => {
      const next = { ...prev }
      switch (step.field) {
        case 'name':
          next.name = value
          break
        case 'amount':
          next.amount = parseFloat(value.replace(/[^0-9.]/g, ''))
          break
        case 'frequency':
          next.frequency = value as Frequency
          break
        case 'category':
          next.category = value as Category
          break
        case 'type':
          next.type = value as TransactionType
          break
      }
      return next
    })

    setCurrentStepIndex((i) => i + 1)
  }, [clarificationQueue, currentStepIndex])

  return {
    isParsing,
    parseError,
    clarificationQueue,
    currentStepIndex,
    collectedData,
    parse,
    answerStep,
    reset,
  }
}
