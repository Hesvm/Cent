import { useState, useCallback, useRef } from 'react'
import type { ParsedExpense, ClarificationStep, TransactionType, Frequency } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

// Per spec §4C / §11 implementation notes
const RECURRING_KEYWORDS = [
  'rent', 'salary', 'subscription', 'membership', 'insurance',
  'loan', 'mortgage', 'lease', 'stipend', 'allowance', 'retainer',
  'tuition', 'bill', 'installment',
]

// Maps keyword arrays → new 50-category names
const CATEGORY_KEYWORDS: [string[], string][] = [
  [['coffee', 'latte', 'espresso', 'americano', 'cappuccino', 'matcha', 'starbucks', 'café', 'cafe', 'boba', 'tea shop'], 'Coffee & Cafes'],
  [['restaurant', 'diner', 'lunch', 'dinner', 'breakfast', 'brunch', 'sushi', 'ramen', 'taco', 'noodle', 'bistro', 'eatery'], 'Restaurants'],
  [['mcdonald', 'kfc', 'burger king', 'fast food', 'street food', 'quick bite', 'burger', 'fries', 'pizza', 'sandwich', 'wrap', 'hot dog'], 'Fast Food'],
  [['bakery', 'cake', 'pastry', 'dessert', 'ice cream', 'donut', 'cookie', 'sweets'], 'Bakery & Sweets'],
  [['uber eats', 'doordash', 'glovo', 'delivery', 'food delivery', 'grubhub', 'postmates'], 'Delivery'],
  [['bar', 'nightclub', 'club', 'beer', 'wine', 'cocktail', 'drink', 'whiskey', 'vodka', 'alcohol', 'pub'], 'Bars & Nightlife'],
  [['team lunch', 'client dinner', 'office lunch', 'work meal', 'business dinner', 'team dinner'], 'Work Meals'],
  [['grocery', 'groceries', 'supermarket', 'walmart', 'costco', 'trader joe', 'whole foods', 'safeway', 'kroger', 'aldi', 'market', 'produce', 'fresh market'], 'Groceries'],
  [['uber', 'lyft', 'bolt', 'taxi', 'cab', 'ride'], 'Ride-hailing'],
  [['gas', 'fuel', 'petrol', 'bp', 'shell', 'chevron', 'exxon'], 'Fuel'],
  [['parking', 'parkimeter', 'parkwhiz', 'park meter'], 'Parking'],
  [['metro', 'subway', 'bus ticket', 'train ticket', 'transit', 'tram', 'commuter rail'], 'Public Transit'],
  [['flight', 'airfare', 'airline', 'plane ticket', 'airport', 'ryanair', 'easyjet'], 'Flights'],
  [['car service', 'car repair', 'oil change', 'car wash', 'tire', 'mechanic', 'auto'], 'Car Maintenance'],
  [['clothes', 'clothing', 'shirt', 'jacket', 'dress', 'pants', 'jeans', 'sneakers', 'shoes', 'accessories', 'zara', 'h&m', 'gap', 'uniqlo'], 'Clothing'],
  [['laptop', 'phone', 'tablet', 'gadget', 'headphones', 'electronics', 'cable', 'charger', 'ipad', 'iphone', 'airpods', 'camera', 'monitor'], 'Electronics'],
  [['ikea', 'furniture', 'sofa', 'chair', 'table', 'desk', 'home decor', 'appliance', 'decor', 'rug'], 'Home & Furniture'],
  [['book', 'notebook', 'stationery', 'pen', 'pencil', 'art supply', 'kindle', 'textbook'], 'Books & Stationery'],
  [['gift', 'present', 'wrapping', 'birthday gift', 'christmas gift'], 'Gifts'],
  [['amazon', 'ebay', 'etsy', 'aliexpress', 'online shopping', 'e-commerce', 'shop online'], 'Online Shopping'],
  [['haircut', 'salon', 'cosmetic', 'skincare', 'makeup', 'grooming', 'beauty', 'spa treatment', 'nail'], 'Beauty & Personal'],
  [['gym', 'fitness', 'yoga', 'workout', 'crossfit', 'pilates', 'boxing', 'cycling', 'dumbbell', 'treadmill', 'peloton', 'swim', 'sport', 'running shoes', 'athletic'], 'Gym & Sports'],
  [['doctor', 'hospital', 'clinic', 'lab test', 'dentist', 'surgery', 'ER', 'urgent care'], 'Medical'],
  [['pharmacy', 'medicine', 'prescription', 'vitamins', 'supplements', 'walgreens', 'cvs', 'boots'], 'Pharmacy'],
  [['therapy', 'counseling', 'therapist', 'psychiatrist', 'mental health', 'headspace', 'calm app'], 'Mental Health'],
  [['spa', 'massage', 'sauna', 'wellness', 'meditation', 'retreat', 'bath house'], 'Wellness'],
  [['rent', 'mortgage', 'landlord', 'monthly rent', 'lease payment'], 'Rent'],
  [['electricity', 'electric bill', 'water bill', 'gas bill', 'internet bill', 'phone bill', 'utilities', 'utility', 'wifi', 'broadband'], 'Utilities'],
  [['cleaning', 'plumber', 'electrician', 'handyman', 'repair', 'home repair', 'maintenance', 'housekeeper'], 'Home Services'],
  [['vet', 'pet food', 'pet grooming', 'pet supplies', 'dog', 'cat food', 'pet store'], 'Pets'],
  [['daycare', 'babysitter', 'school fee', 'kindergarten', 'childcare', 'baby supplies', 'nanny'], 'Childcare'],
  [['insurance', 'health insurance', 'car insurance', 'home insurance', 'life insurance', 'premium'], 'Insurance'],
  [['netflix', 'spotify', 'hulu', 'disney+', 'apple tv', 'youtube premium', 'amazon prime', 'icloud', 'streaming'], 'Streaming'],
  [['game', 'playstation', 'xbox', 'steam', 'in-app purchase', 'gaming', 'nintendo', 'video game'], 'Gaming'],
  [['concert', 'cinema', 'movie ticket', 'theater', 'festival', 'sports event', 'show ticket', 'event ticket'], 'Events & Tickets'],
  [['hobby', 'craft', 'photography', 'instrument', 'guitar', 'painting', 'knitting', 'art class'], 'Hobbies'],
  [['hotel', 'airbnb', 'hostel', 'vacation', 'holiday', 'resort', 'accommodation', 'motel'], 'Travel & Hotels'],
  [['hiking', 'camping', 'outdoor', 'climbing', 'ski', 'surfing', 'cycling gear', 'sports equipment'], 'Sports & Outdoors'],
  [['saas', 'software subscription', 'notion', 'slack', 'figma', 'github', 'adobe', 'microsoft', 'dropbox', 'zoom'], 'Software & Tools'],
  [['office supplies', 'printer ink', 'stationery office', 'desk accessory', 'staples office'], 'Office Supplies'],
  [['client meeting', 'business expense', 'freelance cost', 'coworking', 'wework'], 'Freelance Expense'],
  [['course', 'udemy', 'coursera', 'workshop', 'tuition', 'school', 'class', 'training', 'certification'], 'Education'],
  [['tax', 'government fee', 'bank fee', 'accountant', 'legal fee', 'fine'], 'Taxes & Fees'],
  [['stock', 'crypto', 'bitcoin', 'investment', 'brokerage', 'savings transfer', 'etf', 'robinhood'], 'Investments'],
  [['loan payment', 'installment', 'credit card payment', 'debt payment', 'mortgage payment'], 'Loan Payments'],
  [['salary', 'paycheck', 'wages', 'employment income'], 'Salary'],
  [['freelance payment', 'client payment', 'project payment', 'invoice paid', 'consulting fee'], 'Freelance Income'],
  [['refund', 'cashback', 'reimbursement', 'money back', 'returned', 'got back'], 'Refund'],
  [['gift received', 'birthday money', 'money from', 'received gift'], 'Gift Received'],
  [['dividend', 'rental income', 'interest', 'bonus', 'commission', 'deposit received', 'got paid', 'earned'], 'Other Income'],
]

const FREQUENCY_KEYWORDS: [string[], Frequency][] = [
  [['daily', 'every day', 'each day', 'per day'], 'daily'],
  [['weekly', 'every week', 'each week', 'per week'], 'weekly'],
  [['monthly', 'every month', 'each month', 'per month'], 'monthly'],
  [['yearly', 'annual', 'annually', 'per year', 'every year'], 'yearly'],
]

// Words that signal this is a question/command, not an expense (§2E)
const QUESTION_PATTERNS = [
  /^(how|what|where|when|why|who)\b/i,
  /^(show|tell|help|give|list|find|get|can you|could you|please show)\b/i,
  /^(what'?s|how much|how many)\b/i,
  /\?$/,
]

// Income signal words (§3B)
const INCOME_KEYWORDS = [
  'salary', 'income', 'received', 'got paid', 'payment from', 'freelance',
  'refund', 'cashback', 'reimbursed', 'earned', 'bonus', 'dividend',
  'returned', 'got back', 'money back', 'deposit',
]

// Refund signal words (§10A)
const REFUND_KEYWORDS = ['refund', 'return', 'got back', 'money back', 'reimbursed', 'returned shoes', 'returned item']

// Large amount threshold (§1E)
const LARGE_AMOUNT_THRESHOLD = 10000

// ─── Word-number parsing (§9A) ────────────────────────────────────────────────

const WORD_NUM_PATTERNS: [RegExp, number][] = [
  [/\ba?\s*grand\b/i, 1000],
  [/\ba?\s*thousand\b/i, 1000],
  [/\bcouple\s*(hundred|hundo)\b/i, 200],
  [/\ba?\s*hundred\b/i, 100],
  [/\bninety\b/i, 90], [/\beighty\b/i, 80], [/\bseventy\b/i, 70],
  [/\bsixty\b/i, 60], [/\bfifty\b/i, 50], [/\bforty\b/i, 40],
  [/\bthirty\b/i, 30], [/\btwenty\b/i, 20],
  [/\bnineteen\b/i, 19], [/\beighteen\b/i, 18], [/\bseventeen\b/i, 17],
  [/\bsixteen\b/i, 16], [/\bfifteen\b/i, 15], [/\bfourteen\b/i, 14],
  [/\bthirteen\b/i, 13], [/\btwelve\b/i, 12], [/\beleven\b/i, 11],
  [/\bten\b/i, 10], [/\bnine\b/i, 9], [/\beight\b/i, 8],
  [/\bseven\b/i, 7], [/\bsix\b/i, 6], [/\bfive\b/i, 5],
  [/\bfour\b/i, 4], [/\bthree\b/i, 3], [/\btwo\b/i, 2], [/\bone\b/i, 1],
]

function parseWordNumber(text: string): { value: number; confidence: number } | null {
  const lower = text.toLowerCase()

  // "a few" / "some" → too vague
  if (/\ba few\b|\bsome\b|\bseveral\b/.test(lower)) return { value: 0, confidence: 0.15 }

  // "forty-nine ninety-nine" style
  const compoundDecimal = lower.match(/\b(forty|fifty|sixty|seventy|eighty|ninety)?[-\s]?(one|two|three|four|five|six|seven|eight|nine)?\s+(ninety|eighty|seventy|sixty|fifty|forty|thirty|twenty)?[-\s]?(one|two|three|four|five|six|seven|eight|nine)\b/)
  if (compoundDecimal) {
    // too complex, low confidence
    return { value: 0, confidence: 0.3 }
  }

  for (const [pattern, value] of WORD_NUM_PATTERNS) {
    if (pattern.test(lower)) {
      // "couple hundred" is medium confidence; specific numbers are high
      const confidence = value === 200 && lower.includes('couple') ? 0.6 : 0.75
      return { value, confidence }
    }
  }
  return null
}

// ─── Local parser ─────────────────────────────────────────────────────────────

function inferCategory(text: string): { category: string | null; confidence: number } {
  const lower = text.toLowerCase()
  for (const [kws, cat] of CATEGORY_KEYWORDS) {
    if (kws.some((kw) => lower.includes(kw))) {
      return { category: cat, confidence: 0.85 }
    }
  }
  return { category: null, confidence: 0 }
}

function localParse(text: string, type: TransactionType): ParsedExpense & { hasRecurringSignal: boolean; isNegative: boolean; rawText: string } {
  const lower = text.toLowerCase().trim()

  // ── Negative / refund amount (§1D, §10A) ─────────────────────────────────
  const isNegative = /minus\s*\d|-\s*\$?\d|\$?-\s*\d|negative\s+\d/.test(lower)
  const isRefund = REFUND_KEYWORDS.some((k) => lower.includes(k))
  const detectedType: TransactionType =
    isNegative || isRefund || INCOME_KEYWORDS.some((k) => lower.includes(k)) ? 'income' : type

  // ── Amount extraction ──────────────────────────────────────────────────────
  // Strip leading minus for parsing
  const textForAmount = lower.replace(/^-\s*/, '').replace(/minus\s+/, '')

  // Try numeric amount first
  const numericMatch = textForAmount.match(/\$?([\d,]+(?:\.\d{1,2})?)/)
  let amount: number | null = null
  let amountConf = 0

  if (numericMatch) {
    amount = parseFloat(numericMatch[1].replace(/,/g, ''))
    amountConf = amount > 0 ? 0.95 : 0.1 // zero → low confidence (maybe "free")
  } else {
    // Try word numbers
    const wordNum = parseWordNumber(textForAmount)
    if (wordNum && wordNum.value > 0) {
      amount = wordNum.value
      amountConf = wordNum.confidence
    }
  }

  // ── Frequency extraction ───────────────────────────────────────────────────
  // ONLY mark high-confidence when frequency is EXPLICITLY stated (§4B)
  let frequency: Frequency = 'none'
  let freqConf = 0.99 // "none" with high confidence by default
  let nameWithoutFreq = lower

  for (const [kws, freq] of FREQUENCY_KEYWORDS) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        frequency = freq
        freqConf = 0.95
        nameWithoutFreq = nameWithoutFreq.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '').trim()
        break
      }
    }
    if (frequency !== 'none') break
  }

  // Check for recurring SIGNAL (§4C) — but do NOT auto-assign frequency
  const hasRecurringSignal = frequency === 'none' &&
    RECURRING_KEYWORDS.some((k) => lower.includes(k))

  // ── Name extraction ────────────────────────────────────────────────────────
  let withoutAmount = nameWithoutFreq
    .replace(/\$?([\d,]+(?:\.\d{1,2})?)/, ' ')
    .replace(/\b(minus|negative|plus)\b/gi, '')
    .trim()

  const fillerWords = /\b(for|on|at|a|an|the|i|spent|paid|bought|got|had|used|from|my|some)\b/gi
  const rawName = withoutAmount.replace(fillerWords, ' ').replace(/\s+/g, ' ').trim()

  const name = rawName && rawName.length > 1
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : null
  const nameConf = name && name.length > 1 ? 0.85 : 0

  // ── Category inference ─────────────────────────────────────────────────────
  const { category, confidence: catConf } = inferCategory(lower)
  const finalCategory = type === 'income' && !category ? 'Other Income' : category

  return {
    name,
    amount,
    type: detectedType,
    category: finalCategory,
    frequency,
    tags: [],
    confidence: {
      name: nameConf,
      amount: amountConf,
      category: catConf,
      frequency: freqConf,
    },
    hasRecurringSignal,
    isNegative,
    rawText: text,
  }
}

function isLocalConfident(p: ParsedExpense): boolean {
  return p.confidence.amount >= 0.9 && p.confidence.name >= 0.85
}

// ─── Clarification queue builder (spec §CLARIFICATION QUEUE) ─────────────────

function buildClarificationQueue(
  parsed: ParsedExpense,
  userSelectedType: TransactionType,
  hasRecurringSignal: boolean,
): ClarificationStep[] {
  const steps: ClarificationStep[] = []

  // [1] AMOUNT — ask if missing or very low confidence
  if (parsed.amount === null || parsed.confidence.amount < 0.5) {
    const question = parsed.name ? `How much was ${parsed.name}?` : 'How much was this?'
    steps.push({ field: 'amount', question, options: null })
  } else if (parsed.amount === 0) {
    // §1C — zero amount: free or forgot?
    steps.push({
      field: 'amount',
      question: 'Amount is $0 — is this free or did you forget?',
      options: [
        { id: 1, label: 'It was free ($0)', value: '0' },
        { id: 2, label: 'Let me enter the amount', value: '__ask__' },
      ],
    })
  } else if (parsed.amount > LARGE_AMOUNT_THRESHOLD) {
    // §1E — very large amount: extra confirmation
    steps.push({
      field: 'amount',
      question: `Just confirming — $${parsed.amount.toLocaleString()} for ${parsed.name ?? 'this'}?`,
      options: [
        { id: 1, label: "Yes, that's right", value: String(parsed.amount) },
        { id: 2, label: 'No, let me re-enter', value: '__ask__' },
      ],
    })
  }

  // [2] NAME — ask if missing or very low confidence
  if (!parsed.name || parsed.confidence.name < 0.5) {
    const amountLabel = parsed.amount && parsed.amount > 0
      ? `$${parsed.amount.toLocaleString()}`
      : 'this'
    steps.push({
      field: 'name',
      question: `What was the ${amountLabel} for?`,
      options: null,
    })
  }

  // [3] TYPE — ask if ambiguous and user hasn't explicitly toggled (§3C, §3E)
  // The user's toggle IS their selection — only ask if type is truly unclear
  // In practice: we trust the toggle selection passed as `userSelectedType`
  // but if API detected a different type with high confidence, surface it
  if (parsed.type && parsed.type !== userSelectedType && parsed.confidence.name < 0.7) {
    // Only ask if it's genuinely ambiguous — both signals present
    const looksLikeIncome = INCOME_KEYWORDS.some(k => (parsed.name ?? '').toLowerCase().includes(k))
    if (looksLikeIncome && userSelectedType === 'expense') {
      steps.push({
        field: 'type',
        question: 'Is this an expense or income?',
        options: [
          { id: 1, label: 'Expense (money out)', value: 'expense' },
          { id: 2, label: 'Income (money in)', value: 'income' },
        ],
      })
    }
  }

  // [4] FREQUENCY — ONLY ask if recurring signal AND frequency not explicitly stated (§4C)
  // hasRecurringSignal = recurring keyword in name but no explicit frequency word
  if (hasRecurringSignal && parsed.confidence.frequency >= 0.99) {
    // frequency is 'none' with high default confidence → recurring keyword triggered
    steps.push({
      field: 'frequency',
      question: 'Is this a recurring payment?',
      options: [
        { id: 1, label: 'Monthly', value: 'monthly' },
        { id: 2, label: 'Weekly', value: 'weekly' },
        { id: 3, label: 'No', value: 'none' },
      ],
    })
  } else if (parsed.frequency !== 'none' && parsed.confidence.frequency < 0.8) {
    // Frequency was detected but with low confidence → confirm
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

  // [5] CATEGORY — never ask. Always use best guess or default 'Other'.
  // Category is an internal field the user can edit after logging.

  // No confirm step — save fires automatically when queue is exhausted.

  return steps
}

// ─── State types ──────────────────────────────────────────────────────────────

export interface CollectedData {
  name: string | null
  amount: number | null
  type: TransactionType
  category: string | null
  frequency: Frequency
}

interface UseAIParsingResult {
  isParsing: boolean
  parseError: string | null
  notExpense: boolean                 // true if input was a question/command
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
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAIParsing(): UseAIParsingResult {
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [notExpense, setNotExpense] = useState(false)
  const [clarificationQueue, setClarificationQueue] = useState<ClarificationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [collectedData, setCollectedData] = useState<CollectedData>({ ...DEFAULT_DATA })
  // Keep original text for recurring-keyword check after API parse
  const originalTextRef = useRef('')

  const reset = useCallback(() => {
    setIsParsing(false)
    setParseError(null)
    setNotExpense(false)
    setClarificationQueue([])
    setCurrentStepIndex(0)
    setCollectedData({ ...DEFAULT_DATA })
    originalTextRef.current = ''
  }, [])

  const parse = useCallback(async (text: string, type: TransactionType) => {
    if (!text.trim()) return

    // §2E — Detect question/command inputs before doing any parsing
    if (QUESTION_PATTERNS.some((p) => p.test(text.trim()))) {
      setNotExpense(true)
      return
    }
    setNotExpense(false)

    originalTextRef.current = text
    setIsParsing(true)
    setParseError(null)

    const local = localParse(text, type)
    let parsed: ParsedExpense
    let hasRecurringSignal = local.hasRecurringSignal

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
        const apiResult = await res.json() as ParsedExpense
        parsed = apiResult
        // Re-check recurring signal from original text since API may miss it
        hasRecurringSignal =
          parsed.frequency === 'none' &&
          RECURRING_KEYWORDS.some((k) => text.toLowerCase().includes(k))
      } catch {
        parsed = local
      }
    }

    // §1D — Negative → income/refund
    if (local.isNegative && parsed.amount !== null) {
      parsed.amount = Math.abs(parsed.amount)
      parsed.type = 'income'
    }

    // §3D — Always trust user toggle for type if they explicitly chose it
    // (The toggle IS the user's selection, don't override it unless it's income signal)
    const effectiveType = parsed.type === 'income' ? 'income' : type

    // Fallback name from category if name missing but category obvious
    let derivedName = parsed.name
    if (!derivedName && parsed.category && parsed.confidence.category >= 0.7) {
      derivedName = parsed.category
    }

    setCollectedData({
      name: derivedName,
      amount: parsed.amount,
      type: effectiveType,
      category: parsed.category ?? 'Other',
      frequency: parsed.frequency ?? 'none',
    })

    const queue = buildClarificationQueue(parsed, effectiveType, hasRecurringSignal)
    setClarificationQueue(queue)
    setCurrentStepIndex(0)
    setIsParsing(false)
  }, [])

  const answerStep = useCallback((value: string) => {
    setCollectedData((prev) => {
      const next = { ...prev }

      const step = clarificationQueue[currentStepIndex]
      if (!step) return prev

      switch (step.field) {
        case 'name': {
          next.name = value
          // §Example C — re-infer category from newly provided name
          const { category: inferred, confidence } = inferCategory(value)
          if (inferred && confidence >= 0.75 && !next.category) {
            next.category = inferred
            // Remove category step from remaining queue if it exists
            setClarificationQueue((q) => q.filter((s) => s.field !== 'category'))
          }
          break
        }
        case 'amount': {
          if (value === '__ask__') {
            // Replace current step with a free-text numeric input
            setClarificationQueue((q) => {
              const newQ = [...q]
              newQ[currentStepIndex] = {
                field: 'amount',
                question: 'How much was this?',
                options: null,
              }
              return newQ
            })
            return prev // don't advance index yet
          }
          const parsed = parseFloat(value.replace(/[^0-9.]/g, ''))
          next.amount = isNaN(parsed) ? null : parsed
          break
        }
        case 'frequency':
          next.frequency = value as Frequency
          break
        case 'category':
          next.category = value
          break
        case 'type':
          next.type = value as TransactionType
          break
      }

      return next
    })

    // Advance (except __ask__ which returns early above)
    if (value !== '__ask__') {
      setCurrentStepIndex((i) => i + 1)
    }
  }, [clarificationQueue, currentStepIndex])

  return {
    isParsing,
    parseError,
    notExpense,
    clarificationQueue,
    currentStepIndex,
    collectedData,
    parse,
    answerStep,
    reset,
  }
}
