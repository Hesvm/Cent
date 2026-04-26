export type CategoryGroup =
  | 'Food & Drink'
  | 'Housing & Bills'
  | 'Entertainment'
  | 'Transport'
  | 'Health & Fitness'
  | 'Shopping & Lifestyle'
  | 'Work & Finance'
  | 'Income'
  | 'Other';

export type CategoryItem = {
  name: string;
  slug: string;
  group: CategoryGroup;
  emoji: string;
  imagePath: string;
};

export const CATEGORIES: CategoryItem[] = [
  { name: 'Coffee',              slug: 'coffee',          group: 'Food & Drink',         emoji: '☕',  imagePath: '/categories/coffee.webp' },
  { name: 'Restaurants',        slug: 'restaurant',      group: 'Food & Drink',         emoji: '🍽️', imagePath: '/categories/restaurant.webp' },
  { name: 'Groceries',          slug: 'groceries',       group: 'Food & Drink',         emoji: '🛒',  imagePath: '/categories/groceries.webp' },
  { name: 'Takeaway',           slug: 'takeaway',        group: 'Food & Drink',         emoji: '🥡',  imagePath: '/categories/takeaway.webp' },
  { name: 'Alcohol & Bars',     slug: 'alcohol',         group: 'Food & Drink',         emoji: '🍺',  imagePath: '/categories/alcohol.webp' },
  { name: 'Snacks',             slug: 'snacks',          group: 'Food & Drink',         emoji: '🍿',  imagePath: '/categories/snacks.webp' },
  { name: 'Rent',               slug: 'rent',            group: 'Housing & Bills',      emoji: '🏠',  imagePath: '/categories/rent.webp' },
  { name: 'Utilities',          slug: 'utilities',       group: 'Housing & Bills',      emoji: '💡',  imagePath: '/categories/utilities.webp' },
  { name: 'Internet',           slug: 'internet',        group: 'Housing & Bills',      emoji: '📶',  imagePath: '/categories/internet.webp' },
  { name: 'Phone',              slug: 'phone',           group: 'Housing & Bills',      emoji: '📱',  imagePath: '/categories/phone.webp' },
  { name: 'Insurance',          slug: 'insurance',       group: 'Housing & Bills',      emoji: '🛡️', imagePath: '/categories/insurance.webp' },
  { name: 'Home Supplies',      slug: 'home-supplies',   group: 'Housing & Bills',      emoji: '🧹',  imagePath: '/categories/home-supplies.webp' },
  { name: 'Subscriptions',      slug: 'subscriptions',   group: 'Housing & Bills',      emoji: '🔄',  imagePath: '/categories/subscriptions.webp' },
  { name: 'Streaming',          slug: 'streaming',       group: 'Entertainment',        emoji: '📺',  imagePath: '/categories/streaming.webp' },
  { name: 'Gaming',             slug: 'gaming',          group: 'Entertainment',        emoji: '🎮',  imagePath: '/categories/gaming.webp' },
  { name: 'Music',              slug: 'music',           group: 'Entertainment',        emoji: '🎵',  imagePath: '/categories/music.webp' },
  { name: 'Books',              slug: 'books',           group: 'Entertainment',        emoji: '📚',  imagePath: '/categories/books.webp' },
  { name: 'Movies & Cinema',    slug: 'cinema',          group: 'Entertainment',        emoji: '🎬',  imagePath: '/categories/cinema.webp' },
  { name: 'Events & Tickets',   slug: 'tickets',         group: 'Entertainment',        emoji: '🎟️', imagePath: '/categories/tickets.webp' },
  { name: 'Public Transport',   slug: 'transport',       group: 'Transport',            emoji: '🚌',  imagePath: '/categories/transport.webp' },
  { name: 'Taxi & Rideshare',   slug: 'taxi',            group: 'Transport',            emoji: '🚕',  imagePath: '/categories/taxi.webp' },
  { name: 'Fuel',               slug: 'fuel',            group: 'Transport',            emoji: '⛽',  imagePath: '/categories/fuel.webp' },
  { name: 'Parking',            slug: 'parking',         group: 'Transport',            emoji: '🅿️', imagePath: '/categories/parking.webp' },
  { name: 'Car Insurance',      slug: 'car-insurance',   group: 'Transport',            emoji: '🚗',  imagePath: '/categories/car-insurance.webp' },
  { name: 'Flights',            slug: 'flights',         group: 'Transport',            emoji: '✈️', imagePath: '/categories/flights.webp' },
  { name: 'Doctor & Medical',   slug: 'medical',         group: 'Health & Fitness',     emoji: '🩺',  imagePath: '/categories/medical.webp' },
  { name: 'Pharmacy',           slug: 'pharmacy',        group: 'Health & Fitness',     emoji: '💊',  imagePath: '/categories/pharmacy.webp' },
  { name: 'Gym',                slug: 'gym',             group: 'Health & Fitness',     emoji: '🏋️', imagePath: '/categories/gym.webp' },
  { name: 'Sports',             slug: 'sports',          group: 'Health & Fitness',     emoji: '⚽',  imagePath: '/categories/sports.webp' },
  { name: 'Mental Health',      slug: 'mental-health',   group: 'Health & Fitness',     emoji: '🧠',  imagePath: '/categories/mental-health.webp' },
  { name: 'Clothing',           slug: 'clothing',        group: 'Shopping & Lifestyle', emoji: '👕',  imagePath: '/categories/clothing.webp' },
  { name: 'Electronics',        slug: 'electronics',     group: 'Shopping & Lifestyle', emoji: '💻',  imagePath: '/categories/electronics.webp' },
  { name: 'Beauty & Care',      slug: 'beauty',          group: 'Shopping & Lifestyle', emoji: '💄',  imagePath: '/categories/beauty.webp' },
  { name: 'Pets',               slug: 'pets',            group: 'Shopping & Lifestyle', emoji: '🐾',  imagePath: '/categories/pets.webp' },
  { name: 'Gifts',              slug: 'gifts',           group: 'Shopping & Lifestyle', emoji: '🎁',  imagePath: '/categories/gifts.webp' },
  { name: 'Hobbies',            slug: 'hobbies',         group: 'Shopping & Lifestyle', emoji: '🎨',  imagePath: '/categories/hobbies.webp' },
  { name: 'Travel',             slug: 'travel',          group: 'Shopping & Lifestyle', emoji: '🌍',  imagePath: '/categories/travel.webp' },
  { name: 'Software & Tools',   slug: 'software',        group: 'Work & Finance',       emoji: '⚙️', imagePath: '/categories/software.webp' },
  { name: 'Office Supplies',    slug: 'office',          group: 'Work & Finance',       emoji: '🖊️', imagePath: '/categories/office.webp' },
  { name: 'Freelance Expense',  slug: 'freelance',       group: 'Work & Finance',       emoji: '💼',  imagePath: '/categories/freelance.webp' },
  { name: 'Education',          slug: 'education',       group: 'Work & Finance',       emoji: '🎓',  imagePath: '/categories/education.webp' },
  { name: 'Taxes & Fees',       slug: 'taxes',           group: 'Work & Finance',       emoji: '🧾',  imagePath: '/categories/taxes.webp' },
  { name: 'Investments',        slug: 'investments',     group: 'Work & Finance',       emoji: '📈',  imagePath: '/categories/investments.webp' },
  { name: 'Loan Payments',      slug: 'loans',           group: 'Work & Finance',       emoji: '🏦',  imagePath: '/categories/loans.webp' },
  { name: 'Salary',             slug: 'salary',          group: 'Income',               emoji: '💰',  imagePath: '/categories/salary.webp' },
  { name: 'Freelance Income',   slug: 'freelance-income',group: 'Income',               emoji: '🤝',  imagePath: '/categories/freelance-income.webp' },
  { name: 'Refund',             slug: 'refund',          group: 'Income',               emoji: '↩️', imagePath: '/categories/refund.webp' },
  { name: 'Gift Received',      slug: 'gift-received',   group: 'Income',               emoji: '🎀',  imagePath: '/categories/gift-received.webp' },
  { name: 'Other Income',       slug: 'other-income',    group: 'Income',               emoji: '🪙',  imagePath: '/categories/other-income.webp' },
  { name: 'Other',              slug: 'other',           group: 'Other',                emoji: '📦',  imagePath: '/categories/other.webp' },
];
