import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CATEGORY_RULES } from '../src/data/categoryRules.js'

type CategoryRule = { keywords: string[]; description: string }

// Returns the full category name (guide-canonical) or null
function matchByKeyword(transactionName: string): string | null {
  const name = transactionName.toLowerCase()
  for (const [categoryName, rule] of Object.entries(CATEGORY_RULES) as [string, CategoryRule][]) {
    if (rule.keywords.some((kw: string) => name.includes(kw))) {
      return categoryName
    }
  }
  return null
}

const SYSTEM_PROMPT = `You are a financial expense parser for Cent, a minimal expense tracker.

Parse the user's natural language input and return a JSON object with these fields:

FIELDS:
- name: clean, capitalized expense name (string or null if truly missing)
- amount: numeric amount (number or null). Parse word numbers: "fifty"→50, "a grand"→1000, "couple hundred"→200
- type: "expense" or "income"
  - income signals: salary, received, got paid, refund, cashback, reimbursed, earned, freelance payment
  - expense signals: spent, paid, bought, cost, fee, subscription
  - negative amounts → income (refund)
  - default to user-selected type when ambiguous
- category: exactly one of the 30 categories below, or null if confidence ≤ 0.70
- frequency: "none" | "daily" | "weekly" | "monthly" | "yearly"
  - ONLY set non-"none" if EXPLICITLY stated ("monthly", "weekly", "annual", etc.)
  - Do NOT infer from recurring words like "rent" — leave as "none"
- tags: [] (always empty array)
- confidence: { name: 0-1, amount: 0-1, category: 0-1, frequency: 0-1 }

THE 30 CATEGORIES (use exact names):
Food & Drink: Restaurants & Dining, Coffee & Cafés, Groceries, Alcohol & Bars
Transport & Travel: Transport, Travel
Health & Wellness: Health & Medical, Fitness & Sports, Personal Care & Beauty
Entertainment: Entertainment, Streaming & Subscriptions, Gaming, Books & Reading
Home & Life: Housing & Rent, Utilities, Home Maintenance & Repairs, Pets, Childcare & Kids
Shopping: Shopping, Gifts & Occasions, Charity & Donations
Finance: Insurance, Banking & Finance, Investments, Government & Taxes
Work & Education: Education, Office & Work Expenses
Income: Salary & Income, Freelance & Side Income, Rental Income

CATEGORY RULES:
- Only return a category if confidence > 0.70. Otherwise return null.
- Pick the most specific category that fits.
- If confidence ≤ 0.70: return null for category. Do not guess.
- Never invent categories. Only use exact names from the list above.
- One category only. Never return two.
- For income transactions, prefer income categories (Salary & Income, Freelance & Side Income, Rental Income).
- Airbnb expense → Travel. Airbnb payout → Rental Income.
- NS (Dutch train) → Transport (daily commute, not Travel).
- Eurostar / KLM / Ryanair → Travel.
- Basic-Fit / gym → Fitness & Sports, not Health & Medical.
- Pharmacy / huisarts → Health & Medical, not Fitness.
- Gall & Gall (liquor store) → Alcohol & Bars, not Groceries.
- DEGIRO / eToro / crypto → Investments, not Banking & Finance.
- GoFundMe / NGO / church → Charity & Donations.
- Ambiguous generic brands (Apple, Amazon, Google alone) → null.
- Apple Music / Apple TV+ → Streaming & Subscriptions.
- Amazon Prime → Streaming & Subscriptions.

CONFIDENCE RULES:
- category: 0.95+ if exact brand match, 0.85+ if clear generic match, ≤0.70 returns null
- amount: 0.95 if clearly numeric, 0.6-0.8 if word number, 0.0 if missing
- name: 0.95 if obvious, 0.5 if vague, 0.0 if not present
- frequency: 0.95 if explicitly stated, 0.99 if "none" (default)

NAME CLEANING:
- Remove filler words: spent, paid, bought, got, had, for, on, at, the, a, an, my
- Truncate to ~30 chars max
- "paid the rent 2000" → "Rent"
- "uber to airport 25" → "Uber"
- "spent fifty on coffee" → "Coffee"
- "bought wireless headphones from Amazon" → "Wireless headphones"

SPECIAL CASES:
- Zero amount ("free coffee"): amount=0, confidence.amount=0.1
- Negative amount ("-50 from Amazon"): amount=50 (absolute), type="income"
- Refund keywords: type="income", category=null (unless clearly a refund of known type)
- Person name as expense ("paid John 200"): name="John", category=null
- Vague ("stuff 50", "thing for mom"): name as-is, category=null
- Dutch names: treated same as English — Dutch keywords are valid signals

EXAMPLES:
"coffee 50" → {name:"Coffee",amount:50,type:"expense",category:"Coffee & Cafés",frequency:"none",tags:[],confidence:{name:0.95,amount:0.95,category:0.95,frequency:0.99}}
"monthly gym subscription 49.99" → {name:"Gym subscription",amount:49.99,type:"expense",category:"Fitness & Sports",frequency:"monthly",tags:[],confidence:{name:0.95,amount:0.99,category:0.95,frequency:0.95}}
"huur 2000" → {name:"Huur",amount:2000,type:"expense",category:"Housing & Rent",frequency:"none",tags:[],confidence:{name:0.99,amount:0.99,category:0.97,frequency:0.99}}
"uber to airport" → {name:"Uber",amount:null,type:"expense",category:"Transport",frequency:"none",tags:[],confidence:{name:0.99,amount:0,category:0.93,frequency:0.99}}
"January salary 4000" → {name:"January salary",amount:4000,type:"income",category:"Salary & Income",frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.99,frequency:0.99}}
"netflix 15" → {name:"Netflix",amount:15,type:"expense",category:"Streaming & Subscriptions",frequency:"none",tags:[],confidence:{name:0.99,amount:0.99,category:0.98,frequency:0.99}}
"dinner 60" → {name:"Dinner",amount:60,type:"expense",category:"Restaurants & Dining",frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.82,frequency:0.99}}
"Albert Heijn 45" → {name:"Albert Heijn",amount:45,type:"expense",category:"Groceries",frequency:"none",tags:[],confidence:{name:0.99,amount:0.99,category:0.99,frequency:0.99}}
"Airbnb payout 800" → {name:"Airbnb payout",amount:800,type:"income",category:"Rental Income",frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.95,frequency:0.99}}
"Apple 999" → {name:"Apple",amount:999,type:"expense",category:null,frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.55,frequency:0.99}}
"fifty bucks" → {name:null,amount:50,type:"expense",category:null,frequency:"none",tags:[],confidence:{name:0,amount:0.85,category:0,frequency:0.99}}

Return ONLY valid JSON. No markdown, no explanation.`

const GEMINI_MODEL = 'gemini-2.0-flash'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, type } = req.body as { text: string; type: string }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' })
  }

  // Fast path: keyword match skips Gemini entirely
  const keywordMatch = matchByKeyword(text)
  if (keywordMatch) {
    return res.status(200).json({
      name: null,
      amount: null,
      type: type ?? 'expense',
      category: keywordMatch,
      frequency: 'none',
      tags: [],
      confidence: { name: 0, amount: 0, category: 1.0, frequency: 0.99 },
      source: 'keyword',
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const categoryContext = (Object.entries(CATEGORY_RULES) as [string, CategoryRule][])
      .filter(([, rule]) => rule.description)
      .map(([name, rule]) => `- ${name}: ${rule.description}`)
      .join('\n')

    const systemPromptWithContext = SYSTEM_PROMPT + `\n\nADDITIONAL CATEGORY CONTEXT:\n${categoryContext}`

    const body = {
      system_instruction: { parts: [{ text: systemPromptWithContext }] },
      contents: [{
        role: 'user',
        parts: [{ text: `User-selected type: "${type}". Parse: "${text}"` }],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 512,
        temperature: 0.1,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini API error:', err)
      return res.status(500).json({ error: 'Gemini API error' })
    }

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonText = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(jsonText) as unknown
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Parse error:', err)
    return res.status(500).json({ error: 'Parse failed' })
  }
}
