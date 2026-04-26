import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CATEGORY_RULES } from '../src/data/categoryRules'

function matchByKeyword(transactionName: string): string | null {
  const name = transactionName.toLowerCase()
  for (const [slug, rule] of Object.entries(CATEGORY_RULES)) {
    if (rule.keywords.some(kw => name.includes(kw))) {
      return slug
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
- category: exactly one of the 50 categories below, or null if confidence ≤ 0.70
- frequency: "none" | "daily" | "weekly" | "monthly" | "yearly"
  - ONLY set non-"none" if EXPLICITLY stated ("monthly", "weekly", "annual", etc.)
  - Do NOT infer from recurring words like "rent" — leave as "none"
- tags: [] (always empty array)
- confidence: { name: 0-1, amount: 0-1, category: 0-1, frequency: 0-1 }

THE 50 CATEGORIES (use exact names):
Food & Drink: Restaurants, Coffee & Cafes, Groceries, Bars & Nightlife, Fast Food, Bakery & Sweets, Delivery, Work Meals
Transport: Ride-hailing, Fuel, Parking, Public Transit, Flights, Car Maintenance
Shopping: Clothing, Electronics, Home & Furniture, Books & Stationery, Gifts, Online Shopping, Beauty & Personal
Health & Fitness: Gym & Sports, Medical, Pharmacy, Mental Health, Wellness
Home & Life: Rent, Utilities, Home Services, Pets, Childcare, Insurance
Entertainment & Lifestyle: Streaming, Gaming, Events & Tickets, Hobbies, Travel & Hotels, Sports & Outdoors
Work & Finance: Software & Tools, Office Supplies, Freelance Expense, Education, Taxes & Fees, Investments, Loan Payments
Income: Salary, Freelance Income, Refund, Gift Received, Other Income

CATEGORY RULES:
- Only return a category if confidence > 0.70. Otherwise return null.
- Pick the most specific category that fits.
- For income transactions, prefer income categories (Salary, Freelance Income, Refund, etc.)
- Ambiguous merchants (e.g. "Amazon", "CVS") → null (could be multiple categories)

CONFIDENCE RULES:
- category: 0.95+ if very obvious, 0.71-0.94 if likely, ≤0.70 returns null
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
- Refund keywords: type="income", category="Refund"
- Person name as expense ("paid John 200"): name="John", category=null
- Vague ("stuff 50", "thing for mom"): name as-is, category=null

EXAMPLES:
"coffee 50" → {name:"Coffee",amount:50,type:"expense",category:"Coffee & Cafes",frequency:"none",tags:[],confidence:{name:0.95,amount:0.95,category:0.95,frequency:0.99}}
"monthly gym subscription 49.99" → {name:"Gym subscription",amount:49.99,type:"expense",category:"Gym & Sports",frequency:"monthly",tags:[],confidence:{name:0.95,amount:0.99,category:0.95,frequency:0.95}}
"rent 2000" → {name:"Rent",amount:2000,type:"expense",category:"Rent",frequency:"none",tags:[],confidence:{name:0.99,amount:0.99,category:0.97,frequency:0.99}}
"uber to airport" → {name:"Uber",amount:null,type:"expense",category:"Ride-hailing",frequency:"none",tags:[],confidence:{name:0.99,amount:0,category:0.93,frequency:0.99}}
"January salary 4000" → {name:"January salary",amount:4000,type:"income",category:"Salary",frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.99,frequency:0.99}}
"amazon refund 30" → {name:"Amazon refund",amount:30,type:"income",category:"Refund",frequency:"none",tags:[],confidence:{name:0.9,amount:0.99,category:0.92,frequency:0.99}}
"netflix 15" → {name:"Netflix",amount:15,type:"expense",category:"Streaming",frequency:"none",tags:[],confidence:{name:0.99,amount:0.99,category:0.98,frequency:0.99}}
"dinner 60" → {name:"Dinner",amount:60,type:"expense",category:"Restaurants",frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.82,frequency:0.99}}
"CVS 30" → {name:"CVS",amount:30,type:"expense",category:null,frequency:"none",tags:[],confidence:{name:0.95,amount:0.99,category:0.55,frequency:0.99}}
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

    const categoryContext = Object.entries(CATEGORY_RULES)
      .filter(([, rule]) => rule.description)
      .map(([slug, rule]) => `- ${slug}: ${rule.description}`)
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
