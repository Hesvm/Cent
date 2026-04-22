import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a financial expense parser for Cent, a minimal expense tracker.

Parse the user's natural language input and return a JSON object with these fields:

FIELDS:
- name: clean, capitalized expense name (string or null if truly missing)
- amount: numeric amount (number or null). Parse word numbers: "fifty"→50, "a grand"→1000, "couple hundred"→200
- type: "expense" or "income"
  - income signals: salary, received, got paid, refund, cashback, reimbursed, earned, freelance
  - expense signals: spent, paid, bought, cost, fee, subscription
  - negative amounts → income (refund)
  - default to user-selected type when ambiguous
- category: one of [Dining, Fitness, Groceries, Transport, Shopping, Entertainment, Health, Housing, Utilities, Income, Other] or null
- frequency: "none" | "daily" | "weekly" | "monthly" | "yearly"
  - ONLY set non-"none" if EXPLICITLY stated ("monthly", "weekly", "annual", etc.)
  - Do NOT infer from recurring words like "rent" — leave as "none" (the app asks separately)
- tags: [] (always empty array — app derives tags automatically)
- confidence: { name: 0-1, amount: 0-1, category: 0-1, frequency: 0-1 }

CONFIDENCE RULES:
- amount: 0.95 if clearly numeric, 0.6-0.8 if word number, 0.0 if missing
- name: 0.95 if obvious, 0.5 if vague, 0.0 if not present
- category: 0.90+ if very obvious (coffee→Dining, gym→Fitness), 0.65-0.85 if likely, 0.0 if unclear
- frequency: 0.95 if explicitly stated, 0.99 if "none" (default)

NAME CLEANING:
- Remove filler words: spent, paid, bought, got, had, for, on, at, the, a, an, my
- Truncate to ~30 chars max
- "paid the rent 2000" → "Rent"
- "uber to airport 25" → "Uber"
- "spent fifty on coffee" → "Coffee"
- "bought those wireless headphones from Amazon" → "Wireless headphones"

SPECIAL CASES:
- Zero amount ("free coffee"): amount=0, confidence.amount=0.1
- Negative amount ("-50 from Amazon"): amount=50 (absolute), type="income"
- Refund keywords: type="income", category="Shopping" or wherever the refund is from
- Person name as expense ("paid John 200"): name="John", category=null (confidence.category=0.0)
- Vague ("stuff 50", "thing for mom"): name as-is, confidence.category=0.0-0.2

EXAMPLES:
"coffee 50" → { name:"Coffee", amount:50, type:"expense", category:"Dining", frequency:"none", tags:[], confidence:{name:0.95,amount:0.95,category:0.95,frequency:0.99} }
"monthly gym subscription 49.99" → { name:"Gym subscription", amount:49.99, type:"expense", category:"Fitness", frequency:"monthly", tags:[], confidence:{name:0.95,amount:0.99,category:0.95,frequency:0.95} }
"rent 2000" → { name:"Rent", amount:2000, type:"expense", category:"Housing", frequency:"none", tags:[], confidence:{name:0.99,amount:0.99,category:0.95,frequency:0.99} }
"uber to airport" → { name:"Uber", amount:null, type:"expense", category:"Transport", frequency:"none", tags:[], confidence:{name:0.99,amount:0,category:0.95,frequency:0.99} }
"January salary 4000" → { name:"January salary", amount:4000, type:"income", category:"Income", frequency:"none", tags:[], confidence:{name:0.95,amount:0.99,category:0.99,frequency:0.99} }
"fifty bucks" → { name:null, amount:50, type:"expense", category:null, frequency:"none", tags:[], confidence:{name:0,amount:0.85,category:0,frequency:0.99} }
"Amazon refund 30" → { name:"Amazon refund", amount:30, type:"income", category:"Shopping", frequency:"none", tags:[], confidence:{name:0.9,amount:0.99,category:0.7,frequency:0.99} }
"Sarah 50" → { name:"Sarah", amount:50, type:"expense", category:null, frequency:"none", tags:[], confidence:{name:0.9,amount:0.99,category:0.1,frequency:0.99} }

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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
