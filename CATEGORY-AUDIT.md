# Cent — Category System Audit

## The Problem (visible in screenshot)

Old transactions in the database have **stale category names** from the previous 50-category system. The new system uses different names. When `getCategorySlug()` receives a name it doesn't recognise, it falls back to `credit-card` image.

Examples of broken old→new name mismatches:
| DB stores (old) | New name | Result |
|---|---|---|
| `Rent` | `Housing & Rent` | ❌ credit-card image |
| `Streaming` | `Streaming & Subscriptions` | ❌ credit-card image |
| `Utilities` | `Utilities` | ✅ works (name unchanged) |
| `Insurance` | `Insurance` | ✅ works (name unchanged) |
| `Home & Furniture` | `Shopping` | ❌ credit-card image |
| `Takeaway` | `Restaurants & Dining` | ❌ not in new system → "Other" badge |
| `Snacks` | (removed) | ❌ not in new system → "Other" badge |
| `Internet` | `Utilities` | ❌ was its own category, now merged |

---

## How Image Resolution Works (`transactionImages.ts`)

```
getCategorySlug(category, transactionName)
  1. If category is null → keyword-scan the transaction NAME → return slug or 'credit-card'
  2. Check CATEGORY_NAME_TO_SLUG[category]  ← new 30-category names only
  3. Check CORE_CATEGORIES + CATEGORY_MAP   ← old legacy set (Dining, Fitness, etc.)
  4. Return 'credit-card'                   ← fallback
```

**CATEGORY_NAME_TO_SLUG** maps the 30 new names → CDN slug.  
**THING_IMAGES** maps CDN slug → actual image URL (Vercel Blob).

---

## The 30 Categories — Current State

### Image legend
| CDN slug | What the image looks like |
|---|---|
| `restaurant` | Plate with fork/knife |
| `coffee` | Coffee cup |
| `supermarket` | Shopping cart |
| `cocktail` | Cocktail glass |
| `bus` | Bus |
| `suitcase` | Suitcase |
| `ambulance` | Ambulance |
| `dumbbell` | Dumbbell |
| `sunglasses` | Sunglasses |
| `movie` | Movie clapperboard |
| `subscription` | Circular arrows |
| `book` | Book |
| `house` | House |
| `lightning` | Lightning bolt |
| `shopping-bag` | Shopping bag |
| `gift` | Gift box |
| `insurance` | Shield/insurance icon |
| `bank` | Bank building |
| `receipt` | Receipt |
| `laptop` | Laptop |
| `money` | Money/banknotes |
| `dog` | Dog |
| `credit-card` | Credit card ← **the fallback/broken image** |

---

### All 30 Categories

| # | Category name (exact DB value) | CDN slug | Image | Triggers (sample keywords) |
|---|---|---|---|---|
| 1 | `Restaurants & Dining` | `restaurant` | 🍽 plate | restaurant, pizzeria, sushi, burger, kebab, takeaway, uber eats, deliveroo, just eat, diner, bistro, noodle, taco |
| 2 | `Coffee & Cafés` | `coffee` | ☕ cup | starbucks, costa, espresso, latte, cappuccino, café, koffie, bubble tea, flat white |
| 3 | `Groceries` | `supermarket` | 🛒 cart | albert heijn, aldi, jumbo, lidl, whole foods, supermarket, grocery, picnic, hellofresh |
| 4 | `Alcohol & Bars` | `cocktail` | 🍸 glass | bar, pub, kroeg, nightclub, gall & gall, brewery, cocktail bar, beer, wine, alcohol |
| 5 | `Transport` | `bus` | 🚌 bus | metro, tram, gvb, ret, htm, ns kaartje, bus ticket, lime scooter, ev charging, benzine |
| 6 | `Travel` | `suitcase` | 🧳 suitcase | klm, ryanair, booking.com, airbnb, hotel, flight, eurostar, car rental, hostel, cruise |
| 7 | `Health & Medical` | `ambulance` | 🚑 ambulance | huisarts, dentist, apotheek, pharmacy, physio, optician, vitamins, hospital, prescription |
| 8 | `Fitness & Sports` | `dumbbell` | 💪 dumbbell | gym, basic-fit, yoga, crossfit, pilates, peloton, strava, marathon, swimming, boxing |
| 9 | `Personal Care & Beauty` | `sunglasses` | 🕶 sunglasses | kapper, haircut, nail salon, spa, massage, barber, skincare, cosmetics, waxing |
| 10 | `Entertainment` | `movie` | 🎬 clapper | cinema, pathé, concert, theater, festival, ticketmaster, escape room, bowling, karaoke |
| 11 | `Streaming & Subscriptions` | `subscription` | 🔄 arrows | netflix, spotify, disney+, hbo max, apple tv, apple music, icloud, youtube premium |
| 12 | `Gaming` | `movie` | 🎬 clapper | steam, playstation store, xbox, nintendo, game pass, ps plus, ea play, twitch sub |
| 13 | `Books & Reading` | `book` | 📖 book | audible, kindle, bookstore, ebook, magazine, audiobook, library |
| 14 | `Housing & Rent` | `house` | 🏠 house | huur, rent, hypotheek, mortgage, landlord, storage unit, hoa, moving company |
| 15 | `Utilities` | `lightning` | ⚡ bolt | electricity, water bill, gas bill, internet bill, phone bill, gemeentebelasting, kpn, ziggo |
| 16 | `Home Maintenance & Repairs` | `house` | 🏠 house | plumber, loodgieter, electrician, handyman, cleaning service, renovation, garden service |
| 17 | `Pets` | `dog` | 🐕 dog | vet, dierenarts, dog food, cat food, pet shop, pet grooming, boarding |
| 18 | `Childcare & Kids` | `credit-card` | 💳 card ⚠️ | kinderopvang, daycare, babysitter, school fees, kindergarten, nanny |
| 19 | `Shopping` | `shopping-bag` | 🛍 bag | zalando, zara, h&m, bol.com, ikea, mediamarkt, amazon, ebay, clothing, shoes |
| 20 | `Gifts & Occasions` | `gift` | 🎁 gift | gift, cadeau, birthday present, gift card, flowers for someone, wedding gift |
| 21 | `Charity & Donations` | `gift` | 🎁 gift | donation, charity, ngo, gofundme, fundraiser, church, crowdfunding, oxfam |
| 22 | `Insurance` | `insurance` | 🛡 shield | centraal beheer, car insurance, home insurance, verzekering, liability, bupa, aviva |
| 23 | `Banking & Finance` | `bank` | 🏦 bank | bank fee, atm fee, overdraft, currency exchange, credit card fee, loan interest |
| 24 | `Investments` | `bank` | 🏦 bank | degiro, etoro, crypto, bitcoin, etf, brokerage, robinhood, vanguard, coinbase |
| 25 | `Government & Taxes` | `receipt` | 🧾 receipt | belastingdienst, income tax, boete, btw, vat, council tax, hmrc, municipality fine |
| 26 | `Education` | `book` | 📖 book | coursera, udemy, masterclass, duolingo, tuition, textbook, exam fee, tutoring |
| 27 | `Office & Work Expenses` | `laptop` | 💻 laptop | coworking, office supplies, stationery, notion, figma, github, slack, zoom, aws |
| 28 | `Salary & Income` | `money` | 💰 money | salaris, salary, loon, payroll, wages, paycheck |
| 29 | `Freelance & Side Income` | `money` | 💰 money | fiverr, upwork, marktplaats, vinted, freelance project, gig pay, stripe payout |
| 30 | `Rental Income` | `house` | 🏠 house | airbnb payout, huurinkomsten, rental income, room rent received |

---

## Known Issues

### 1. Old DB names with no mapping (show credit-card)
These names are in user databases from before the rename. They fall through all lookups:

| Old name | Should now be |
|---|---|
| `Rent` | `Housing & Rent` |
| `Streaming` | `Streaming & Subscriptions` |
| `Home & Furniture` | `Shopping` |
| `Bars & Nightlife` | `Alcohol & Bars` |
| `Fast Food` | `Restaurants & Dining` |
| `Bakery & Sweets` | `Restaurants & Dining` |
| `Delivery` | `Restaurants & Dining` |
| `Work Meals` | `Restaurants & Dining` |
| `Ride-hailing` | `Transport` |
| `Fuel` | `Transport` |
| `Parking` | `Transport` |
| `Public Transit` | `Transport` |
| `Flights` | `Travel` |
| `Car Maintenance` | `Transport` |
| `Clothing` | `Shopping` |
| `Electronics` | `Shopping` |
| `Books & Stationery` | `Shopping` or `Books & Reading` |
| `Gifts` | `Gifts & Occasions` |
| `Online Shopping` | `Shopping` |
| `Beauty & Personal` | `Personal Care & Beauty` |
| `Gym & Sports` | `Fitness & Sports` |
| `Medical` | `Health & Medical` |
| `Pharmacy` | `Health & Medical` |
| `Mental Health` | `Health & Medical` |
| `Wellness` | `Fitness & Sports` |
| `Home Services` | `Home Maintenance & Repairs` |
| `Childcare` | `Childcare & Kids` |
| `Events & Tickets` | `Entertainment` |
| `Hobbies` | `Shopping` |
| `Travel & Hotels` | `Travel` |
| `Sports & Outdoors` | `Fitness & Sports` |
| `Software & Tools` | `Office & Work Expenses` |
| `Office Supplies` | `Office & Work Expenses` |
| `Freelance Expense` | `Office & Work Expenses` |
| `Taxes & Fees` | `Government & Taxes` |
| `Investments` | `Investments` ✅ (unchanged) |
| `Loan Payments` | `Banking & Finance` |
| `Salary` | `Salary & Income` |
| `Freelance Income` | `Freelance & Side Income` |
| `Refund` | (no direct equivalent — null or `Salary & Income`) |
| `Gift Received` | `Salary & Income` or null |
| `Other Income` | `Salary & Income` |
| `Internet` | `Utilities` |
| `Phone` | `Utilities` |
| `Subscriptions` | `Streaming & Subscriptions` |
| `Home Services` | `Home Maintenance & Repairs` |
| `Takeaway` | `Restaurants & Dining` |
| `Snacks` | `Restaurants & Dining` |
| `Coffee` | `Coffee & Cafés` |
| `Restaurants` | `Restaurants & Dining` |
| `Alcohol & Bars` | `Alcohol & Bars` ✅ (unchanged) |

### 2. Categories sharing the same image
- `Entertainment` and `Gaming` both use `movie` (clapperboard) — may be confusing
- `Housing & Rent`, `Home Maintenance & Repairs`, and `Rental Income` all use `house`
- `Banking & Finance` and `Investments` both use `bank`
- `Education` and `Books & Reading` both use `book`
- `Gifts & Occasions` and `Charity & Donations` both use `gift`
- `Salary & Income` and `Freelance & Side Income` both use `money`
- `Childcare & Kids` uses `credit-card` ← clearly wrong placeholder

### 3. "Internet" and "Subscriptions" in screenshot
These were separate categories in the old system. They now need to map to `Utilities` and `Streaming & Subscriptions` respectively. Old DB records with these names will show no image.

---

## Fix Options

**Option A — Legacy name fallback in `getCategorySlug`**  
Add the old→new mapping table inside `transactionImages.ts` so old DB records still resolve to the right image. No DB migration needed.

**Option B — DB migration**  
Run a Supabase UPDATE to rename all old category values to new ones in the `transactions` table. Clean but irreversible without a backup.

**Option C — Both**  
Add the fallback first (instant fix, no data loss), then migrate DB (clean state going forward).
