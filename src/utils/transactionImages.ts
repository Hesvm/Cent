const CDN = 'https://lftz25oez4aqbxpq.public.blob.vercel-storage.com'

// Direct image URLs from thiings.co, organized by slug
const THING_IMAGES: Record<string, string> = {
  coffee:         `${CDN}/image-mOoyvLISs98asAdPdQUhTac4S9Q1M9.png`,
  house:          `${CDN}/image-0OoMAJRtHLxXtHGKaC50y1kLqsAPFV.png`,
  car:            `${CDN}/image-BUdFzT6W46HCgNoa5ncDJwdfqXzfqq.png`,
  wallet:         `${CDN}/image-r5QxxRu1dvIND6CpaRBYLTnJmCfzNM.png`,
  gym:            `${CDN}/image-9nfkO2yI0lvKCl7Any15roC9jEeLKX.png`,
  'shopping-bag': `${CDN}/image-1kzlhXN3lasEQYBtwdeXrzzhBEwurX.png`,
  restaurant:     `${CDN}/image-hRETElBXDrcXOu32Vv4OnRgHpWQZj3.png`,
  movie:          `${CDN}/image-DNaKSDV2Vm6rz8yKS6WtuJwy4rLZwh.png`,
  lightning:      `${CDN}/image-kEc3FuOo6TejgI0tivfA8qPm4YIWfV.png`,
  smartphone:     `${CDN}/image-LxbDZUY1gzuzF4AEv0OHAqsSGpAng8.png`,
  subscription:   `${CDN}/image-JFRJMlgmIk1SNlNPZVGSW7bTco4jY4.png`,
  pizza:          `${CDN}/image-BzDI4uzt2LYSK3YP9UguQDZrOZmC8X.png`,
  'gas-station':  `${CDN}/image-0J3HeTBw7OlENzRBjYxhCozIqq8fUV.png`,
  airplane:       `${CDN}/image-v0LP91OBaZckcNrHRNpH4uXzImn4v5.png`,
  hotel:          `${CDN}/image-lCvW4p3khtoganHdqFzwxmQszzsKjS.png`,
  book:           `${CDN}/image-QhvfavmoGfPmREwwvl4XtqTIORARDz.png`,
  wifi:           `${CDN}/image-VXaWfLCXlsRCXSbioAplHuPLkfoqWe.png`,
  insurance:      `${CDN}/image-EXQKqxwkBgsyk04E6ht3UY7xupVGrE.png`,
  taxi:           `${CDN}/image-Ei311Qi6EfCbzzHIhoFcn9ngw1jNlj.png`,
  train:          `${CDN}/image-B6HK6QalkOwIxTOxbj2guRpL5YQjAL.png`,
  running:        `${CDN}/image-GM1g71NpPRRnefhKHqhn5fqHXV709G.png`,
  laptop:         `${CDN}/image-UsyTZyMk2er8VfZu1T68Z4BbnfHYL1.png`,
  suitcase:       `${CDN}/image-SJxXSQiZvg2rhqvpw6hANLsmgfO4tX.png`,
  money:          `${CDN}/image-IeKGYKeLd25OWlrmd5WrSsfbD7OIPA.png`,
  bank:           `${CDN}/image-IiMitsVHDCFJDFZnsGOFBFJg3Jhsbp.png`,
  'credit-card':  `${CDN}/image-xylXWxjRoBYdaH9IPOx1080olvl5Ur.png`,
  receipt:        `${CDN}/image-DjLfCX0etcbaHeaobCUklhYQWOSXUF.png`,
  gift:           `${CDN}/image-yqO1RPHoOjuNAvqMy997ClCPIwICsb.png`,
  'boxing-gloves':`${CDN}/image-IOMyJ5Y18e6rvD4OI40l2fugRE5h68.png`,
  supermarket:    `${CDN}/image-6RTw7Ifo1xhDr9ETjDBjMGv5S5YzTi.png`,
  cat:            `${CDN}/image-X5oYX1FDDLVSQ1aPCSIaOBkmCQGhDP.png`,
  dog:            `${CDN}/image-YXDHNtGHmuIYVUpDDrH3GBHMqKQB4c.png`,
  burger:         `${CDN}/image-ufchp2pkhx8YgcCt0U4kqfXB4eEihP.png`,
  sushi:          `${CDN}/image-9CY8eypBeC0cXG0brbuA5jv4yGvu2n.png`,
  salad:          `${CDN}/image-74oYOPyKkvUqLR9mTaRm8ab1n8FXJj.png`,
  cocktail:       `${CDN}/image-WTz9QHRXEZEXczW1IeiF48lnTFXq2L.png`,
  headphones:     `${CDN}/image-i8kglgSpa6qTxfOFu2nYODqRk7MUo1.png`,
  camera:         `${CDN}/image-s09fUJ3H6nVTAzwemNRaSQgTJi6PUP.png`,
  bicycle:        `${CDN}/image-PaCc0tIkRuwOlV8GdtTxkKQfa1Dfdu.png`,
  motorcycle:     `${CDN}/image-eI6n4x6dT5zthnTccmRnV0GX7PJxmW.png`,
  bus:            `${CDN}/image-eul8D3pWw6n8J32F5tqJHvnYub3mwd.png`,
  ambulance:      `${CDN}/image-AYUl8fBBUAB87V9MUkKFWYlwiYC14i.png`,
  dumbbell:       `${CDN}/image-5RAX5kW85fgiRpM3VdHTeOZmSRx3wB.png`,
  yoga:           `${CDN}/image-m2SOQuJWIeR3yhaHHkIn6ueDQ5KAEZ.png`,
  treadmill:      `${CDN}/image-27C8ixXQ7Pxb2Jhh5varxdHAvHmGne.png`,
  sneakers:       `${CDN}/image-llBJrXGTGW8fvXFYtSynrQ6nWHbhKo.png`,
  sunglasses:     `${CDN}/image-5SFKX0yeQoj1PbNM2ObWNi902QoUeO.png`,
  watch:          `${CDN}/image-GMDUYJRKP7kEcXKVWjUVqk64HOpE0U.png`,
  ring:           `${CDN}/image-W68FVT8R1haHu0Vqbhq95CyitIQkWx.png`,
  diamond:        `${CDN}/image-JWrKzAbDTTpB1o29JJb88rMrUMXAqW.png`,
}

// Map categories and keywords → image slug
type CategoryKey = string
const CATEGORY_MAP: Record<CategoryKey, string> = {
  // Core categories
  Dining:        'restaurant',
  Fitness:       'boxing-gloves',
  Income:        'money',
  Shopping:      'shopping-bag',
  Transport:     'car',
  Groceries:     'supermarket',
  Entertainment: 'movie',
  Health:        'ambulance',
  Housing:       'house',
  Utilities:     'lightning',
  Other:         'credit-card',

  // Keywords
  coffee:        'coffee',
  cafe:          'coffee',
  americano:     'coffee',
  latte:         'coffee',
  starbucks:     'coffee',
  pizza:         'pizza',
  burger:        'burger',
  sushi:         'sushi',
  salad:         'salad',
  gym:           'boxing-gloves',
  subscription:  'subscription',
  netflix:       'subscription',
  spotify:       'subscription',
  rent:          'house',
  mortgage:      'house',
  salary:        'money',
  paycheck:      'money',
  transfer:      'bank',
  uber:          'taxi',
  lyft:          'taxi',
  taxi:          'taxi',
  train:         'train',
  bus:           'bus',
  flight:        'airplane',
  hotel:         'hotel',
  travel:        'suitcase',
  insurance:     'insurance',
  phone:         'smartphone',
  internet:      'wifi',
  wifi:          'wifi',
  laptop:        'laptop',
  headphones:    'headphones',
  camera:        'camera',
  book:          'book',
  education:     'book',
  cocktail:      'cocktail',
  bar:           'cocktail',
  gas:           'gas-station',
  fuel:          'gas-station',
  bike:          'bicycle',
  bicycle:       'bicycle',
  running:       'running',
  yoga:          'yoga',
  dumbbell:      'dumbbell',
  treadmill:     'treadmill',
  pet:           'dog',
  dog:           'dog',
  cat:           'cat',
  gift:          'gift',
  watch:         'watch',
  sneakers:      'sneakers',
  shoes:         'sneakers',
  jewelry:       'ring',
  diamond:       'diamond',

  // Food extras
  lunch:         'restaurant',
  dinner:        'restaurant',
  breakfast:     'coffee',
  brunch:        'restaurant',
  taco:          'burger',
  ramen:         'sushi',
  sandwich:      'burger',
  beer:          'cocktail',
  wine:          'cocktail',
  whiskey:       'cocktail',
  drink:         'cocktail',

  // Shopping extras
  amazon:        'shopping-bag',
  target:        'shopping-bag',
  walmart:       'supermarket',
  costco:        'supermarket',
  trader:        'supermarket',
  whole:         'supermarket',
  ikea:          'house',

  // Health extras
  doctor:        'ambulance',
  dentist:       'ambulance',
  pharmacy:      'ambulance',
  prescription:  'ambulance',
  vet:           'dog',

  // Transport extras
  parking:       'car',
  toll:          'car',
  metro:         'train',
  subway:        'train',

  // Misc
  music:         'headphones',
  game:          'movie',
  concert:       'movie',
  donation:      'gift',
  charity:       'gift',
}

const CACHE_PREFIX = 'cent_img_'

function getCached(slug: string): string | null {
  try {
    return localStorage.getItem(CACHE_PREFIX + slug)
  } catch {
    return null
  }
}

function setCache(slug: string, dataUrl: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + slug, dataUrl)
  } catch {
    // storage full — skip
  }
}

const CORE_CATEGORIES = new Set([
  'Dining', 'Fitness', 'Income', 'Shopping', 'Transport',
  'Groceries', 'Entertainment', 'Health', 'Housing', 'Utilities', 'Other',
])

export function getImageSlug(category: string, name: string): string {
  // Core category always wins
  if (CORE_CATEGORIES.has(category) && CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category]!
  }

  const lname = name.toLowerCase()
  // Check name keywords
  for (const [kw, slug] of Object.entries(CATEGORY_MAP)) {
    if (CORE_CATEGORIES.has(kw)) continue // skip category keys in keyword pass
    if (lname.includes(kw)) return slug
  }

  return CATEGORY_MAP[category] ?? 'credit-card'
}

export function getImageUrl(slug: string): string {
  return THING_IMAGES[slug] ?? THING_IMAGES['credit-card']!
}

export async function preloadAndCache(slug: string): Promise<string> {
  const cached = getCached(slug)
  if (cached) return cached

  const url = getImageUrl(slug)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/webp', 0.7)
          setCache(slug, dataUrl)
          resolve(dataUrl)
        } else {
          resolve(url)
        }
      } catch {
        resolve(url)
      }
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
}
