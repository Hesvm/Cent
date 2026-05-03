// ─── 30 canonical categories ────────────────────────────────────────────────

export const CATEGORIES = [
  // ─── Food & Drink ────────────────────────────────────────────────────────
  { name: 'Restaurants & Dining',       slug: 'restaurant',   group: 'Food & Drink'       },
  { name: 'Coffee & Cafés',             slug: 'coffee',       group: 'Food & Drink'       },
  { name: 'Groceries',                  slug: 'supermarket',  group: 'Food & Drink'       },
  { name: 'Alcohol & Bars',             slug: 'cocktail',     group: 'Food & Drink'       },
  // ─── Getting Around ──────────────────────────────────────────────────────
  { name: 'Transport',                  slug: 'bus',          group: 'Getting Around'     },
  { name: 'Travel',                     slug: 'suitcase',     group: 'Getting Around'     },
  // ─── Health ──────────────────────────────────────────────────────────────
  { name: 'Health & Medical',           slug: 'ambulance',    group: 'Health'             },
  { name: 'Fitness & Sports',           slug: 'dumbbell',     group: 'Health'             },
  { name: 'Personal Care & Beauty',     slug: 'sunglasses',   group: 'Health'             },
  // ─── Home ────────────────────────────────────────────────────────────────
  { name: 'Housing & Rent',             slug: 'house',        group: 'Home'               },
  { name: 'Utilities',                  slug: 'lightning',    group: 'Home'               },
  { name: 'Home Maintenance & Repairs', slug: 'tools',        group: 'Home'               },
  { name: 'Pets',                       slug: 'dog',          group: 'Home'               },
  { name: 'Childcare & Kids',           slug: 'baby',         group: 'Home'               },
  // ─── Lifestyle ───────────────────────────────────────────────────────────
  { name: 'Entertainment',              slug: 'movie',        group: 'Lifestyle'          },
  { name: 'Streaming & Subscriptions',  slug: 'subscription', group: 'Lifestyle'          },
  { name: 'Gaming',                     slug: 'gamepad',      group: 'Lifestyle'          },
  { name: 'Books & Reading',            slug: 'book',         group: 'Lifestyle'          },
  { name: 'Shopping',                   slug: 'shopping-bag', group: 'Lifestyle'          },
  { name: 'Gifts & Occasions',          slug: 'gift',         group: 'Lifestyle'          },
  { name: 'Charity & Donations',        slug: 'heart',        group: 'Lifestyle'          },
  // ─── Finance ─────────────────────────────────────────────────────────────
  { name: 'Loans & Lending',            slug: 'handshake',    group: 'Finance'            },
  { name: 'Insurance',                  slug: 'insurance',    group: 'Finance'            },
  { name: 'Banking & Finance',          slug: 'bank',         group: 'Finance'            },
  { name: 'Investments',                slug: 'money',        group: 'Finance'            },
  { name: 'Government & Taxes',         slug: 'receipt',      group: 'Finance'            },
  // ─── Work ────────────────────────────────────────────────────────────────
  { name: 'Education',                  slug: 'book',         group: 'Work'               },
  { name: 'Office & Work Expenses',     slug: 'laptop',       group: 'Work'               },
  // ─── Income ──────────────────────────────────────────────────────────────
  { name: 'Salary & Income',            slug: 'money',        group: 'Income'             },
  { name: 'Freelance & Side Income',    slug: 'briefcase',    group: 'Income'             },
  { name: 'Rental Income',              slug: 'house',        group: 'Income'             },
] as const

export type CategoryName = typeof CATEGORIES[number]['name']
export type CategorySlug = typeof CATEGORIES[number]['slug']
export type CategoryGroup = typeof CATEGORIES[number]['group']

export type CategoryItem = {
  name: CategoryName
  slug: CategorySlug
  group: CategoryGroup
}

// Universal fallback — the coin image, always reachable
export const CATEGORY_FALLBACK_URL =
  'https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-S70eRKwGghbWrxnQFigJARrNiDgtR2.png&w=320&q=75'

// All old category names that may exist in the DB → canonical new name
export const LEGACY_CATEGORY_MAP: Record<string, CategoryName> = {
  'Rent':                'Housing & Rent',
  'Internet':            'Utilities',
  'Phone':               'Utilities',
  'Streaming':           'Streaming & Subscriptions',
  'Subscriptions':       'Streaming & Subscriptions',
  'Takeaway':            'Restaurants & Dining',
  'Fast Food':           'Restaurants & Dining',
  'Snacks':              'Restaurants & Dining',
  'Delivery':            'Restaurants & Dining',
  'Work Meals':          'Restaurants & Dining',
  'Restaurants':         'Restaurants & Dining',
  'Bakery & Sweets':     'Restaurants & Dining',
  'Coffee':              'Coffee & Cafés',
  'Ride-hailing':        'Transport',
  'Fuel':                'Transport',
  'Parking':             'Transport',
  'Public Transit':      'Transport',
  'Car Maintenance':     'Transport',
  'Flights':             'Travel',
  'Travel & Hotels':     'Travel',
  'Medical':             'Health & Medical',
  'Pharmacy':            'Health & Medical',
  'Mental Health':       'Health & Medical',
  'Wellness':            'Health & Medical',
  'Gym & Sports':        'Fitness & Sports',
  'Sports & Outdoors':   'Fitness & Sports',
  'Beauty & Personal':   'Personal Care & Beauty',
  'Events & Tickets':    'Entertainment',
  'Home & Furniture':    'Shopping',
  'Clothing':            'Shopping',
  'Electronics':         'Shopping',
  'Online Shopping':     'Shopping',
  'Hobbies':             'Shopping',
  'Books & Stationery':  'Books & Reading',
  'Gifts':               'Gifts & Occasions',
  'Home Services':       'Home Maintenance & Repairs',
  'Childcare':           'Childcare & Kids',
  'Loan Payments':       'Banking & Finance',
  'Taxes & Fees':        'Government & Taxes',
  'Software & Tools':    'Office & Work Expenses',
  'Office Supplies':     'Office & Work Expenses',
  'Freelance Expense':   'Office & Work Expenses',
  'Salary':              'Salary & Income',
  'Gift Received':       'Salary & Income',
  'Other Income':        'Salary & Income',
  'Refund':              'Salary & Income',
  'Freelance Income':    'Freelance & Side Income',
  'Bars & Nightlife':    'Alcohol & Bars',
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export const CATEGORY_GROUP_ORDER: CategoryGroup[] = [
  'Food & Drink',
  'Getting Around',
  'Health',
  'Home',
  'Lifestyle',
  'Finance',
  'Work',
  'Income',
]

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name)

export function getCategoryItem(name: string | null): CategoryItem | undefined {
  if (!name) return undefined
  const resolved = (name in LEGACY_CATEGORY_MAP)
    ? LEGACY_CATEGORY_MAP[name as keyof typeof LEGACY_CATEGORY_MAP]
    : name
  return CATEGORIES.find(c => c.name === resolved) as CategoryItem | undefined
}

export function getCategoriesByGroup(): Record<CategoryGroup, CategoryItem[]> {
  const result = {} as Record<CategoryGroup, CategoryItem[]>
  for (const g of CATEGORY_GROUP_ORDER) result[g] = []
  for (const cat of CATEGORIES) result[cat.group as CategoryGroup].push(cat as CategoryItem)
  return result
}
