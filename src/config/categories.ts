// ─── 50 built-in categories, 8 groups ─────────────────────────────────────────

export type CategoryGroup =
  | 'Food & Drink'
  | 'Transport'
  | 'Shopping'
  | 'Health & Fitness'
  | 'Home & Life'
  | 'Entertainment & Lifestyle'
  | 'Work & Finance'
  | 'Income'

export interface CategoryItem {
  name: string
  group: CategoryGroup
  // CDN slug that maps to existing Vercel Blob images
  cdnSlug: string
}

export const CATEGORIES: CategoryItem[] = [
  // ── Food & Drink ────────────────────────────────────────────────────────────
  { name: 'Restaurants',       group: 'Food & Drink',              cdnSlug: 'restaurant'   },
  { name: 'Coffee & Cafes',    group: 'Food & Drink',              cdnSlug: 'coffee'        },
  { name: 'Groceries',         group: 'Food & Drink',              cdnSlug: 'supermarket'   },
  { name: 'Bars & Nightlife',  group: 'Food & Drink',              cdnSlug: 'cocktail'      },
  { name: 'Fast Food',         group: 'Food & Drink',              cdnSlug: 'burger'        },
  { name: 'Bakery & Sweets',   group: 'Food & Drink',              cdnSlug: 'pizza'         },
  { name: 'Delivery',          group: 'Food & Drink',              cdnSlug: 'shopping-bag'  },
  { name: 'Work Meals',        group: 'Food & Drink',              cdnSlug: 'restaurant'    },
  // ── Transport ───────────────────────────────────────────────────────────────
  { name: 'Ride-hailing',      group: 'Transport',                 cdnSlug: 'taxi'          },
  { name: 'Fuel',              group: 'Transport',                 cdnSlug: 'gas-station'   },
  { name: 'Parking',           group: 'Transport',                 cdnSlug: 'car'           },
  { name: 'Public Transit',    group: 'Transport',                 cdnSlug: 'bus'           },
  { name: 'Flights',           group: 'Transport',                 cdnSlug: 'airplane'      },
  { name: 'Car Maintenance',   group: 'Transport',                 cdnSlug: 'car'           },
  // ── Shopping ────────────────────────────────────────────────────────────────
  { name: 'Clothing',          group: 'Shopping',                  cdnSlug: 'sneakers'      },
  { name: 'Electronics',       group: 'Shopping',                  cdnSlug: 'laptop'        },
  { name: 'Home & Furniture',  group: 'Shopping',                  cdnSlug: 'house'         },
  { name: 'Books & Stationery',group: 'Shopping',                  cdnSlug: 'book'          },
  { name: 'Gifts',             group: 'Shopping',                  cdnSlug: 'gift'          },
  { name: 'Online Shopping',   group: 'Shopping',                  cdnSlug: 'shopping-bag'  },
  { name: 'Beauty & Personal', group: 'Shopping',                  cdnSlug: 'sunglasses'    },
  // ── Health & Fitness ────────────────────────────────────────────────────────
  { name: 'Gym & Sports',      group: 'Health & Fitness',          cdnSlug: 'dumbbell'      },
  { name: 'Medical',           group: 'Health & Fitness',          cdnSlug: 'ambulance'     },
  { name: 'Pharmacy',          group: 'Health & Fitness',          cdnSlug: 'ambulance'     },
  { name: 'Mental Health',     group: 'Health & Fitness',          cdnSlug: 'yoga'          },
  { name: 'Wellness',          group: 'Health & Fitness',          cdnSlug: 'yoga'          },
  // ── Home & Life ─────────────────────────────────────────────────────────────
  { name: 'Rent',              group: 'Home & Life',               cdnSlug: 'house'         },
  { name: 'Utilities',         group: 'Home & Life',               cdnSlug: 'lightning'     },
  { name: 'Home Services',     group: 'Home & Life',               cdnSlug: 'house'         },
  { name: 'Pets',              group: 'Home & Life',               cdnSlug: 'dog'           },
  { name: 'Childcare',         group: 'Home & Life',               cdnSlug: 'credit-card'   },
  { name: 'Insurance',         group: 'Home & Life',               cdnSlug: 'insurance'     },
  // ── Entertainment & Lifestyle ────────────────────────────────────────────────
  { name: 'Streaming',         group: 'Entertainment & Lifestyle', cdnSlug: 'subscription'  },
  { name: 'Gaming',            group: 'Entertainment & Lifestyle', cdnSlug: 'movie'         },
  { name: 'Events & Tickets',  group: 'Entertainment & Lifestyle', cdnSlug: 'movie'         },
  { name: 'Hobbies',           group: 'Entertainment & Lifestyle', cdnSlug: 'camera'        },
  { name: 'Travel & Hotels',   group: 'Entertainment & Lifestyle', cdnSlug: 'suitcase'      },
  { name: 'Sports & Outdoors', group: 'Entertainment & Lifestyle', cdnSlug: 'running'       },
  // ── Work & Finance ───────────────────────────────────────────────────────────
  { name: 'Software & Tools',  group: 'Work & Finance',            cdnSlug: 'laptop'        },
  { name: 'Office Supplies',   group: 'Work & Finance',            cdnSlug: 'book'          },
  { name: 'Freelance Expense', group: 'Work & Finance',            cdnSlug: 'wallet'        },
  { name: 'Education',         group: 'Work & Finance',            cdnSlug: 'book'          },
  { name: 'Taxes & Fees',      group: 'Work & Finance',            cdnSlug: 'receipt'       },
  { name: 'Investments',       group: 'Work & Finance',            cdnSlug: 'bank'          },
  { name: 'Loan Payments',     group: 'Work & Finance',            cdnSlug: 'bank'          },
  // ── Income ───────────────────────────────────────────────────────────────────
  { name: 'Salary',            group: 'Income',                    cdnSlug: 'money'         },
  { name: 'Freelance Income',  group: 'Income',                    cdnSlug: 'money'         },
  { name: 'Refund',            group: 'Income',                    cdnSlug: 'credit-card'   },
  { name: 'Gift Received',     group: 'Income',                    cdnSlug: 'gift'          },
  { name: 'Other Income',      group: 'Income',                    cdnSlug: 'wallet'        },
]

export const CATEGORY_GROUP_ORDER: CategoryGroup[] = [
  'Food & Drink',
  'Transport',
  'Shopping',
  'Health & Fitness',
  'Home & Life',
  'Entertainment & Lifestyle',
  'Work & Finance',
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
