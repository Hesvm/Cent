import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers['x-admin-password']
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { slug, dataUrl } = req.body as { slug: string; dataUrl: string }

  if (!slug || !dataUrl) return res.status(400).json({ error: 'Missing slug or dataUrl' })
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'Invalid slug' })

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  const dir = path.join(process.cwd(), 'public', 'categories')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filePath = path.join(dir, `${slug}.webp`)

  try {
    fs.writeFileSync(filePath, buffer)
    return res.status(200).json({ ok: true, path: `/categories/${slug}.webp` })
  } catch (err) {
    console.error('Failed to write image:', err)
    return res.status(500).json({ error: 'Failed to write image' })
  }
}
