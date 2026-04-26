import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers['x-admin-password']
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { rules } = req.body as { rules: Record<string, { keywords: string[]; description: string }> }

  if (!rules) return res.status(400).json({ error: 'No rules provided' })

  const lines = [
    `export type CategoryRule = {`,
    `  keywords: string[];`,
    `  description: string;`,
    `};`,
    ``,
    `export type CategoryRulesMap = Record<string, CategoryRule>;`,
    ``,
    `// keywords = fast first-pass match (case-insensitive, substring)`,
    `// description = injected into Gemini prompt when keywords don't match`,
    `export const CATEGORY_RULES: CategoryRulesMap = {`,
  ]

  for (const [slug, rule] of Object.entries(rules)) {
    const kws = JSON.stringify(rule.keywords)
    const desc = rule.description.replace(/`/g, "'")
    lines.push(`  '${slug}': {`)
    lines.push(`    keywords: ${kws},`)
    lines.push(`    description: \`${desc}\`,`)
    lines.push(`  },`)
  }

  lines.push(`};`)
  lines.push(``)

  const content = lines.join('\n')
  const filePath = path.join(process.cwd(), 'src', 'data', 'categoryRules.ts')

  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Failed to write categoryRules.ts:', err)
    return res.status(500).json({ error: 'Failed to write file' })
  }
}
