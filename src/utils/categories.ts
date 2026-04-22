import type { Category } from '../types'

export const CATEGORY_EMOJI: Record<Category, string> = {
  Dining: '🧋',
  Fitness: '🥊',
  Income: '💵',
  Shopping: '🛍️',
  Transport: '🚗',
  Groceries: '🛒',
  Entertainment: '🎬',
  Health: '💊',
  Housing: '🏠',
  Utilities: '💡',
  Other: '💳',
}

export function getEmoji(category: Category): string {
  return CATEGORY_EMOJI[category] ?? '💳'
}
