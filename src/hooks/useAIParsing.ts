import { useState, useCallback, useRef } from 'react'
import type { ParsedExpense, ClarificationStep, TransactionType, Frequency } from '../types'

// ─── Persian / Arabic-Indic digit normalisation ───────────────────────────────

const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_INDIC   = '٠١٢٣٤٥٦٧٨٩'

function normalizeDigits(text: string): string {
  let out = ''
  for (const ch of text) {
    const ea = EASTERN_ARABIC.indexOf(ch)
    if (ea !== -1) { out += ea; continue }
    const ai = ARABIC_INDIC.indexOf(ch)
    if (ai !== -1) { out += ai; continue }
    out += ch
  }
  return out
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Per spec §4C / §11 implementation notes
const RECURRING_KEYWORDS = [
  'rent', 'salary', 'subscription', 'membership', 'insurance',
  'loan', 'mortgage', 'lease', 'stipend', 'allowance', 'retainer',
  'tuition', 'bill', 'installment',
]

// Maps keyword arrays → 31 canonical category names from guide
const CATEGORY_KEYWORDS: [string[], string][] = [
  [['pizza', 'pizzas', 'restaurant', 'restauratie', 'pizzeria', 'sushi', 'burger', 'burgers', 'kebab', 'kebabs', 'takeaway', 'takeout', 'food delivery', 'uber eats', 'deliveroo', 'thuisbezorgd', 'just eat', 'doordash', 'snackbar', 'diner', 'buffet', 'steakhouse', 'noodle', 'noodles', 'taco', 'tacos', 'bistro', 'eatery', 'dining', 'lunch', 'dinner', 'breakfast', 'brunch', 'grubhub', 'pasta', 'pastas', 'sandwich', 'sandwiches', 'wrap', 'wraps', 'falafel', 'ramen', 'pho', 'curry', 'thai', 'mexican', 'italian', 'chinese', 'french', 'spanish', 'indian', 'korean', 'japanese', 'vietnamese', 'meal', 'meals', 'food', 'foods', 'eating out', 'رستوران', 'غذا', 'ناهار', 'شام', 'صبحانه', 'فست‌فود', 'پیتزا', 'ساندویچ', 'کباب', 'سوشی'], 'Restaurants & Dining'],
  [['coffee', 'coffees', 'latte', 'lattes', 'espresso', 'americano', 'cappuccino', 'matcha', 'starbucks', 'café', 'cafe', 'cafes', 'bubble tea', 'smoothie bar', 'juice bar', 'koffie', 'flat white', 'costa', 'dutch bros', 'tim hortons', 'tea', 'teas', 'chai', 'mocha', 'coffee shop', 'cafe shop', 'tea shop', 'juice', 'juices', 'smoothie', 'smoothies', 'hot chocolate', 'cocoa', 'قهوه', 'کافه', 'چای', 'کافی‌شاپ', 'نسکافه', 'اسپرسو'], 'Coffee & Cafés'],
  [['grocery', 'groceries', 'supermarket', 'supermarkten', 'albert heijn', 'lidl', 'aldi', 'jumbo', 'whole foods', 'trader joe', 'kroger', 'picnic', 'hellofresh', 'gorillas', 'getir', 'boodschappen', 'fresh market', 'market', 'markets', 'shopping', 'shop', 'shops', 'store', 'stores', 'food store', 'food shops', 'grocery store', 'supermarkt', 'winkel', 'kruidenierszaak', 'سوپر', 'میوه', 'سبزی', 'گوشت', 'مرغ', 'ماهی', 'نانوایی', 'لبنیات', 'خواربار'], 'Groceries'],
  [['bar', 'bars', 'pub', 'pubs', 'kroeg', 'kroegen', 'nightclub', 'nightclubs', 'gall & gall', 'wine shop', 'brewery', 'breweries', 'cocktail bar', 'cocktail bars', 'bottle shop', 'beer', 'beers', 'wine', 'wines', 'whiskey', 'vodka', 'alcohol', 'alcoholic', 'liquor', 'liquors', 'drinking', 'drink', 'drinks', 'مشروب'], 'Alcohol & Bars'],
  [['bus', 'buses', 'taxi', 'taxis', 'metro', 'tram', 'gvb', 'ret', 'htm', 'ns kaartje', 'bus ticket', 'transit', 'commuter rail', 'lime scooter', 'scooter', 'scooters', 'tier', 'ev charging', 'benzine', 'petrol', 'shell', 'bp', 'uber', 'lyft', 'ride', 'rides', 'ride share', 'car', 'cars', 'train', 'trains', 'subway', 'underground', 'tube', 'bike', 'bikes', 'cycling', 'cycle', 'motorbike', 'motorcycle', 'moto', 'gas station', 'fuel', 'gas', 'transportation', 'تاکسی', 'اتوبوس', 'مترو', 'قطار', 'پرواز', 'بلیط', 'کرایه', 'اوبر'], 'Transport'],
  [['klm', 'ryanair', 'easyjet', 'booking.com', 'booking', 'airbnb', 'hotel', 'hotels', 'flight', 'flights', 'airplane', 'airfare', 'eurostar', 'car rental', 'rental car', 'hertz', 'avis', 'hostel', 'hostels', 'luggage', 'thalys', 'cruise', 'cruises', 'resort', 'resorts', 'vacation', 'vacations', 'trip', 'trips', 'travel', 'travelling', 'holiday', 'holidays', 'tour', 'tours', 'tourism', 'airport', 'plane', 'planes', 'vliegticket', 'ticket', 'tickets', 'reservations', 'هتل', 'سفر', 'گردش', 'توریست', 'اقامت', 'هاستل'], 'Travel'],
  [['huisarts', 'dokter', 'doctors', 'dentist', 'dentists', 'tandarts', 'apotheek', 'apotheken', 'pharmacy', 'pharmacies', 'physio', 'physiotherapy', 'optician', 'zorgverzekering', 'vitamins', 'vitamin', 'supplement', 'supplements', 'hospital', 'hospitals', 'ziekenhuis', 'therapist', 'therapy', 'prescription', 'prescriptions', 'blood test', 'test', 'tests', 'health insurance', 'gp', 'nhs', 'clinic', 'clinics', 'specsavers', 'medical', 'medicine', 'medicines', 'doctor visit', 'check-up', 'checkup', 'surgery', 'دارو', 'دکتر', 'بیمارستان', 'درمان', 'داروخانه', 'ویزیت', 'آزمایش'], 'Health & Medical'],
  [['gym', 'gyms', 'basic-fit', 'yoga', 'crossfit', 'pilates', 'personal trainer', 'trainer', 'trainers', 'sports club', 'club', 'clubs', 'swimming', 'swim', 'peloton', 'strava', 'marathon', 'fitness', 'fitness app', 'puregym', 'anytime fitness', 'equinox', 'boxing', 'athletic', 'athletics', 'workout', 'workouts', 'exercise', 'exercises', 'sport', 'sports', 'training', 'train', 'running', 'run', 'jogging', 'jog', 'cycling', 'bike', 'biking', 'tennis', 'badminton', 'football', 'soccer', 'basketball', 'volleyball', 'climbing', 'hiking', 'ورزش', 'باشگاه', 'یوگا', 'شنا', 'دویدن'], 'Fitness & Sports'],
  [['kapper', 'haircut', 'haircuts', 'nail salon', 'nail', 'nails', 'spa', 'spas', 'massage', 'massages', 'barber', 'barbers', 'beauty salon', 'salon', 'salons', 'skincare', 'skin care', 'cosmetics', 'cosmetic', 'waxing', 'wax', 'parfum', 'perfume', 'sephora', 'lush', 'tanning salon', 'tanning', 'eyebrow', 'eyebrows', 'threading', 'makeup', 'hair', 'hairdo', 'grooming', 'groom', 'beauty', 'treatment', 'treatments', 'pedicure', 'manicure', 'آرایشگاه', 'سلمانی', 'آرایش', 'بهداشت', 'صابون', 'شامپو'], 'Personal Care & Beauty'],
  [['cinema', 'cinemas', 'pathé', 'concert', 'concerts', 'theater', 'theatre', 'festival', 'festivals', 'ticketmaster', 'escape room', 'escape rooms', 'bowling', 'comedy', 'comedy show', 'pretpark', 'karaoke', 'cineworld', 'odeon', 'imax', 'eventbrite', 'amusement park', 'amusement parks', 'mini golf', 'minigolf', 'arcade', 'arcades', 'show', 'shows', 'show ticket', 'event ticket', 'event', 'events', 'entertainment', 'movie', 'movies', 'film', 'films', 'play', 'plays', 'musical', 'musicals', 'stand-up', 'ticket', 'tickets', 'سینما', 'تئاتر', 'موسیقی', 'کنسرت', 'تفریح', 'بازی'], 'Entertainment'],
  [['netflix', 'spotify', 'disney+', 'hbo max', 'apple tv', 'apple music', 'amazon prime video', 'tidal', 'deezer', 'icloud', 'google one', 'youtube premium', 'hulu', 'crunchyroll', 'peacock', 'adobe creative cloud', 'nyt subscription', 'streaming', 'subscription', 'subscriptions', 'subscribe', 'subscription service', 'music streaming', 'video streaming', 'audio streaming', 'premium membership', 'membership', 'memberships', 'monthly subscription', 'annual subscription', 'اشتراک', 'عضویت'], 'Streaming & Subscriptions'],
  [['steam', 'playstation store', 'xbox', 'nintendo', 'in-app purchase', 'game pass', 'ps plus', 'ea play', 'twitch sub', 'epic games', 'gaming gear', 'psn', 'video game', 'game', 'games', 'gaming', 'gaming console', 'console', 'playstation', 'ps4', 'ps5', 'xbox one', 'switch', 'game purchase', 'in-game purchase', 'dlc', 'expansion pack', 'mod', 'بازی'], 'Gaming'],
  [['audible', 'kindle', 'bookstore', 'boekhandel', 'ebook', 'ebooks', 'magazine', 'magazines', 'audiobook', 'audiobooks', 'waterstones', 'library', 'newspaper subscription', 'book', 'books', 'reading', 'novel', 'novels', 'story', 'stories', 'fiction', 'non-fiction', 'author', 'authors', 'publication', 'کتاب'], 'Books & Reading'],
  [['huur', 'huren', 'rent', 'rents', 'hypotheek', 'mortgage', 'mortgages', 'landlord', 'storage unit', 'hoa', 'moving company', 'lease payment', 'tenancy', 'lease', 'leasing', 'apartment', 'apartments', 'house', 'houses', 'flat', 'flats', 'condo', 'condos', 'housing', 'home rental', 'rental', 'housing payment', 'اجاره', 'رهن', 'خانه', 'آپارتمان', 'شارژ', 'مسکن', 'ودیعه'], 'Housing & Rent'],
  [['electricity', 'electric bill', 'water bill', 'gas bill', 'internet bill', 'phone bill', 'utilities', 'utility', 'wifi', 'broadband', 'gemeentebelasting', 'vattenfall', 'nuon', 'kpn', 't-mobile', 'ziggo', 'octopus energy', 'mobile contract', 'bill', 'bills', 'electric', 'water', 'gas', 'internet', 'phone', 'mobile', 'utility bill', 'monthly bill', 'energy bill', 'برق', 'آب', 'گاز', 'اینترنت', 'قبض'], 'Utilities'],
  [['plumber', 'plumbing', 'loodgieter', 'electrician', 'electric', 'handyman', 'cleaning service', 'schoonmaak', 'painter', 'painting', 'renovation', 'renovations', 'garden service', 'gardening', 'pest control', 'hvac', 'locksmith', 'home repair', 'home repairs', 'maintenance', 'fix', 'fixing', 'repair', 'repairs', 'improvement', 'improvements', 'remodel', 'remodeling', 'تعمیر', 'نقاشی', 'نظافت', 'باغبان', 'سرویس'], 'Home Maintenance & Repairs'],
  [['vet', 'vets', 'veterinarian', 'dierenarts', 'dog food', 'cat food', 'pet shop', 'pet shops', 'pet grooming', 'grooming', 'pet supplies', 'supplies', 'pet store', 'pet stores', 'boarding', 'doggy daycare', 'petplan', 'pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals', 'pet care', 'animal care', 'حیوان', 'سگ', 'گربه', 'دامپزشک'], 'Pets'],
  [['kinderopvang', 'daycare', 'daycares', 'babysitter', 'babysitting', 'school fee', 'school fees', 'kindergarten', 'childcare', 'childcare services', 'baby supplies', 'nanny', 'kids activity', 'activities', 'kid', 'kids', 'child', 'children', 'baby', 'babies', 'children activity', 'preschool', 'school', 'بچه', 'کودک', 'اسباب‌بازی', 'پوشک', 'شیر'], 'Childcare & Kids'],
  [['zalando', 'zara', 'h&m', 'bol.com', 'ikea', 'mediamarkt', 'coolblue', 'primark', 'uniqlo', 'asos', 'amazon', 'ebay', 'etsy', 'aliexpress', 'online shopping', 'shopping', 'shop', 'shops', 'clothing', 'clothes', 'shoes', 'shoe', 'sneakers', 'furniture', 'electronics', 'electronics store', 'clothing store', 'clothes shop', 'watch', 'watches', 'phone', 'phones', 'laptop', 'laptops', 'headphones', 'headphone', 'jacket', 'jackets', 'dress', 'dresses', 'shirt', 'shirts', 'pants', 'jeans', 'skirt', 'skirts', 'sweater', 'sweaters', 'coat', 'coats', 'boots', 'sandals', 'bag', 'bags', 'handbag', 'handbags', 'accessories', 'accessory', 'home goods', 'household', 'kitchen', 'bed', 'bedding', 'tools', 'tool', 'خرید', 'مغازه', 'بازار', 'فروشگاه', 'پوشاک', 'لباس', 'کفش'], 'Shopping'],
  [['gift', 'gifts', 'cadeau', 'cadeaus', 'birthday present', 'birthday presents', 'gift card', 'gift cards', 'flowers for someone', 'flowers', 'wedding gift', 'wedding gifts', 'celebration dinner', 'present', 'presents', 'occasion', 'occasions', 'special occasion', 'celebration', 'celebrations', 'birthday', 'anniversary', 'wedding', 'anniversaries', 'party', 'parties', 'هدیه', 'کمک', 'خیریه', 'صدقه'], 'Gifts & Occasions'],
  [['donation', 'donations', 'donate', 'donatie', 'charity', 'charities', 'ngo', 'ngos', 'gofundme', 'fundraiser', 'fundraisers', 'church', 'crowdfunding', 'oxfam', 'red cross', 'sponsoring', 'sponsor', 'sponsorship', 'charitable', 'cause', 'causes', 'relief', 'aid', 'helping', 'help', 'خیریه', 'نذر', 'موقوفه'], 'Charity & Donations'],
  [['lend', 'lent', 'borrow', 'borrowed', 'owe', 'owed', 'iou', 'paid back', 'pay back', 'paying back', 'loan to', 'loaned', 'money to', 'money from', 'schuld', 'schuldig', 'geleend', 'geleend van', 'geleend aan', 'geld geleend', 'teruggeven', 'terug betaald', 'loan', 'loans', 'borrowing', 'lending', 'lender', 'borrower', 'debt', 'debts', 'owe money', 'owe someone', 'قرض', 'بدهی', 'وام'], 'Loans & Lending'],
  [['centraal beheer', 'car insurance', 'home insurance', 'anwb', 'verzekering', 'liability', 'pet insurance', 'contents insurance', 'life insurance', 'travel insurance policy', 'bupa', 'aviva', 'insurance premium', 'insurance', 'insurances', 'insure', 'insured', 'coverage', 'policy', 'policies', 'premium', 'premiums', 'claim', 'claims', 'بیمه'], 'Insurance'],
  [['bank fee', 'bank fees', 'atm fee', 'atm fees', 'overdraft', 'overdrafts', 'currency exchange', 'credit card fee', 'credit card fees', 'loan interest', 'bank kosten', 'wire fee', 'kosten rekening', 'transaction fee', 'transaction fees', 'bank', 'banks', 'banking', 'bank account', 'account', 'accounts', 'credit card', 'debit card', 'account fee', 'account fees', 'service fee', 'service fees', 'بانک'], 'Banking & Finance'],
  [['degiro', 'etoro', 'crypto', 'bitcoin', 'cryptocurrencies', 'etf', 'etfs', 'bux', 'brokerage', 'brokerages', 'aandelen', 'investment', 'investments', 'invest', 'investing', 'pension contribution', 'robinhood', 'vanguard', 'trading 212', 'freetrade', 'coinbase', 'revolut invest', 'stock', 'stocks', 'share', 'shares', 'trading', 'trade', 'portfolio', 'investor', 'fund', 'funds', 'سهام', 'بورس', 'سرمایه', 'صندوق'], 'Investments'],
  [['belastingdienst', 'income tax', 'boete', 'passport fee', 'government fee', 'btw', 'vat', 'council tax', 'hmrc', 'municipality fine', 'belasting', 'traffic fine', 'tax', 'taxes', 'taxing', 'fee', 'fees', 'fine', 'fines', 'government', 'municipal', 'municipality', 'tax return', 'tax filing', 'penalty', 'penalties', 'مالیات', 'عوارض', 'جریمه'], 'Government & Taxes'],
  [['coursera', 'udemy', 'masterclass', 'duolingo', 'babbel', 'tuition', 'tuitions', 'cursus', 'textbook', 'textbooks', 'exam fee', 'exam fees', 'tutoring', 'tutoring service', 'linkedin learning', 'skillshare', 'codecademy', 'workshop', 'workshops', 'certification', 'certifications', 'university course', 'course', 'courses', 'class', 'classes', 'training', 'trainings', 'lesson', 'lessons', 'school', 'education', 'learning', 'learn', 'university', 'college', 'academy', 'کتاب', 'دانشگاه', 'مدرسه', 'آموزش', 'دوره', 'کلاس'], 'Education'],
  [['coworking', 'office supplies', 'office supply', 'kantoor', 'stationery', 'business software', 'postage', 'work laptop', 'wework', 'regus', 'notion', 'figma', 'github', 'slack', 'zoom', 'aws', 'google workspace', 'microsoft 365', 'vercel', 'supabase', 'office', 'offices', 'work', 'work space', 'workspace', 'desk', 'desks', 'chair', 'chairs', 'pen', 'pens', 'paper', 'notebook', 'notebooks', 'paper clip', 'tape', 'business', 'software', 'computer', 'computers', 'شرکت', 'اداری', 'دفتر'], 'Office & Work Expenses'],
  [['salaris', 'salary', 'salaries', 'loon', 'lonen', 'payroll', 'wages', 'wage', 'paycheck', 'paychecks', 'freelance payment received', 'freelance payment', 'invoice paid', 'employment income', 'employment', 'employer', 'work', 'job', 'jobs', 'income', 'incomes', 'earned', 'earning', 'earnings', 'bonus', 'bonuses', 'salary payment', 'wage payment', 'monthly salary', 'annual salary', 'hiring', 'حقوق', 'درآمد', 'دستمزد', 'پاداش'], 'Salary & Income'],
  [['fiverr', 'upwork', 'marktplaats', 'vinted', 'freelance', 'freelancers', 'freelance project', 'freelance projects', 'side income', 'side gig', 'side gigs', 'sold item', 'sold items', 'gig pay', 'gig work', 'client payment', 'client payments', 'stripe payout', 'stripe payouts', 'ebay income', 'ebay', 'etsy income', 'etsy', 'selling', 'sell', 'selling items', 'reselling', 'resale', 'project payment', 'contractor', 'contractors', 'contract work', 'task work', 'task payment', 'freelancing', 'consulting', 'consultant', 'independent contractor', 'پروژه', 'فریلنس'], 'Freelance & Side Income'],
  [['airbnb payout', 'airbnb payouts', 'huurinkomsten', 'rental income', 'room rent received', 'room rental', 'property income', 'airbnb host', 'airbnb', 'property rental', 'rental property', 'rent received', 'rental payout', 'tenant payment', 'landlord income', 'lease income', 'housing rental income', 'درآمد'], 'Rental Income'],
]

const FREQUENCY_KEYWORDS: [string[], Frequency][] = [
  [['daily', 'every day', 'each day', 'per day'], 'daily'],
  [['weekly', 'every week', 'each week', 'per week'], 'weekly'],
  [['monthly', 'every month', 'each month', 'per month'], 'monthly'],
  [['yearly', 'annual', 'annually', 'per year', 'every year'], 'yearly'],
]

// Words that signal this is a question/command, not an expense (§2E)
const QUESTION_PATTERNS = [
  /^(how|what|where|when|why|who)\b/i,
  /^(show|tell|help|give|list|find|get|can you|could you|please show)\b/i,
  /^(what'?s|how much|how many)\b/i,
  /\?$/,
]

// Income signal words (§3B)
const INCOME_KEYWORDS = [
  'salary', 'income', 'received', 'got paid', 'payment from', 'freelance',
  'refund', 'cashback', 'reimbursed', 'earned', 'bonus', 'dividend',
  'returned', 'got back', 'money back', 'deposit',
]

// Refund signal words (§10A)
const REFUND_KEYWORDS = ['refund', 'return', 'got back', 'money back', 'reimbursed', 'returned shoes', 'returned item']

// Large amount threshold (§1E)
const LARGE_AMOUNT_THRESHOLD = 10000

// ─── Word-number parsing (§9A) ────────────────────────────────────────────────

const WORD_NUM_PATTERNS: [RegExp, number][] = [
  [/\ba?\s*grand\b/i, 1000],
  [/\ba?\s*thousand\b/i, 1000],
  [/\bcouple\s*(hundred|hundo)\b/i, 200],
  [/\ba?\s*hundred\b/i, 100],
  [/\bninety\b/i, 90], [/\beighty\b/i, 80], [/\bseventy\b/i, 70],
  [/\bsixty\b/i, 60], [/\bfifty\b/i, 50], [/\bforty\b/i, 40],
  [/\bthirty\b/i, 30], [/\btwenty\b/i, 20],
  [/\bnineteen\b/i, 19], [/\beighteen\b/i, 18], [/\bseventeen\b/i, 17],
  [/\bsixteen\b/i, 16], [/\bfifteen\b/i, 15], [/\bfourteen\b/i, 14],
  [/\bthirteen\b/i, 13], [/\btwelve\b/i, 12], [/\beleven\b/i, 11],
  [/\bten\b/i, 10], [/\bnine\b/i, 9], [/\beight\b/i, 8],
  [/\bseven\b/i, 7], [/\bsix\b/i, 6], [/\bfive\b/i, 5],
  [/\bfour\b/i, 4], [/\bthree\b/i, 3], [/\btwo\b/i, 2], [/\bone\b/i, 1],
]

function parseWordNumber(text: string): { value: number; confidence: number } | null {
  const lower = text.toLowerCase()

  // "a few" / "some" → too vague
  if (/\ba few\b|\bsome\b|\bseveral\b/.test(lower)) return { value: 0, confidence: 0.15 }

  // "forty-nine ninety-nine" style
  const compoundDecimal = lower.match(/\b(forty|fifty|sixty|seventy|eighty|ninety)?[-\s]?(one|two|three|four|five|six|seven|eight|nine)?\s+(ninety|eighty|seventy|sixty|fifty|forty|thirty|twenty)?[-\s]?(one|two|three|four|five|six|seven|eight|nine)\b/)
  if (compoundDecimal) {
    // too complex, low confidence
    return { value: 0, confidence: 0.3 }
  }

  for (const [pattern, value] of WORD_NUM_PATTERNS) {
    if (pattern.test(lower)) {
      // "couple hundred" is medium confidence; specific numbers are high
      const confidence = value === 200 && lower.includes('couple') ? 0.6 : 0.75
      return { value, confidence }
    }
  }
  return null
}

// ─── Local parser ─────────────────────────────────────────────────────────────

// Compound phrases that override single-keyword matches — checked before the main loop.
// Prevents e.g. "bar" inside "protein bar" from matching Alcohol & Bars.
const COMPOUND_OVERRIDES: [string[], string][] = [
  [['protein bar', 'energy bar', 'granola bar', 'cereal bar', 'snack bar', 'nutrition bar', 'power bar'], 'Groceries'],
  [['bar exam', 'bar association', 'crowbar', 'sidebar', 'toolbar', 'handlebar', 'rebar'], 'null'],
  [['paid back', 'pay back', 'paying back'], 'Loans & Lending'],
  // Persian multi-word phrases
  [['قرض دادن', 'قرض گرفتن', 'قرض به', 'قرض از'], 'Loans & Lending'],
  [['خرید خواربار', 'خرید مواد غذایی'], 'Groceries'],
  [['درآمد اجاره', 'اجاره دریافتی'], 'Rental Income'],
  [['ارز دیجیتال', 'بیت کوین', 'کریپتو'], 'Investments'],
  [['مهد کودک', 'مدرسه بچه'], 'Childcare & Kids'],
  [['بیمه ماشین', 'بیمه درمان', 'بیمه عمر'], 'Insurance'],
  [['کافی شاپ', 'کافه قهوه'], 'Coffee & Cafés'],
  [['فست فود', 'فست‌فود'], 'Restaurants & Dining'],
  [['اجاره خانه', 'اجاره ماهانه'], 'Housing & Rent'],
  [['خرید لباس', 'خرید کفش', 'خرید پوشاک'], 'Shopping'],
  [['بلیط هواپیما', 'بلیط قطار', 'بلیط اتوبوس'], 'Transport'],
  [['حق عضویت', 'حق اشتراک'], 'Streaming & Subscriptions'],
  [['پول پس دادن', 'برگشت پول'], 'Loans & Lending'],
]

export function inferCategory(text: string): { category: string | null; confidence: number } {
  const lower = text.toLowerCase()

  for (const [phrases, cat] of COMPOUND_OVERRIDES) {
    if (phrases.some((p) => lower.includes(p))) {
      return { category: cat === 'null' ? null : cat, confidence: cat === 'null' ? 0 : 0.9 }
    }
  }

  for (const [kws, cat] of CATEGORY_KEYWORDS) {
    if (kws.some((kw) => lower.includes(kw))) {
      return { category: cat, confidence: 0.85 }
    }
  }
  return { category: null, confidence: 0 }
}

function localParse(text: string, type: TransactionType): ParsedExpense & { hasRecurringSignal: boolean; isNegative: boolean; rawText: string } {
  text = normalizeDigits(text)
  const lower = text.toLowerCase().trim()

  // ── Negative / refund amount (§1D, §10A) ─────────────────────────────────
  const isNegative = /minus\s*\d|-\s*\$?\d|\$?-\s*\d|negative\s+\d/.test(lower)
  const isRefund = REFUND_KEYWORDS.some((k) => lower.includes(k))
  const detectedType: TransactionType =
    isNegative || isRefund || INCOME_KEYWORDS.some((k) => lower.includes(k)) ? 'income' : type

  // ── Amount extraction ──────────────────────────────────────────────────────
  // Strip leading minus for parsing
  const textForAmount = lower.replace(/^-\s*/, '').replace(/minus\s+/, '')

  // Try numeric amount first
  const numericMatch = textForAmount.match(/\$?([\d,]+(?:\.\d{1,2})?)/)
  let amount: number | null = null
  let amountConf = 0

  if (numericMatch) {
    amount = parseFloat(numericMatch[1].replace(/,/g, ''))
    amountConf = amount > 0 ? 0.95 : 0.1 // zero → low confidence (maybe "free")
  } else {
    // Try word numbers
    const wordNum = parseWordNumber(textForAmount)
    if (wordNum && wordNum.value > 0) {
      amount = wordNum.value
      amountConf = wordNum.confidence
    }
  }

  // ── Frequency extraction ───────────────────────────────────────────────────
  // ONLY mark high-confidence when frequency is EXPLICITLY stated (§4B)
  let frequency: Frequency = 'none'
  let freqConf = 0.99 // "none" with high confidence by default
  let nameWithoutFreq = lower

  for (const [kws, freq] of FREQUENCY_KEYWORDS) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        frequency = freq
        freqConf = 0.95
        nameWithoutFreq = nameWithoutFreq.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '').trim()
        break
      }
    }
    if (frequency !== 'none') break
  }

  // Check for recurring SIGNAL (§4C) — but do NOT auto-assign frequency
  const hasRecurringSignal = frequency === 'none' &&
    RECURRING_KEYWORDS.some((k) => lower.includes(k))

  // ── Name extraction ────────────────────────────────────────────────────────
  let withoutAmount = nameWithoutFreq
    .replace(/\$?([\d,]+(?:\.\d{1,2})?)/, ' ')
    .replace(/\b(minus|negative|plus)\b/gi, '')
    .trim()

  const fillerWords = /\b(for|on|at|a|an|the|i|spent|paid|bought|got|had|used|from|my|some)\b/gi
  const rawName = withoutAmount.replace(fillerWords, ' ').replace(/\s+/g, ' ').trim()

  const name = rawName && rawName.length > 1
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : null
  const nameConf = name && name.length > 1 ? 0.85 : 0

  // ── Category inference ─────────────────────────────────────────────────────
  const { category, confidence: catConf } = inferCategory(lower)
  const finalCategory = type === 'income' && !category ? 'Salary & Income' : category

  return {
    name,
    amount,
    type: detectedType,
    category: finalCategory,
    frequency,
    tags: [],
    confidence: {
      name: nameConf,
      amount: amountConf,
      category: catConf,
      frequency: freqConf,
    },
    hasRecurringSignal,
    isNegative,
    rawText: text,
  }
}

function isLocalConfident(p: ParsedExpense): boolean {
  return p.confidence.amount >= 0.9 && p.confidence.name >= 0.85
}

// ─── Clarification queue builder (spec §CLARIFICATION QUEUE) ─────────────────

function buildClarificationQueue(
  parsed: ParsedExpense,
  userSelectedType: TransactionType,
  hasRecurringSignal: boolean,
): ClarificationStep[] {
  const steps: ClarificationStep[] = []

  // [1] AMOUNT — ask if missing or very low confidence
  if (parsed.amount === null || parsed.confidence.amount < 0.5) {
    const question = parsed.name ? `How much was ${parsed.name}?` : 'How much was this?'
    steps.push({ field: 'amount', question, options: null })
  } else if (parsed.amount === 0) {
    // §1C — zero amount: free or forgot?
    steps.push({
      field: 'amount',
      question: 'Amount is $0 — is this free or did you forget?',
      options: [
        { id: 1, label: 'It was free ($0)', value: '0' },
        { id: 2, label: 'Let me enter the amount', value: '__ask__' },
      ],
    })
  } else if (parsed.amount > LARGE_AMOUNT_THRESHOLD) {
    // §1E — very large amount: extra confirmation
    steps.push({
      field: 'amount',
      question: `Just confirming — $${parsed.amount.toLocaleString()} for ${parsed.name ?? 'this'}?`,
      options: [
        { id: 1, label: "Yes, that's right", value: String(parsed.amount) },
        { id: 2, label: 'No, let me re-enter', value: '__ask__' },
      ],
    })
  }

  // [2] NAME — ask if missing or very low confidence
  if (!parsed.name || parsed.confidence.name < 0.5) {
    const amountLabel = parsed.amount && parsed.amount > 0
      ? `$${parsed.amount.toLocaleString()}`
      : 'this'
    steps.push({
      field: 'name',
      question: `What was the ${amountLabel} for?`,
      options: null,
    })
  }

  // [3] TYPE — ask if ambiguous and user hasn't explicitly toggled (§3C, §3E)
  // The user's toggle IS their selection — only ask if type is truly unclear
  // In practice: we trust the toggle selection passed as `userSelectedType`
  // but if API detected a different type with high confidence, surface it
  if (parsed.type && parsed.type !== userSelectedType && parsed.confidence.name < 0.7) {
    // Only ask if it's genuinely ambiguous — both signals present
    const looksLikeIncome = INCOME_KEYWORDS.some(k => (parsed.name ?? '').toLowerCase().includes(k))
    if (looksLikeIncome && userSelectedType === 'expense') {
      steps.push({
        field: 'type',
        question: 'Is this an expense or income?',
        options: [
          { id: 1, label: 'Expense (money out)', value: 'expense' },
          { id: 2, label: 'Income (money in)', value: 'income' },
        ],
      })
    }
  }

  // [4] FREQUENCY — ONLY ask if recurring signal AND frequency not explicitly stated (§4C)
  // hasRecurringSignal = recurring keyword in name but no explicit frequency word
  if (hasRecurringSignal && parsed.confidence.frequency >= 0.99) {
    // frequency is 'none' with high default confidence → recurring keyword triggered
    steps.push({
      field: 'frequency',
      question: 'Is this a recurring payment?',
      options: [
        { id: 1, label: 'Monthly', value: 'monthly' },
        { id: 2, label: 'Weekly', value: 'weekly' },
        { id: 3, label: 'No', value: 'none' },
      ],
    })
  } else if (parsed.frequency !== 'none' && parsed.confidence.frequency < 0.8) {
    // Frequency was detected but with low confidence → confirm
    steps.push({
      field: 'frequency',
      question: 'Is this a frequent expense?',
      options: [
        { id: 1, label: 'Monthly', value: 'monthly' },
        { id: 2, label: 'Weekly', value: 'weekly' },
        { id: 3, label: 'No', value: 'none' },
      ],
    })
  }

  // [5] CATEGORY — never ask. Always use best guess or default 'Other'.
  // Category is an internal field the user can edit after logging.

  // No confirm step — save fires automatically when queue is exhausted.

  return steps
}

// ─── State types ──────────────────────────────────────────────────────────────

export interface CollectedData {
  name: string | null
  amount: number | null
  type: TransactionType
  category: string | null
  frequency: Frequency
}

interface UseAIParsingResult {
  isParsing: boolean
  parseError: string | null
  notExpense: boolean                 // true if input was a question/command
  clarificationQueue: ClarificationStep[]
  currentStepIndex: number
  collectedData: CollectedData
  parse: (text: string, type: TransactionType) => Promise<void>
  answerStep: (value: string) => void
  reset: () => void
}

const DEFAULT_DATA: CollectedData = {
  name: null,
  amount: null,
  type: 'expense',
  category: null,
  frequency: 'none',
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAIParsing(): UseAIParsingResult {
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [notExpense, setNotExpense] = useState(false)
  const [clarificationQueue, setClarificationQueue] = useState<ClarificationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [collectedData, setCollectedData] = useState<CollectedData>({ ...DEFAULT_DATA })
  // Keep original text for recurring-keyword check after API parse
  const originalTextRef = useRef('')

  const reset = useCallback(() => {
    setIsParsing(false)
    setParseError(null)
    setNotExpense(false)
    setClarificationQueue([])
    setCurrentStepIndex(0)
    setCollectedData({ ...DEFAULT_DATA })
    originalTextRef.current = ''
  }, [])

  const parse = useCallback(async (text: string, type: TransactionType) => {
    if (!text.trim()) return

    // §2E — Detect question/command inputs before doing any parsing
    if (QUESTION_PATTERNS.some((p) => p.test(text.trim()))) {
      setNotExpense(true)
      return
    }
    setNotExpense(false)

    originalTextRef.current = text
    setIsParsing(true)
    setParseError(null)

    const local = localParse(text, type)
    let parsed: ParsedExpense
    let hasRecurringSignal = local.hasRecurringSignal

    if (isLocalConfident(local)) {
      parsed = local
    } else {
      try {
        const res = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, type }),
        })
        if (!res.ok) throw new Error('API error')
        const apiResult = await res.json() as ParsedExpense
        parsed = apiResult
        // Re-check recurring signal from original text since API may miss it
        hasRecurringSignal =
          parsed.frequency === 'none' &&
          RECURRING_KEYWORDS.some((k) => text.toLowerCase().includes(k))
      } catch {
        parsed = local
      }
    }

    // §1D — Negative → income/refund
    if (local.isNegative && parsed.amount !== null) {
      parsed.amount = Math.abs(parsed.amount)
      parsed.type = 'income'
    }

    // §3D — Always trust user toggle for type if they explicitly chose it
    // (The toggle IS the user's selection, don't override it unless it's income signal)
    const effectiveType = parsed.type === 'income' ? 'income' : type

    // Fallback name from category if name missing but category obvious
    let derivedName = parsed.name
    if (!derivedName && parsed.category && parsed.confidence.category >= 0.7) {
      derivedName = parsed.category
    }

    setCollectedData({
      name: derivedName,
      amount: parsed.amount,
      type: effectiveType,
      category: parsed.category ?? null,
      frequency: parsed.frequency ?? 'none',
    })

    const queue = buildClarificationQueue(parsed, effectiveType, hasRecurringSignal)
    setClarificationQueue(queue)
    setCurrentStepIndex(0)
    setIsParsing(false)
  }, [])

  const answerStep = useCallback((value: string) => {
    setCollectedData((prev) => {
      const next = { ...prev }

      const step = clarificationQueue[currentStepIndex]
      if (!step) return prev

      switch (step.field) {
        case 'name': {
          next.name = value
          // §Example C — re-infer category from newly provided name
          const { category: inferred, confidence } = inferCategory(value)
          if (inferred && confidence >= 0.75 && !next.category) {
            next.category = inferred
            // Remove category step from remaining queue if it exists
            setClarificationQueue((q) => q.filter((s) => s.field !== 'category'))
          }
          break
        }
        case 'amount': {
          if (value === '__ask__') {
            // Replace current step with a free-text numeric input
            setClarificationQueue((q) => {
              const newQ = [...q]
              newQ[currentStepIndex] = {
                field: 'amount',
                question: 'How much was this?',
                options: null,
              }
              return newQ
            })
            return prev // don't advance index yet
          }
          const parsed = parseFloat(value.replace(/[^0-9.]/g, ''))
          next.amount = isNaN(parsed) ? null : parsed
          break
        }
        case 'frequency':
          next.frequency = value as Frequency
          break
        case 'category':
          next.category = value
          break
        case 'type':
          next.type = value as TransactionType
          break
      }

      return next
    })

    // Advance (except __ask__ which returns early above)
    if (value !== '__ask__') {
      setCurrentStepIndex((i) => i + 1)
    }
  }, [clarificationQueue, currentStepIndex])

  return {
    isParsing,
    parseError,
    notExpense,
    clarificationQueue,
    currentStepIndex,
    collectedData,
    parse,
    answerStep,
    reset,
  }
}
