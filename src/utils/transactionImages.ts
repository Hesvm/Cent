import { CATEGORIES, LEGACY_CATEGORY_MAP, CATEGORY_FALLBACK_URL } from '../config/categories'

// Normalise a category string for fuzzy matching:
// trim whitespace, lowercase, collapse runs of spaces, strip accents
function normalise(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')                  // decompose accented chars (é → e + ́)
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritics (é → e)
    .replace(/\s+/g, ' ')
}

// Pre-build a normalised lookup table once at module load
const NORMALISED_CATEGORIES = CATEGORIES.map(c => ({
  ...c,
  normalised: normalise(c.name),
}))

/**
 * Returns the image URL for a transaction category.
 * Resolution order:
 *  1. Legacy map (exact key)            → canonical name
 *  2. Exact match against canonical list
 *  3. Case-insensitive + accent-folded match
 * Falls back to the coin image for anything else.
 */
export function getCategoryImage(rawCategory: string | null | undefined): string {
  if (!rawCategory) return CATEGORY_FALLBACK_URL

  const trimmed = rawCategory.trim()

  // 1. Resolve via legacy map
  const resolved = LEGACY_CATEGORY_MAP[trimmed] ?? trimmed

  // 2. Exact match
  let match = CATEGORIES.find(c => c.name === resolved)

  // 3. Normalised (case + accent) fallback
  if (!match) {
    const normResolved = normalise(resolved)
    match = NORMALISED_CATEGORIES.find(c => c.normalised === normResolved)
  }

  if (!match) {
    console.warn(`[Cent] Unknown category: "${rawCategory}". Using fallback image.`)
    return CATEGORY_FALLBACK_URL
  }

  return `/categories/${match.slug}.webp`
}
