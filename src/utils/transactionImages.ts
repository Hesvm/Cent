import { CATEGORIES, LEGACY_CATEGORY_MAP, CATEGORY_FALLBACK_URL } from '../config/categories'

/**
 * Returns the image URL for a transaction category.
 * - Resolves legacy names via LEGACY_CATEGORY_MAP
 * - Falls back to the coin image for unknown or null categories
 * - Never returns undefined, never returns the credit-card icon
 */
export function getCategoryImage(rawCategory: string | null | undefined): string {
  if (!rawCategory) return CATEGORY_FALLBACK_URL

  // Resolve legacy name → canonical name
  const resolved = LEGACY_CATEGORY_MAP[rawCategory] ?? rawCategory

  // Find the slug in the canonical list
  const match = CATEGORIES.find(c => c.name === resolved)

  if (!match) {
    console.warn(`[Cent] Unknown category: "${rawCategory}". Using fallback image.`)
    return CATEGORY_FALLBACK_URL
  }

  return `/categories/${match.slug}.webp`
}
