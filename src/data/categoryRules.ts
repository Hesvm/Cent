export type CategoryRule = {
  keywords: string[];
  description: string;
};

export type CategoryRulesMap = Record<string, CategoryRule>;

// keywords = fast first-pass match (case-insensitive, substring)
// description = injected into AI prompt when keywords don't match
// Keys are the exact category names from the guide
export const CATEGORY_RULES: CategoryRulesMap = {
  'Restaurants & Dining': {
    keywords: ['restaurant', 'eetcafé', 'pizzeria', 'sushi', 'burger', 'kebab', 'takeaway', 'food delivery', 'uber eats', 'deliveroo', 'thuisbezorgd', 'snackbar', 'diner', 'buffet', 'steakhouse', 'noodle', 'taco', 'food truck', 'catering', 'just eat', 'doordash', 'grubhub', 'bistro', 'brasserie', 'ramen', 'eatery', 'dining'],
    description: 'Any sit-down meal, takeaway, fast food, food delivery, restaurant apps (Uber Eats, Deliveroo, Just Eat, DoorDash). Includes pizzerias, sushi bars, burger joints, kebab shops, cafeterias, diners, buffets, steakhouses, noodle bars, food trucks.',
  },
  'Coffee & Cafés': {
    keywords: ['starbucks', 'costa', 'espresso', 'latte', 'cappuccino', 'americano', 'coffee shop', 'café', 'koffie', 'dutch bros', 'peet', 'tim hortons', 'caffè nero', 'bubble tea', 'smoothie bar', 'juice bar', 'thee', 'flat white'],
    description: 'Coffee shops, espresso bars, tea houses, bubble tea, café chains (Starbucks, Costa, Tim Hortons, Dutch Bros), juice bars, smoothie shops, bakery-cafés where the primary spend is a drink.',
  },
  'Groceries': {
    keywords: ['albert heijn', 'aldi', 'jumbo', 'lidl', 'whole foods', 'trader joe', 'kroger', 'supermarket', 'grocery', 'boodschappen', 'picnic', 'hellofresh', 'gorillas', 'getir', 'spar', 'sainsbury', 'tesco', 'waitrose', 'asda', 'morrisons', 'market'],
    description: 'Supermarkets, hypermarkets, wholesale food clubs, farmers markets, online grocery delivery (Picnic, HelloFresh, Gorillas, Getir), butchers, fishmongers, bakeries as a food shop.',
  },
  'Alcohol & Bars': {
    keywords: ['bar', 'pub', 'kroeg', 'nightclub', 'gall & gall', 'wine shop', 'brewery', 'cocktail bar', 'bottle shop', 'wetherspoons', 'heineken', 'off-licence', 'liquor store', 'café kroeg'],
    description: 'Bars, pubs, nightclubs, bottle shops, wine shops, craft beer stores. Drinks at a venue that is clearly a bar or club. Does not include wine bought at a supermarket.',
  },
  'Transport': {
    keywords: ['gvb', 'ret', 'htm', 'ns kaartje', 'bus ticket', 'metro', 'tram', 'bolt taxi', 'lime scooter', 'tier', 'parking', 'benzine', 'ev charging', 'toll', 'rideshare', 'oyster', 'tfl', 'translink', 'contactless transit'],
    description: 'Public transit (bus, metro, tram, train), taxis, rideshare (Uber, Bolt, Lyft), bike/scooter rentals, ferry tickets, toll roads, parking, fuel/petrol/gas stations, EV charging. Not flights or long-distance trains.',
  },
  'Travel': {
    keywords: ['klm', 'ryanair', 'easyjet', 'booking.com', 'airbnb', 'hotel', 'flight', 'eurostar', 'car rental', 'hertz', 'avis', 'hostel', 'luggage', 'travel insurance', 'vliegticket', 'thalys', 'cruise', 'resort', 'vacation', 'holiday inn', 'marriott', 'hilton'],
    description: 'Flights, hotels, hostels, Airbnb, vacation rentals, long-distance trains (Eurostar, Thalys), car rentals, travel insurance, travel agencies, cruises, airport lounges, luggage fees, visa fees.',
  },
  'Health & Medical': {
    keywords: ['huisarts', 'dokter', 'dentist', 'tandarts', 'apotheek', 'pharmacy', 'physio', 'optician', 'zorgverzekering', 'vitamins', 'supplement', 'hospital', 'ziekenhuis', 'therapist', 'prescription', 'blood test', 'specsavers', 'vision express', 'health insurance', 'gp', 'nhs', 'clinic'],
    description: 'Doctor visits, dentist, specialist, physiotherapy, pharmacy, prescriptions, optician, hospital bills, health insurance premiums, mental health therapy, blood tests, medical equipment, vitamins and supplements.',
  },
  'Fitness & Sports': {
    keywords: ['gym', 'basic-fit', 'yoga', 'crossfit', 'pilates', 'personal trainer', 'sports club', 'swimming', 'peloton', 'strava', 'marathon', 'fitness app', 'puregym', 'anytime fitness', 'planet fitness', 'les mills', 'equinox', 'boxing', 'cycling club'],
    description: 'Gym memberships, personal trainers, yoga studios, pilates, swimming pools, sports clubs, CrossFit, martial arts, cycling clubs, running events, sports equipment, fitness apps (Strava, MyFitnessPal, Peloton).',
  },
  'Personal Care & Beauty': {
    keywords: ['kapper', 'haircut', 'nail salon', 'spa', 'massage', 'barber', 'beauty salon', 'skincare', 'cosmetics', 'waxing', 'parfum', 'sephora', 'lush', 'tanning salon', 'eyebrow', 'threading', 'salon'],
    description: 'Haircut, hair salon, barbershop, nail salon, beauty treatments, spa, massage, skincare products, cosmetics, perfume, tanning salon, waxing, eyebrow threading.',
  },
  'Entertainment': {
    keywords: ['cinema', 'pathé', 'concert', 'theater', 'festival', 'ticketmaster', 'escape room', 'bowling', 'comedy show', 'pretpark', 'karaoke', 'cineworld', 'odeon', 'vue', 'imax', 'eventbrite', 'amusement park', 'mini golf', 'arcade'],
    description: 'Movies, cinema, concerts, live music, theater, events, amusement parks, escape rooms, bowling, arcade, comedy shows, festivals, sporting events (spectator), karaoke, mini golf.',
  },
  'Streaming & Subscriptions': {
    keywords: ['netflix', 'spotify', 'disney+', 'hbo max', 'apple tv', 'amazon prime video', 'apple music', 'tidal', 'deezer', 'icloud', 'google one', 'dropbox', 'youtube premium', 'hulu', 'crunchyroll', 'paramount+', 'peacock', 'nyt subscription', 'adobe creative cloud'],
    description: 'Video streaming (Netflix, Disney+, HBO Max), music streaming (Spotify, Apple Music, Tidal), podcast apps, cloud storage (iCloud, Google One, Dropbox), news subscriptions, software licenses for personal use.',
  },
  'Gaming': {
    keywords: ['steam', 'playstation store', 'xbox', 'nintendo', 'in-app purchase', 'game pass', 'ps plus', 'ea play', 'twitch sub', 'epic games', 'ubisoft', 'psn', 'humble bundle', 'gaming gear'],
    description: 'Video game purchases (Steam, PlayStation Store, Xbox, Nintendo), gaming subscriptions (PlayStation Plus, Xbox Game Pass, EA Play), in-game purchases, gaming hardware, gaming accessories.',
  },
  'Books & Reading': {
    keywords: ['audible', 'kindle', 'bookstore', 'boekhandel', 'ebook', 'magazine', 'audiobook', 'waterstones', 'barnes', 'book depository', 'scribd', 'library'],
    description: 'Bookstores, ebooks, Kindle purchases, audiobooks (Audible), magazine subscriptions, newspaper subscriptions, library fees.',
  },
  'Housing & Rent': {
    keywords: ['huur', 'rent', 'hypotheek', 'mortgage', 'landlord', 'verhuurder', 'storage unit', 'hoa', 'property tax', 'moving company', 'tenancy'],
    description: 'Monthly rent, mortgage payments, HOA fees, property tax, real estate agent fees, storage unit rental, moving services.',
  },
  'Utilities': {
    keywords: ['vattenfall', 'nuon', 'water bill', 'internet', 'kpn', 't-mobile', 'ziggo', 'electricity', 'gas bill', 'gemeentebelasting', 'cable', 'telefoon', 'broadband', 'british gas', 'eon', 'octopus energy', 'edf', 'wifi', 'phone bill', 'mobile contract'],
    description: 'Electricity, gas, water, internet, home phone, mobile phone plan, cable TV, municipal taxes (gemeentebelasting), waste collection fees, sewage.',
  },
  'Home Maintenance & Repairs': {
    keywords: ['plumber', 'electrician', 'handyman', 'loodgieter', 'cleaning service', 'schoonmaak', 'painter', 'renovation', 'garden service', 'tools', 'pest control', 'hvac', 'locksmith', 'screwfix', 'b&q'],
    description: 'Plumber, electrician, handyman, cleaning services, HVAC repair, painting, renovation costs, tools for home repair, garden maintenance, pest control.',
  },
  'Pets': {
    keywords: ['vet', 'dierenarts', 'dog food', 'cat food', 'pet shop', 'grooming', 'huisdierenshop', 'pet supplies', 'boarding', 'doggy daycare', 'pets at home', 'petplan'],
    description: 'Pet food, vet bills, pet insurance, grooming, pet supplies, pet toys, boarding, doggy daycare.',
  },
  'Childcare & Kids': {
    keywords: ['kinderopvang', 'daycare', 'babysitter', 'school fees', 'kids activity', 'speelgoed', 'nanny', 'kindergarten', 'baby supplies'],
    description: 'Daycare, babysitter, school fees for children, kids activities, child allowance payments, toys and children clothing.',
  },
  'Shopping': {
    keywords: ['zalando', 'zara', 'h&m', 'amazon', 'bol.com', 'ikea', 'mediamarkt', 'coolblue', 'clothing', 'shoes', 'electronics', 'online shop', 'primark', 'uniqlo', 'asos', 'ebay', 'etsy', 'aliexpress'],
    description: 'Clothing, shoes, accessories, electronics, furniture, homeware, online retail (Amazon, Bol.com, Zalando, H&M, Zara, IKEA), department stores, gifts, toys, books bought casually, sports gear.',
  },
  'Gifts & Occasions': {
    keywords: ['gift', 'cadeau', 'birthday present', 'gift card', 'flowers for someone', 'wedding gift', 'celebration dinner', 'interflora', 'moonpig', 'funky pigeon'],
    description: 'Birthday gifts, wedding gifts, holiday gifts, gift cards purchased, flowers sent as a gift, celebration dinners paid for others.',
  },
  'Charity & Donations': {
    keywords: ['donation', 'donatie', 'charity', 'ngo', 'gofundme', 'fundraiser', 'church', 'crowdfunding', 'oxfam', 'red cross', 'sponsoring'],
    description: 'Charitable donations, fundraisers, NGO contributions, church donations, crowdfunding (GoFundMe), sponsoring someone.',
  },
  'Insurance': {
    keywords: ['centraal beheer', 'car insurance', 'home insurance', 'anwb', 'verzekering', 'liability', 'travel insurance policy', 'pet insurance', 'contents insurance', 'life insurance', 'bupa', 'axa', 'aviva', 'zurich'],
    description: 'Car insurance, home insurance, contents insurance, travel insurance (standalone), life insurance, liability insurance, pet insurance. Note: health insurance goes to Health & Medical.',
  },
  'Banking & Finance': {
    keywords: ['bank fee', 'atm fee', 'overdraft', 'currency exchange', 'credit card fee', 'loan interest', 'transaction fee', 'bank kosten', 'wire fee', 'kosten rekening'],
    description: 'Bank account fees, ATM withdrawal fees, wire transfer fees, currency exchange fees, investment platform fees, credit card annual fees, loan interest payments.',
  },
  'Investments': {
    keywords: ['degiro', 'etoro', 'crypto', 'bitcoin', 'etf', 'bux', 'brokerage', 'aandelen', 'investment', 'pension contribution', 'robinhood', 'vanguard', 'hargreaves lansdown', 'trading 212', 'freetrade', 'isa', 'coinbase', 'revolut invest'],
    description: 'Brokerage deposits, stock purchases, ETF buys, crypto purchases, investment app deposits (DEGIRO, Robinhood, eToro, Bux), pension contributions.',
  },
  'Government & Taxes': {
    keywords: ['belastingdienst', 'income tax', 'fine', 'boete', 'passport fee', 'government fee', 'btw', 'vat', 'council tax', 'hmrc', 'irs', 'municipality fine', 'belasting', 'digid'],
    description: 'Tax payments (income tax, VAT, corporate tax), government fines, traffic fines, administrative fees, passport/ID renewal, government agency fees.',
  },
  'Education': {
    keywords: ['coursera', 'udemy', 'masterclass', 'duolingo', 'babbel', 'tuition', 'cursus', 'school fee', 'textbook', 'exam fee', 'tutoring', 'studiefinanciering', 'linkedin learning', 'skillshare', 'codecademy', 'university', 'workshop', 'certification'],
    description: 'Tuition fees, university fees, online courses (Coursera, Udemy, MasterClass), language learning apps (Duolingo, Babbel), textbooks, school supplies, tutoring, exam fees.',
  },
  'Office & Work Expenses': {
    keywords: ['coworking', 'office supplies', 'kantoor', 'printer', 'stationery', 'business software', 'postage', 'work laptop', 'monitor', 'kantoorbenodigdheden', 'wework', 'regus', 'notion', 'figma', 'github', 'slack', 'zoom', 'aws', 'google workspace', 'microsoft 365', 'vercel', 'supabase'],
    description: 'Office supplies, stationery, work equipment (monitor, keyboard), coworking space memberships, business software, printing costs, postage, work-related travel expensed.',
  },
  'Salary & Income': {
    keywords: ['salaris', 'salary', 'loon', 'payroll', 'wage', 'paycheck', 'freelance payment received', 'invoice paid', 'employment income', 'direct deposit'],
    description: 'Regular salary deposits, wages, payroll, freelance invoice payments received, consulting fees received, any income clearly labeled as salary or loon.',
  },
  'Freelance & Side Income': {
    keywords: ['fiverr', 'upwork', 'marktplaats', 'vinted', 'freelance project', 'side income', 'sold item', 'gig pay', 'client payment', 'stripe payout', 'ebay income'],
    description: 'One-off freelance project payments, side hustle income, selling items online (Marktplaats, eBay, Vinted), gig economy payments (Fiverr, Upwork).',
  },
  'Rental Income': {
    keywords: ['airbnb payout', 'huurinkomsten', 'rental income', 'room rent received', 'property income', 'airbnb host'],
    description: 'Income from renting out property, Airbnb host payouts, room rental income, parking spot rental income.',
  },
};
