export type CategoryRule = {
  keywords: string[];
  description: string;
};

export type CategoryRulesMap = Record<string, CategoryRule>;

// keywords = fast first-pass match (case-insensitive, substring)
// description = injected into Gemini prompt when keywords don't match
export const CATEGORY_RULES: CategoryRulesMap = {
  'coffee': {
    keywords: ['starbucks', 'costa', 'caffè nero', 'pret', 'tim hortons', 'dutch bros', 'espresso', 'latte', 'cappuccino', 'americano', 'coffee shop', 'café'],
    description: 'Any purchase at a café, coffee shop, or espresso bar — including chain cafés like Starbucks or Costa, and independent coffee spots. Includes all hot and cold coffee-based drinks.',
  },
  'restaurant': {
    keywords: ['restaurant', 'diner', 'bistro', 'brasserie', 'pizzeria', 'sushi', 'noodles', 'ramen', 'steakhouse', 'grill', 'eatery', 'dining'],
    description: 'Sit-down meals at restaurants, bistros, or eateries where you order at a table. Includes both casual dining and fine dining. Does not include fast food, takeaway, or coffee shops.',
  },
  'groceries': {
    keywords: ['lidl', 'aldi', 'tesco', 'sainsbury', 'waitrose', 'asda', 'morrisons', 'whole foods', 'trader joe', 'kroger', 'supermarket', 'grocery', 'food shop'],
    description: 'Supermarket or grocery store purchases — buying raw ingredients, household food staples, or packaged goods to cook or consume at home.',
  },
  'takeaway': {
    keywords: ['deliveroo', 'just eat', 'uber eats', 'doordash', 'mcdonalds', 'kfc', 'burger king', 'dominos', 'pizza hut', 'subway', 'nandos', 'five guys', 'chipotle', 'takeaway'],
    description: 'Food ordered for delivery or collected to eat at home or on the go — includes fast food chains, food delivery apps, and any quick-service restaurant.',
  },
  'alcohol': {
    keywords: ['pub', 'bar', 'brewery', 'wine', 'beer', 'spirits', 'wetherspoons', 'heineken', 'off-licence', 'liquor'],
    description: 'Drinks at bars, pubs, or clubs, and alcohol purchased from shops or off-licences.',
  },
  'snacks': {
    keywords: ['snack', 'crisps', 'chocolate', 'newsagent', 'corner shop', 'vending'],
    description: 'Small food purchases like snacks, confectionery, or drinks from corner shops, newsagents, or vending machines. Not a full meal.',
  },
  'streaming': {
    keywords: ['netflix', 'spotify', 'apple tv', 'disney+', 'hbo', 'amazon prime', 'youtube premium', 'hulu', 'paramount+', 'crunchyroll', 'peacock', 'dazn', 'apple music'],
    description: 'Monthly subscriptions to streaming services for video, music, or podcasts — such as Netflix, Spotify, Disney+, or Apple TV+.',
  },
  'gaming': {
    keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'epic games', 'psn', 'xbox game pass', 'ea play', 'ubisoft', 'humble bundle', 'twitch'],
    description: 'Video game purchases, gaming subscriptions, in-game purchases, or gaming platform fees.',
  },
  'music': {
    keywords: ['spotify', 'apple music', 'tidal', 'deezer', 'soundcloud', 'bandcamp'],
    description: 'Music streaming subscriptions or music purchases. Separate from general streaming if the purchase is music-specific.',
  },
  'books': {
    keywords: ['amazon books', 'kindle', 'audible', 'bookshop', 'waterstones', 'barnes', 'book depository', 'scribd'],
    description: 'Book purchases (physical or digital), ebook subscriptions like Kindle Unlimited, or audiobook services like Audible.',
  },
  'cinema': {
    keywords: ['cinema', 'cineworld', 'odeon', 'vue', 'picturehouse', 'imax', 'fandango', 'movietickets', 'regal'],
    description: 'Cinema tickets, movie theatre purchases (including food at the cinema), or movie rental/purchase on platforms like Apple TV or Google Play.',
  },
  'tickets': {
    keywords: ['ticketmaster', 'eventbrite', 'skiddle', 'see tickets', 'dice', 'resident advisor', 'festival', 'concert', 'gig', 'event', 'theatre', 'opera'],
    description: 'Tickets for live events — concerts, festivals, theatre, sports games, comedy shows, or any other ticketed event.',
  },
  'transport': {
    keywords: ['oyster', 'tfl', 'bus', 'tube', 'metro', 'tram', 'train', 'national rail', 'gwr', 'avanti', 'thameslink', 'contactless transit', 'translink'],
    description: 'Public transport fares — buses, trains, underground, trams, or any mass transit system. Includes travel cards and monthly passes.',
  },
  'taxi': {
    keywords: ['uber', 'bolt', 'lyft', 'free now', 'addison lee', 'black cab', 'taxi', 'rideshare', 'ola', 'grab'],
    description: 'Taxi journeys or rideshare app rides — Uber, Bolt, Lyft, or local taxi services.',
  },
  'fuel': {
    keywords: ['shell', 'bp', 'esso', 'texaco', 'total', 'petrol', 'diesel', 'fuel', 'gas station'],
    description: 'Petrol or diesel purchased at a fuel station for a car or vehicle.',
  },
  'parking': {
    keywords: ['parking', 'ncp', 'q-park', 'ringo', 'justpark', 'parkopedia', 'car park', 'pay & display'],
    description: 'Car parking fees, parking apps, or pay-and-display charges.',
  },
  'car-insurance': {
    keywords: ['car insurance', 'auto insurance', 'direct line', 'admiral', 'aviva', 'comparethemarket', 'confused.com', 'vehicle insurance'],
    description: 'Car or vehicle insurance premiums — monthly or annual.',
  },
  'flights': {
    keywords: ['ryanair', 'easyjet', 'british airways', 'lufthansa', 'emirates', 'american airlines', 'delta', 'expedia flights', 'skyscanner', 'kayak', 'flight', 'airline'],
    description: 'Flight ticket purchases for any airline or booking platform.',
  },
  'medical': {
    keywords: ['gp', 'doctor', 'nhs', 'hospital', 'consultant', 'dental', 'dentist', 'optician', 'vision express', 'specsavers', 'clinic', 'physiotherapy', 'physio'],
    description: 'Medical appointments, GP visits, dentist, optician, physiotherapy, or any healthcare consultation fee.',
  },
  'pharmacy': {
    keywords: ['boots', 'superdrug', 'pharmacy', 'lloyds pharmacy', 'chemist', 'prescription', 'medicine', 'medication', 'vitamins', 'supplements'],
    description: 'Prescription medication, over-the-counter medicine, vitamins, or supplements purchased at a pharmacy or chemist.',
  },
  'gym': {
    keywords: ['gym', 'puregym', 'anytime fitness', 'planet fitness', 'crossfit', 'pilates', 'yoga', 'les mills', 'equinox', 'fitness', 'membership'],
    description: 'Gym memberships, fitness class subscriptions, or personal training sessions. Includes all paid physical fitness services.',
  },
  'sports': {
    keywords: ['nike', 'adidas', 'sports direct', 'decathlon', '5-a-side', 'tennis court', 'swimming pool', 'climbing wall', 'golf', 'cycling club'],
    description: 'Sports activity fees, sports equipment, or participation in organised sports. Does not include gym memberships (see Gym).',
  },
  'mental-health': {
    keywords: ['therapy', 'therapist', 'counselling', 'counselor', 'psychologist', 'psychiatrist', 'headspace', 'calm', 'betterhelp', 'bupa mental'],
    description: 'Therapy sessions, counselling, or mental wellness app subscriptions like Headspace or Calm.',
  },
  'clothing': {
    keywords: ['zara', 'h&m', 'uniqlo', 'asos', 'primark', 'next', 'topshop', 'reiss', 'cos', 'mango', 'gap', 'clothing', 'fashion', 'shoes', 'trainers', 'footwear'],
    description: 'Clothing, footwear, accessories, or fashion items — from any store or online retailer.',
  },
  'electronics': {
    keywords: ['apple store', 'currys', 'argos', 'amazon electronics', 'samsung', 'best buy', 'john lewis tech', 'laptop', 'phone', 'headphones', 'monitor', 'keyboard'],
    description: 'Electronic devices and gadgets — phones, laptops, headphones, tablets, cameras, or accessories.',
  },
  'beauty': {
    keywords: ['sephora', 'boots beauty', 'lookfantastic', 'cult beauty', 'glossier', 'lush', 'the ordinary', 'nyx', 'salon', 'haircut', 'barber', 'nail'],
    description: 'Beauty products, cosmetics, skincare, haircare, or personal grooming — including salon visits and barbers.',
  },
  'pets': {
    keywords: ['pets at home', 'pet shop', 'vet', 'veterinary', 'dog food', 'cat food', 'petplan', 'pet insurance', 'grooming'],
    description: 'Pet food, veterinary fees, pet insurance, grooming services, or any other pet-related expense.',
  },
  'gifts': {
    keywords: ['gift', 'flowers', 'interflora', 'moonpig', 'funky pigeon', 'prezzie', 'card factory', 'hallmark', 'not on the high street'],
    description: 'Gifts purchased for others — including flowers, gift cards, greetings cards, or personalised presents.',
  },
  'hobbies': {
    keywords: ['hobby', 'craft', 'art supplies', 'hobbycraft', 'model', 'photography', 'fishing', 'gardening', 'diy', 'b&q', 'screwfix', 'homebase'],
    description: 'Purchases for personal hobbies, creative activities, DIY projects, or leisure pursuits.',
  },
  'travel': {
    keywords: ['hotel', 'airbnb', 'booking.com', 'hostel', 'holiday inn', 'marriott', 'hilton', 'trivago', 'vrbo', 'resort', 'travel insurance'],
    description: 'Travel accommodation — hotels, Airbnb, hostels, or holiday resorts. Also travel insurance. Flights are separate (see Flights).',
  },
  'software': {
    keywords: ['notion', 'figma', 'github', 'aws', 'google workspace', 'microsoft 365', 'adobe', 'slack', 'zoom', 'dropbox', 'linear', 'vercel', 'netlify', 'heroku', 'supabase', 'anthropic', 'openai'],
    description: 'Software subscriptions, SaaS tools, cloud services, or developer tools used for work or personal projects.',
  },
  'office': {
    keywords: ['staples', 'ryman', 'office depot', 'viking', 'amazon business', 'printer', 'paper', 'stationery', 'ink cartridge'],
    description: 'Office supplies — stationery, printer ink, paper, or any physical supplies for a home office or workplace.',
  },
  'freelance': {
    keywords: ['contractor', 'client expense', 'business expense', 'invoice', 'work equipment', 'co-working', 'wework', 'regus'],
    description: 'Business expenses incurred while freelancing — equipment, co-working spaces, tools, or client-related costs.',
  },
  'education': {
    keywords: ['udemy', 'coursera', 'linkedin learning', 'masterclass', 'duolingo', 'tutoring', 'course', 'university', 'tuition', 'codecademy', 'skillshare'],
    description: 'Educational courses, tuition fees, online learning platforms, or tutoring services.',
  },
  'taxes': {
    keywords: ['hmrc', 'tax', 'irs', 'vat', 'council tax', 'self-assessment', 'accountant', 'bookkeeper', 'sage', 'quickbooks', 'xero'],
    description: 'Tax payments, council tax, accountant fees, or accounting software subscriptions.',
  },
  'investments': {
    keywords: ['vanguard', 'hargreaves lansdown', 'trading 212', 'freetrade', 'isa', 'stocks', 'shares', 'etf', 'crypto', 'coinbase', 'revolut invest'],
    description: 'Investments — stocks, ETFs, ISAs, crypto, or any investment platform deposits.',
  },
  'loans': {
    keywords: ['loan', 'mortgage', 'repayment', 'finance payment', 'klarna', 'clearpay', 'afterpay', 'credit payment'],
    description: 'Loan repayments — mortgage, personal loans, car finance, or buy-now-pay-later instalments.',
  },
  'salary': {
    keywords: ['salary', 'payroll', 'wages', 'paycheck', 'direct deposit', 'employer payment', 'monthly pay'],
    description: 'Regular income paid by an employer — monthly salary, bi-weekly paycheck, or any recurring wage payment.',
  },
  'freelance-income': {
    keywords: ['invoice paid', 'client payment', 'freelance payment', 'stripe payout', 'paypal income', 'bank transfer income'],
    description: 'Income received for freelance or contract work — client payments, invoice settlements, or platform payouts.',
  },
  'refund': {
    keywords: ['refund', 'cashback', 'return', 'credit', 'reimbursement', 'chargeback'],
    description: 'Money returned to you — refunds from purchases, cashback rewards, or reimbursements from an employer or friend.',
  },
  'gift-received': {
    keywords: ['gift received', 'birthday money', 'bank transfer from family', 'present'],
    description: 'Money or gifts received from friends or family — birthday money, wedding gifts, or informal transfers.',
  },
  'other-income': {
    keywords: ['dividends', 'rental income', 'side hustle', 'selling online', 'ebay income', 'vinted income', 'pension'],
    description: 'Any other income that does not fit salary, freelance, refund, or gift — rental income, dividends, selling items online, or pension payments.',
  },
  'subscriptions': {
    keywords: ['subscription', 'membership', 'monthly charge', 'annual renewal', 'recurring payment'],
    description: 'General recurring subscription payments not covered by a more specific category — e.g. magazine subscriptions, app subscriptions, or club memberships.',
  },
  'rent': {
    keywords: ['rent', 'landlord', 'tenancy', 'property payment', 'rental payment'],
    description: 'Monthly rent payment to a landlord or letting agent.',
  },
  'utilities': {
    keywords: ['british gas', 'eon', 'octopus energy', 'edf', 'scottish power', 'npower', 'electricity', 'gas bill', 'water bill', 'thames water', 'severn trent'],
    description: 'Utility bills — gas, electricity, water, or heating.',
  },
  'internet': {
    keywords: ['virgin media', 'bt broadband', 'sky broadband', 'plusnet', 'vodafone broadband', 'internet', 'broadband', 'wifi'],
    description: 'Home broadband or internet service provider monthly bill.',
  },
  'phone': {
    keywords: ['o2', 'ee', 'vodafone', 'three mobile', 'giffgaff', 'sky mobile', 'phone bill', 'sim', 'mobile contract'],
    description: 'Mobile phone contract or SIM-only plan monthly bill.',
  },
  'insurance': {
    keywords: ['home insurance', 'contents insurance', 'life insurance', 'travel insurance', 'health insurance', 'bupa', 'axa', 'aviva', 'zurich'],
    description: 'Insurance premiums — home, contents, life, health, or travel insurance. Car insurance is separate (see Car Insurance).',
  },
  'home-supplies': {
    keywords: ['ikea', 'amazon home', 'dunelm', 'john lewis home', 'wilko', 'home bargains', 'poundland', 'cleaning', 'bleach', 'laundry', 'candles'],
    description: 'Household supplies — cleaning products, laundry essentials, home decor, or small domestic items.',
  },
  'other': {
    keywords: [],
    description: 'A transaction that does not fit any other category. Use as a last resort.',
  },
};
