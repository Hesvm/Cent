import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a financial expense parser for Cent, a minimal expense tracker app.

Parse the user's natural language input and extract:
- name: the expense/income name (string or null)
- amount: the numeric amount (number or null)
- type: 'expense' or 'income' (use context clues, default to expense)
- category: one of [Dining, Fitness, Groceries, Transport, Shopping, Entertainment, Health, Housing, Utilities, Income, Other]
- frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' (default: 'none')
- tags: array of relevant short tags (e.g. ["Gym", "Monthly"])
- confidence: object with 0-1 confidence for each field

Examples:
- "spent fifty on coffee" → { name: "Coffee", amount: 50, type: "expense", category: "Dining", frequency: "none", tags: [], confidence: { name: 0.9, amount: 0.95, category: 0.9, frequency: 0.99 } }
- "monthly gym subscription forty-nine ninety-nine" → { name: "Gym subscription", amount: 49.99, type: "expense", category: "Fitness", frequency: "monthly", tags: ["Gym", "Monthly"], confidence: { name: 0.95, amount: 0.95, category: 0.99, frequency: 0.99 } }
- "uber to airport" → { name: "Uber", amount: null, type: "expense", category: "Transport", frequency: "none", tags: [], confidence: { name: 0.99, amount: 0, category: 0.95, frequency: 0.99 } }
- "twenty five dollars" → { name: null, amount: 25, type: "expense", category: null, frequency: "none", tags: [], confidence: { name: 0, amount: 0.99, category: 0, frequency: 0.99 } }
- "January salary 4000" → { name: "January salary", amount: 4000, type: "income", category: "Income", frequency: "monthly", tags: ["Monthly"], confidence: { name: 0.95, amount: 0.99, category: 0.99, frequency: 0.85 } }

Return ONLY valid JSON matching the ParsedExpense type. No explanation, no markdown.`

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
        parts: [{ text: `Parse this expense (user-selected type: ${type}): "${text}"` }],
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
