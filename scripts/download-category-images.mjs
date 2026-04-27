#!/usr/bin/env node
// Downloads category images from the Vercel Blob CDN into /public/categories/{slug}.webp
// For slugs not yet in CDN (tools, baby, gamepad, heart, briefcase) — reports FAILED.
// Run: node scripts/download-category-images.mjs

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'categories')

mkdirSync(OUT_DIR, { recursive: true })

const CDN = 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com'

// Known CDN URLs — sourced from src/utils/transactionImages.ts
const CDN_IMAGES = {
  coffee:         `${CDN}/image-mOoyvLISs98asAdPdQUhTac4S9Q1M9.png`,
  house:          `${CDN}/image-0OoMAJRtHLxXtHGKaC50y1kLqsAPFV.png`,
  wallet:         `${CDN}/image-r5QxxRu1dvIND6CpaRBYLTnJmCfzNM.png`,
  'shopping-bag': `${CDN}/image-1kzlhXN3lasEQYBtwdeXrzzhBEwurX.png`,
  restaurant:     `${CDN}/image-hRETElBXDrcXOu32Vv4OnRgHpWQZj3.png`,
  movie:          `${CDN}/image-DNaKSDV2Vm6rz8yKS6WtuJwy4rLZwh.png`,
  lightning:      `${CDN}/image-kEc3FuOo6TejgI0tivfA8qPm4YIWfV.png`,
  subscription:   `${CDN}/image-JFRJMlgmIk1SNlNPZVGSW7bTco4jY4.png`,
  'gas-station':  `${CDN}/image-0J3HeTBw7OlENzRBjYxhCozIqq8fUV.png`,
  airplane:       `${CDN}/image-v0LP91OBaZckcNrHRNpH4uXzImn4v5.png`,
  book:           `${CDN}/image-QhvfavmoGfPmREwwvl4XtqTIORARDz.png`,
  insurance:      `${CDN}/image-EXQKqxwkBgsyk04E6ht3UY7xupVGrE.png`,
  taxi:           `${CDN}/image-Ei311Qi6EfCbzzHIhoFcn9ngw1jNlj.png`,
  train:          `${CDN}/image-B6HK6QalkOwIxTOxbj2guRpL5YQjAL.png`,
  laptop:         `${CDN}/image-UsyTZyMk2er8VfZu1T68Z4BbnfHYL1.png`,
  suitcase:       `${CDN}/image-SJxXSQiZvg2rhqvpw6hANLsmgfO4tX.png`,
  money:          `${CDN}/image-IeKGYKeLd25OWlrmd5WrSsfbD7OIPA.png`,
  bank:           `${CDN}/image-IiMitsVHDCFJDFZnsGOFBFJg3Jhsbp.png`,
  receipt:        `${CDN}/image-DjLfCX0etcbaHeaobCUklhYQWOSXUF.png`,
  gift:           `${CDN}/image-yqO1RPHoOjuNAvqMy997ClCPIwICsb.png`,
  supermarket:    `${CDN}/image-6RTw7Ifo1xhDr9ETjDBjMGv5S5YzTi.png`,
  dog:            `${CDN}/image-YXDHNtGHmuIYVUpDDrH3GBHMqKQB4c.png`,
  cocktail:       `${CDN}/image-WTz9QHRXEZEXczW1IeiF48lnTFXq2L.png`,
  bus:            `${CDN}/image-eul8D3pWw6n8J32F5tqJHvnYub3mwd.png`,
  ambulance:      `${CDN}/image-AYUl8fBBUAB87V9MUkKFWYlwiYC14i.png`,
  dumbbell:       `${CDN}/image-5RAX5kW85fgiRpM3VdHTeOZmSRx3wB.png`,
  sunglasses:     `${CDN}/image-5SFKX0yeQoj1PbNM2ObWNi902QoUeO.png`,
}

// All 27 slugs required by the category system
const REQUIRED_SLUGS = [
  'restaurant', 'coffee', 'supermarket', 'cocktail',
  'bus', 'suitcase',
  'ambulance', 'dumbbell', 'sunglasses',
  'house', 'lightning', 'tools', 'dog', 'baby',
  'movie', 'subscription', 'gamepad', 'book', 'shopping-bag', 'gift', 'heart',
  'insurance', 'bank', 'money', 'receipt',
  'laptop',
  'briefcase',
]

async function downloadSlug(slug) {
  const url = CDN_IMAGES[slug]
  if (!url) return { slug, ok: false, reason: 'no CDN source — upload manually via admin' }

  try {
    const res = await fetch(url)
    if (!res.ok) return { slug, ok: false, reason: `HTTP ${res.status}` }
    const buf = Buffer.from(await res.arrayBuffer())
    const dest = join(OUT_DIR, `${slug}.webp`)
    writeFileSync(dest, buf)
    return { slug, ok: true, bytes: buf.length }
  } catch (e) {
    return { slug, ok: false, reason: e.message }
  }
}

console.log(`Downloading ${REQUIRED_SLUGS.length} category images to public/categories/...\n`)

const results = await Promise.all(REQUIRED_SLUGS.map(downloadSlug))

const ok = results.filter(r => r.ok)
const failed = results.filter(r => !r.ok)

console.log(`✓ Downloaded ${ok.length} images:`)
for (const r of ok) console.log(`  ${r.slug}.webp  (${(r.bytes / 1024).toFixed(0)} KB)`)

if (failed.length) {
  console.log(`\n[FAILED] ${failed.length} slug(s) have no CDN source — add manually via admin panel:`)
  for (const r of failed) console.log(`  [FAILED] slug: "${r.slug}" — ${r.reason}`)
}

console.log(`\nDone. ${ok.length}/${REQUIRED_SLUGS.length} files written to public/categories/`)
