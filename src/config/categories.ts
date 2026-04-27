// ─── 30 canonical categories per cent-category-guide ────────────────────────

export type CategoryGroup =
  | 'Food & Drink'
  | 'Transport & Travel'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Home & Life'
  | 'Shopping'
  | 'Finance'
  | 'Work & Education'
  | 'Income'

export interface CategoryItem {
  name: string
  group: CategoryGroup
  cdnSlug: string
}

export const CATEGORIES: CategoryItem[] = [
  // ── Food & Drink ─────────────────────────────────────────────────────────────
  { name: 'Restaurants & Dining',     group: 'Food & Drink',       cdnSlug: 'restaurant'   },
  { name: 'Coffee & Cafés',           group: 'Food & Drink',       cdnSlug: 'coffee'        },
  { name: 'Groceries',                group: 'Food & Drink',       cdnSlug: 'supermarket'   },
  { name: 'Alcohol & Bars',           group: 'Food & Drink',       cdnSlug: 'cocktail'      },
  // ── Transport & Travel ───────────────────────────────────────────────────────
  { name: 'Transport',                group: 'Transport & Travel', cdnSlug: 'bus'           },
  { name: 'Travel',                   group: 'Transport & Travel', cdnSlug: 'suitcase'      },
  // ── Health & Wellness ────────────────────────────────────────────────────────
  { name: 'Health & Medical',         group: 'Health & Wellness',  cdnSlug: 'ambulance'     },
  { name: 'Fitness & Sports',         group: 'Health & Wellness',  cdnSlug: 'dumbbell'      },
  { name: 'Personal Care & Beauty',   group: 'Health & Wellness',  cdnSlug: 'sunglasses'    },
  // ── Entertainment ────────────────────────────────────────────────────────────
  { name: 'Entertainment',            group: 'Entertainment',      cdnSlug: 'movie'         },
  { name: 'Streaming & Subscriptions',group: 'Entertainment',      cdnSlug: 'subscription'  },
  { name: 'Gaming',                   group: 'Entertainment',      cdnSlug: 'movie'         },
  { name: 'Books & Reading',          group: 'Entertainment',      cdnSlug: 'book'          },
  // ── Home & Life ──────────────────────────────────────────────────────────────
  { name: 'Housing & Rent',           group: 'Home & Life',        cdnSlug: 'house'         },
  { name: 'Utilities',                group: 'Home & Life',        cdnSlug: 'lightning'     },
  { name: 'Home Maintenance & Repairs',group: 'Home & Life',       cdnSlug: 'house'         },
  { name: 'Pets',                     group: 'Home & Life',        cdnSlug: 'dog'           },
  { name: 'Childcare & Kids',         group: 'Home & Life',        cdnSlug: 'credit-card'   },
  // ── Shopping ─────────────────────────────────────────────────────────────────
  { name: 'Shopping',                 group: 'Shopping',           cdnSlug: 'shopping-bag'  },
  { name: 'Gifts & Occasions',        group: 'Shopping',           cdnSlug: 'gift'          },
  { name: 'Charity & Donations',      group: 'Shopping',           cdnSlug: 'gift'          },
  // ── Finance ──────────────────────────────────────────────────────────────────
  { name: 'Insurance',                group: 'Finance',            cdnSlug: 'insurance'     },
  { name: 'Banking & Finance',        group: 'Finance',            cdnSlug: 'bank'          },
  { name: 'Investments',              group: 'Finance',            cdnSlug: 'bank'          },
  { name: 'Government & Taxes',       group: 'Finance',            cdnSlug: 'receipt'       },
  // ── Work & Education ─────────────────────────────────────────────────────────
  { name: 'Education',                group: 'Work & Education',   cdnSlug: 'book'          },
  { name: 'Office & Work Expenses',   group: 'Work & Education',   cdnSlug: 'laptop'        },
  // ── Income ───────────────────────────────────────────────────────────────────
  { name: 'Salary & Income',          group: 'Income',             cdnSlug: 'money'         },
  { name: 'Freelance & Side Income',  group: 'Income',             cdnSlug: 'money'         },
  { name: 'Rental Income',            group: 'Income',             cdnSlug: 'house'         },
]

export const CATEGORY_GROUP_ORDER: CategoryGroup[] = [
  'Food & Drink',
  'Transport & Travel',
  'Health & Wellness',
  'Entertainment',
  'Home & Life',
  'Shopping',
  'Finance',
  'Work & Education',
  'Income',
]

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name)

export function getCategoryItem(name: string | null): CategoryItem | undefined {
  if (!name) return undefined
  return CATEGORIES.find(c => c.name === name)
}

export function getCategoriesByGroup(): Record<CategoryGroup, CategoryItem[]> {
  const result = {} as Record<CategoryGroup, CategoryItem[]>
  for (const g of CATEGORY_GROUP_ORDER) result[g] = []
  for (const cat of CATEGORIES) result[cat.group].push(cat)
  return result
}
