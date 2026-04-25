import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `You are the voice of Cent, a minimal expense tracking app.
Your job: write ONE sharp, slightly provocative insight about the user's spending.

RULES:
- Maximum 2 sentences. Often 1 is better.
- Tone: blunt, direct, slightly savage. Like a brutally honest friend.
- NO filler phrases: never say "It looks like", "I noticed", "Hey there", "Great news"
- NO exclamation marks (they feel fake)
- Use specific numbers from the data. Not vague.
- If it's bad news: be blunt, not mean. Observe, don't lecture.
- If it's good news: acknowledge it but don't gush.
- End with a period. Never a question mark.
- Do NOT include emoji in the message text — put it in the "emoji" field only.

Respond with ONLY valid JSON:
{
  "message": "your 1-2 sentence insight here (no emoji)",
  "emoji": "single emoji character"
}`

// ── Fallback templates (used when Gemini fails) ──────────────────────────────

type FallbackFn = (d: Record<string, unknown>) => { message: string; emoji: string }

const FALLBACKS: Record<string, FallbackFn> = {
  'RT-01': (d) => ({
    emoji: '💸',
    message: `${d.percent_used}% of your budget is gone. $${d.amount_remaining} left for the rest of the period.`,
  }),
  'RT-02': (d) => ({
    emoji: '😬',
    message: `$${d.amount} on ${d.transaction_name} in one shot. Your average transaction is $${Math.round(d.user_avg_transaction as number)}.`,
  }),
  'RT-03': (d) => ({
    emoji: '☕',
    message: `${d.daily_count} ${d.category} transactions today. That's $${d.daily_total_in_category} total.`,
  }),
  'RT-04': (d) => ({
    emoji: '🔴',
    message: `Budget's done. You're $${d.amount_over} over with ${d.days_left_in_period} days left.`,
  }),
  'DD-01': (d) => ({
    emoji: '📈',
    message: `Spending ${Math.abs(d.percent_change as number)}% ${(d.percent_change as number) > 0 ? 'more' : 'less'} than last month at this point in the period.`,
  }),
  'DD-02': (d) => ({
    emoji: '🔥',
    message: `At this pace: $${d.projected_spend} this month. Budget is $${d.budget}. The math is not mathing.`,
  }),
  'DD-03': (d) => ({
    emoji: '✅',
    message: `Projecting $${d.surplus} under budget this month. Whatever you're doing, keep it up.`,
  }),
  'DD-04': (d) => ({
    emoji: '📊',
    message: `${d.dominant_category} is ${d.category_percent}% of everything you've spent this month. Just an observation.`,
  }),
  'DD-05': (d) => ({
    emoji: '📉',
    message: `${d.streak_days} days under your daily average. That's $${d.total_saved_vs_avg} saved vs your usual pace.`,
  }),
  'DD-06': (d) => ({
    emoji: '👻',
    message: `Nothing logged in ${d.days_since_last_log} days. Either you quit spending or you quit tracking.`,
  }),
  'DD-07': (d) => ({
    emoji: '📅',
    message: `${d.month_name}'s done. $${d.total_spent} spent${typeof d.over_or_under === 'number' ? `, $${Math.abs(d.over_or_under)} ${d.over_or_under < 0 ? 'over' : 'under'} budget` : ''}.`,
  }),
  'DD-08': (d) => ({
    emoji: '⚡',
    message: `One week in, $${d.week1_spent} spent. That's ${d.percent_of_budget_used}% of your monthly budget already gone.`,
  }),
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { trigger_id, data } = req.body as { trigger_id: string; data: Record<string, unknown> }
  if (!trigger_id) return res.status(400).json({ error: 'Missing trigger_id' })

  const fallback = FALLBACKS[trigger_id]?.(data ?? {})

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(200).json(fallback ?? { message: 'Your spending habits are worth a look.', emoji: '💡' })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{
        role: 'user',
        parts: [{ text: `TRIGGER: ${trigger_id}\nDATA: ${JSON.stringify(data, null, 2)}` }],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 256,
        temperature: 0.85,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) throw new Error(`Gemini ${response.status}`)

    const geminiData = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = rawText.trim().replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()
    const parsed = JSON.parse(clean) as { message: string; emoji: string }

    // Safety: max 2 sentences
    const sentences = parsed.message.split(/(?<=\.)\s+/)
    const message = sentences.slice(0, 2).join(' ')

    return res.status(200).json({ message, emoji: parsed.emoji ?? fallback?.emoji ?? '💡' })
  } catch (err) {
    console.error('Insight generation error:', err)
    return res.status(200).json(fallback ?? { message: 'Your spending habits are worth a look.', emoji: '💡' })
  }
}
