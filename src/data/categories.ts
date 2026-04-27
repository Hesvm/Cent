export type CategoryGroup =
  | 'Food & Drink'
  | 'Transport & Travel'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Home & Life'
  | 'Shopping'
  | 'Finance'
  | 'Work & Education'
  | 'Income';

export type CategoryItem = {
  name: string;
  slug: string;
  group: CategoryGroup;
  emoji: string;
  imagePath: string;
};

export const CATEGORIES: CategoryItem[] = [
  // ── Food & Drink ─────────────────────────────────────────────────────────────
  { name: 'Restaurants & Dining',      slug: 'restaurants',      group: 'Food & Drink',       emoji: '🍽️', imagePath: '/categories/restaurants.webp' },
  { name: 'Coffee & Cafés',            slug: 'coffee',           group: 'Food & Drink',       emoji: '☕',  imagePath: '/categories/coffee.webp' },
  { name: 'Groceries',                 slug: 'groceries',        group: 'Food & Drink',       emoji: '🛒',  imagePath: '/categories/groceries.webp' },
  { name: 'Alcohol & Bars',            slug: 'alcohol',          group: 'Food & Drink',       emoji: '🍺',  imagePath: '/categories/alcohol.webp' },
  // ── Transport & Travel ───────────────────────────────────────────────────────
  { name: 'Transport',                 slug: 'transport',        group: 'Transport & Travel', emoji: '🚌',  imagePath: '/categories/transport.webp' },
  { name: 'Travel',                    slug: 'travel',           group: 'Transport & Travel', emoji: '✈️', imagePath: '/categories/travel.webp' },
  // ── Health & Wellness ────────────────────────────────────────────────────────
  { name: 'Health & Medical',          slug: 'health',           group: 'Health & Wellness',  emoji: '🩺',  imagePath: '/categories/health.webp' },
  { name: 'Fitness & Sports',          slug: 'fitness',          group: 'Health & Wellness',  emoji: '🏋️', imagePath: '/categories/fitness.webp' },
  { name: 'Personal Care & Beauty',    slug: 'beauty',           group: 'Health & Wellness',  emoji: '💄',  imagePath: '/categories/beauty.webp' },
  // ── Entertainment ────────────────────────────────────────────────────────────
  { name: 'Entertainment',             slug: 'entertainment',    group: 'Entertainment',      emoji: '🎬',  imagePath: '/categories/entertainment.webp' },
  { name: 'Streaming & Subscriptions', slug: 'streaming',        group: 'Entertainment',      emoji: '📺',  imagePath: '/categories/streaming.webp' },
  { name: 'Gaming',                    slug: 'gaming',           group: 'Entertainment',      emoji: '🎮',  imagePath: '/categories/gaming.webp' },
  { name: 'Books & Reading',           slug: 'books',            group: 'Entertainment',      emoji: '📚',  imagePath: '/categories/books.webp' },
  // ── Home & Life ──────────────────────────────────────────────────────────────
  { name: 'Housing & Rent',            slug: 'housing',          group: 'Home & Life',        emoji: '🏠',  imagePath: '/categories/housing.webp' },
  { name: 'Utilities',                 slug: 'utilities',        group: 'Home & Life',        emoji: '💡',  imagePath: '/categories/utilities.webp' },
  { name: 'Home Maintenance & Repairs',slug: 'home-maintenance', group: 'Home & Life',        emoji: '🔧',  imagePath: '/categories/home-maintenance.webp' },
  { name: 'Pets',                      slug: 'pets',             group: 'Home & Life',        emoji: '🐾',  imagePath: '/categories/pets.webp' },
  { name: 'Childcare & Kids',          slug: 'childcare',        group: 'Home & Life',        emoji: '👶',  imagePath: '/categories/childcare.webp' },
  // ── Shopping ─────────────────────────────────────────────────────────────────
  { name: 'Shopping',                  slug: 'shopping',         group: 'Shopping',           emoji: '🛍️', imagePath: '/categories/shopping.webp' },
  { name: 'Gifts & Occasions',         slug: 'gifts',            group: 'Shopping',           emoji: '🎁',  imagePath: '/categories/gifts.webp' },
  { name: 'Charity & Donations',       slug: 'charity',          group: 'Shopping',           emoji: '❤️', imagePath: '/categories/charity.webp' },
  // ── Finance ──────────────────────────────────────────────────────────────────
  { name: 'Insurance',                 slug: 'insurance',        group: 'Finance',            emoji: '🛡️', imagePath: '/categories/insurance.webp' },
  { name: 'Banking & Finance',         slug: 'banking',          group: 'Finance',            emoji: '🏦',  imagePath: '/categories/banking.webp' },
  { name: 'Investments',               slug: 'investments',      group: 'Finance',            emoji: '📈',  imagePath: '/categories/investments.webp' },
  { name: 'Government & Taxes',        slug: 'government',       group: 'Finance',            emoji: '🧾',  imagePath: '/categories/government.webp' },
  // ── Work & Education ─────────────────────────────────────────────────────────
  { name: 'Education',                 slug: 'education',        group: 'Work & Education',   emoji: '🎓',  imagePath: '/categories/education.webp' },
  { name: 'Office & Work Expenses',    slug: 'office',           group: 'Work & Education',   emoji: '💼',  imagePath: '/categories/office.webp' },
  // ── Income ───────────────────────────────────────────────────────────────────
  { name: 'Salary & Income',           slug: 'salary',           group: 'Income',             emoji: '💰',  imagePath: '/categories/salary.webp' },
  { name: 'Freelance & Side Income',   slug: 'freelance',        group: 'Income',             emoji: '🤝',  imagePath: '/categories/freelance.webp' },
  { name: 'Rental Income',             slug: 'rental-income',    group: 'Income',             emoji: '🏡',  imagePath: '/categories/rental-income.webp' },
];
