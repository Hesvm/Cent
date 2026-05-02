import type { VercelRequest, VercelResponse } from '@vercel/node'
import Groq from 'groq-sdk'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' })
  }

  // Parse multipart form data manually — Vercel raw body
  // The audio blob arrives as a buffer in req.body when Content-Type is multipart
  // We need to read the raw buffer from the request
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const rawBody = Buffer.concat(chunks)

  if (rawBody.length === 0) {
    return res.status(400).json({ error: 'No audio data received' })
  }

  // File size check: Groq max 25MB
  if (rawBody.length > 25 * 1024 * 1024) {
    return res.status(413).json({ error: 'Recording too long' })
  }

  // Extract boundary and audio blob from multipart
  const contentType = req.headers['content-type'] ?? ''
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/)
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'Invalid content type' })
  }

  const boundary = boundaryMatch[1]
  const bodyStr = rawBody.toString('binary')
  const parts = bodyStr.split(`--${boundary}`)

  let audioBuffer: Buffer | null = null
  let mimeType = 'audio/webm'

  for (const part of parts) {
    if (part.includes('name="audio"')) {
      // Extract MIME type
      const mimeMatch = part.match(/Content-Type:\s*([^\r\n]+)/i)
      if (mimeMatch) mimeType = mimeMatch[1].trim()
      // Extract binary data (after double CRLF header separator)
      const headerEnd = part.indexOf('\r\n\r\n')
      if (headerEnd !== -1) {
        const binaryStr = part.slice(headerEnd + 4).replace(/\r\n$/, '')
        audioBuffer = Buffer.from(binaryStr, 'binary')
      }
      break
    }
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    return res.status(400).json({ error: 'No audio found in request' })
  }

  try {
    const groq = new Groq({ apiKey })

    // Build a File object that Groq SDK accepts
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([new Uint8Array(audioBuffer)], `recording.${ext}`, { type: mimeType })

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      language: 'en',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segments = (transcription as any).segments as { avg_logprob?: number }[] | undefined
    const avgLogprob = segments?.[0]?.avg_logprob ?? null

    // Convert log-prob to a rough 0-1 confidence
    // log-prob of 0 = 100%, -1 = ~37%, -2 = ~14%
    const confidence = avgLogprob !== null
      ? Math.max(0, Math.min(1, Math.exp(avgLogprob)))
      : null

    return res.status(200).json({
      transcript: transcription.text,
      confidence,
    })
  } catch (err) {
    console.error('Groq transcription error:', err)
    return res.status(500).json({ error: 'Transcription failed' })
  }
}

export const config = {
  api: {
    bodyParser: false, // We parse the raw body ourselves
  },
}
