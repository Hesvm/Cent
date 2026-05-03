import { describe, it, expect } from 'vitest'
import { inferCategory, normalizeDigits } from './useAIParsing'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategory(input: string): string | null {
  return inferCategory(input).category
}

// ─── Regression tests — known false positives ─────────────────────────────────

describe('Alcohol & Bars — false positive regressions', () => {
  it('protein bar → Groceries, not Alcohol & Bars', () => {
    expect(getCategory('protein bar 5')).not.toBe('Alcohol & Bars')
  })

  it('energy bar → Groceries, not Alcohol & Bars', () => {
    expect(getCategory('energy bar 3')).not.toBe('Alcohol & Bars')
  })

  it('granola bar → not Alcohol & Bars', () => {
    expect(getCategory('granola bar 2')).not.toBe('Alcohol & Bars')
  })

  it('cereal bar → not Alcohol & Bars', () => {
    expect(getCategory('cereal bar 1.5')).not.toBe('Alcohol & Bars')
  })
})

// ─── Loans & Lending ──────────────────────────────────────────────────────────

describe('Loans & Lending', () => {
  it('lent → Loans & Lending', () => {
    expect(getCategory('lent John 200')).toBe('Loans & Lending')
  })

  it('lend → Loans & Lending', () => {
    expect(getCategory('lend Mark 50')).toBe('Loans & Lending')
  })

  it('borrow → Loans & Lending', () => {
    expect(getCategory('borrow 100')).toBe('Loans & Lending')
  })

  it('borrowed → Loans & Lending', () => {
    expect(getCategory('borrowed from Ali 300')).toBe('Loans & Lending')
  })

  it('owe → Loans & Lending', () => {
    expect(getCategory('I owe Sarah 50')).toBe('Loans & Lending')
  })

  it('paid back → Loans & Lending', () => {
    expect(getCategory('paid back Mark 150')).toBe('Loans & Lending')
  })

  it('iou → Loans & Lending', () => {
    expect(getCategory('iou 80')).toBe('Loans & Lending')
  })

  it('Dutch: schuld → Loans & Lending', () => {
    expect(getCategory('schuld 200')).toBe('Loans & Lending')
  })

  it('Dutch: geleend → Loans & Lending', () => {
    expect(getCategory('geleend van Mark 150')).toBe('Loans & Lending')
  })

  it('Persian: قرض → Loans & Lending', () => {
    expect(getCategory('قرض 500000')).toBe('Loans & Lending')
  })

  it('Persian: بدهی → Loans & Lending', () => {
    expect(getCategory('بدهی 200000')).toBe('Loans & Lending')
  })
})

// ─── Ambiguous — should not be over-classified ────────────────────────────────

describe('Ambiguous inputs — should not misclassify', () => {
  it('"bar" alone still matches Alcohol & Bars (legitimate)', () => {
    expect(getCategory('bar 50')).toBe('Alcohol & Bars')
  })

  it('cocktail bar → Alcohol & Bars', () => {
    expect(getCategory('cocktail bar 30')).toBe('Alcohol & Bars')
  })
})

// ─── Core categories — should still resolve correctly ─────────────────────────

describe('Core category matches', () => {
  it('netflix → Streaming & Subscriptions', () => {
    expect(getCategory('netflix 15')).toBe('Streaming & Subscriptions')
  })

  it('spotify → Streaming & Subscriptions', () => {
    expect(getCategory('spotify 10')).toBe('Streaming & Subscriptions')
  })

  it('albert heijn → Groceries', () => {
    expect(getCategory('albert heijn 45')).toBe('Groceries')
  })

  it('ikea → Shopping', () => {
    expect(getCategory('ikea 400')).toBe('Shopping')
  })

  it('gym → Fitness & Sports', () => {
    expect(getCategory('gym 30')).toBe('Fitness & Sports')
  })

  it('apotheek → Health & Medical', () => {
    expect(getCategory('apotheek 12')).toBe('Health & Medical')
  })

  it('huur → Housing & Rent', () => {
    expect(getCategory('huur 1200')).toBe('Housing & Rent')
  })

  it('klm → Travel', () => {
    expect(getCategory('klm flight 200')).toBe('Travel')
  })
})

// ─── Persian: normalizeDigits ─────────────────────────────────────────────────

describe('normalizeDigits', () => {
  it('converts Eastern Arabic digits (۰-۹) to ASCII', () => {
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789')
  })

  it('converts Arabic-Indic digits (٠-٩) to ASCII', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789')
  })

  it('leaves ASCII digits and plain text unchanged', () => {
    expect(normalizeDigits('coffee 50')).toBe('coffee 50')
  })

  it('converts digits inside Persian text', () => {
    expect(normalizeDigits('تاکسی ۳۰۰۰۰')).toBe('تاکسی 30000')
  })

  it('handles mixed Persian and Arabic-Indic digits', () => {
    expect(normalizeDigits('قهوه ٢۵۰۰۰')).toBe('قهوه 25000')
  })

  it('handles empty string', () => {
    expect(normalizeDigits('')).toBe('')
  })
})

// ─── Persian: single keywords with Persian numeral amounts ────────────────────

describe('Persian keywords — inferCategory with Persian digit amounts', () => {
  it('تاکسی ۳۰۰۰۰ → Transport', () => expect(getCategory('تاکسی ۳۰۰۰۰')).toBe('Transport'))
  it('قهوه ۲۵۰۰۰ → Coffee & Cafés', () => expect(getCategory('قهوه ۲۵۰۰۰')).toBe('Coffee & Cafés'))
  it('اجاره ۱۲۰۰۰۰۰ → Housing & Rent', () => expect(getCategory('اجاره ۱۲۰۰۰۰۰')).toBe('Housing & Rent'))
  it('بنزین ۶۰۰۰۰ → Transport', () => expect(getCategory('بنزین ۶۰۰۰۰')).toBe('Transport'))
  it('داروخانه ۳۵۰۰۰ → Health & Medical', () => expect(getCategory('داروخانه ۳۵۰۰۰')).toBe('Health & Medical'))
  it('رستوران ۱۲۳۴۵ → Restaurants & Dining', () => expect(getCategory('رستوران ۱۲۳۴۵')).toBe('Restaurants & Dining'))
})

// ─── Persian: COMPOUND_OVERRIDES ─────────────────────────────────────────────

describe('Persian COMPOUND_OVERRIDES', () => {
  it('قرض دادن → Loans & Lending', () => expect(getCategory('قرض دادن ۵۰۰۰۰۰')).toBe('Loans & Lending'))
  it('قرض گرفتن → Loans & Lending', () => expect(getCategory('قرض گرفتن از علی ۲۰۰۰۰۰')).toBe('Loans & Lending'))
  it('خرید خواربار → Groceries', () => expect(getCategory('خرید خواربار ۴۵۰۰۰۰')).toBe('Groceries'))
  it('خرید مواد غذایی → Groceries', () => expect(getCategory('خرید مواد غذایی ۳۰۰۰۰۰')).toBe('Groceries'))
  it('درآمد اجاره → Rental Income', () => expect(getCategory('درآمد اجاره ۴۰۰۰۰۰۰')).toBe('Rental Income'))
  it('اجاره دریافتی → Rental Income', () => expect(getCategory('اجاره دریافتی ماهانه')).toBe('Rental Income'))
  it('بیمه ماشین → Insurance', () => expect(getCategory('بیمه ماشین ۳۵۰۰۰۰')).toBe('Insurance'))
  it('بیمه درمان → Insurance', () => expect(getCategory('بیمه درمان ۵۰۰۰۰۰')).toBe('Insurance'))
  it('شارژ موبایل → Utilities (not Housing & Rent)', () => expect(getCategory('شارژ موبایل ۵۰۰۰۰')).toBe('Utilities'))
  it('شارژ ایرانسل → Utilities', () => expect(getCategory('شارژ ایرانسل ۱۰۰۰۰۰')).toBe('Utilities'))
  it('شارژ اینترنت → Utilities', () => expect(getCategory('شارژ اینترنت ماهانه')).toBe('Utilities'))
  it('آب معدنی → Groceries (not Utilities)', () => expect(getCategory('آب معدنی ۵۰۰۰')).toBe('Groceries'))
  it('خرید لباس → Shopping', () => expect(getCategory('خرید لباس ۵۰۰۰۰۰')).toBe('Shopping'))
  it('خرید کفش → Shopping', () => expect(getCategory('خرید کفش ۳۰۰۰۰۰')).toBe('Shopping'))
  it('کافی شاپ → Coffee & Cafés', () => expect(getCategory('کافی شاپ نزدیک خونه')).toBe('Coffee & Cafés'))
  it('فست فود → Restaurants & Dining', () => expect(getCategory('فست فود ۹۰۰۰۰')).toBe('Restaurants & Dining'))
  it('فست‌فود (ZWNJ) → Restaurants & Dining', () => expect(getCategory('شام فست‌فود ۸۰۰۰۰')).toBe('Restaurants & Dining'))
  it('اجاره خانه → Housing & Rent', () => expect(getCategory('اجاره خانه ماهانه')).toBe('Housing & Rent'))
  it('بلیط هواپیما → Transport', () => expect(getCategory('بلیط هواپیما ۳۰۰۰۰۰۰')).toBe('Transport'))
  it('بلیط قطار → Transport', () => expect(getCategory('بلیط قطار ۵۰۰۰۰۰')).toBe('Transport'))
  it('ارز دیجیتال → Investments', () => expect(getCategory('ارز دیجیتال ۵۰۰۰۰۰۰')).toBe('Investments'))
  it('بیت کوین → Investments', () => expect(getCategory('بیت کوین ۱۰۰۰۰۰۰')).toBe('Investments'))
  it('مهد کودک → Childcare & Kids', () => expect(getCategory('مهد کودک ۳۰۰۰۰۰')).toBe('Childcare & Kids'))
  it('پول پس دادن → Loans & Lending', () => expect(getCategory('پول پس دادن به مریم')).toBe('Loans & Lending'))
})

// ─── Persian: ساده و مستقیم (simple direct) ──────────────────────────────────

describe('Persian phrases — ساده و مستقیم', () => {
  it('نون → Groceries', () => expect(getCategory('نون 5000')).toBe('Groceries'))
  it('تاکسی → Transport', () => expect(getCategory('تاکسی 30000')).toBe('Transport'))
  it('قهوه → Coffee & Cafés', () => expect(getCategory('قهوه 25000')).toBe('Coffee & Cafés'))
  it('بنزین → Transport', () => expect(getCategory('بنزین 500000')).toBe('Transport'))
  it('ناهار → Restaurants & Dining', () => expect(getCategory('ناهار 80000')).toBe('Restaurants & Dining'))
  it('شام → Restaurants & Dining', () => expect(getCategory('شام 120000')).toBe('Restaurants & Dining'))
  it('آب معدنی → Groceries', () => expect(getCategory('آب معدنی 5000')).toBe('Groceries'))
  it('شارژ موبایل → Utilities', () => expect(getCategory('شارژ موبایل 50000')).toBe('Utilities'))
  it('بلیط مترو → Transport', () => expect(getCategory('بلیط مترو 10000')).toBe('Transport'))
  it('کرایه → Transport', () => expect(getCategory('کرایه 25000')).toBe('Transport'))
})

// ─── Persian: کمی توضیح‌دار (slightly descriptive) ───────────────────────────

describe('Persian phrases — کمی توضیح‌دار', () => {
  it('نون بربری سر کوچه → Groceries', () => expect(getCategory('نون بربری سر کوچه 5000')).toBe('Groceries'))
  it('قهوه از کافه → Coffee & Cafés', () => expect(getCategory('قهوه از کافه 35000')).toBe('Coffee & Cafés'))
  it('بنزین زدم → Transport', () => expect(getCategory('بنزین زدم 500000')).toBe('Transport'))
  it('ناهار شرکت → Restaurants & Dining', () => expect(getCategory('ناهار شرکت 60000')).toBe('Restaurants & Dining'))
  it('شام بیرون → Restaurants & Dining', () => expect(getCategory('شام بیرون 90000')).toBe('Restaurants & Dining'))
  it('خرید سوپرمارکت → Groceries', () => expect(getCategory('خرید سوپرمارکت 200000')).toBe('Groceries'))
  it('شارژ ایرانسل → Utilities', () => expect(getCategory('شارژ ایرانسل 100000')).toBe('Utilities'))
  it('بلیط مترو امروز → Transport', () => expect(getCategory('بلیط مترو امروز 10000')).toBe('Transport'))
  it('تاکسی تا خونه → Transport', () => expect(getCategory('تاکسی تا خونه 30000')).toBe('Transport'))
  it('خرید میوه → Groceries', () => expect(getCategory('خرید میوه 80000')).toBe('Groceries'))
})

// ─── Persian: محاوره‌ای (colloquial) ─────────────────────────────────────────

describe('Persian phrases — محاوره‌ای', () => {
  it('یه قهوه گرفتم → Coffee & Cafés', () => expect(getCategory('یه قهوه گرفتم 25000')).toBe('Coffee & Cafés'))
  it('با اسنپ رفتم → Transport', () => expect(getCategory('با اسنپ رفتم 30000')).toBe('Transport'))
  it('یه چیزی از سوپر گرفتم → Groceries', () => expect(getCategory('یه چیزی از سوپر گرفتم 50000')).toBe('Groceries'))
  it('ناهار گرفتم بیرون → Restaurants & Dining', () => expect(getCategory('ناهار گرفتم بیرون 70000')).toBe('Restaurants & Dining'))
  it('یه خورده خرید کردم → Shopping', () => expect(getCategory('یه خورده خرید کردم 150000')).toBe('Shopping'))
  it('پول بنزین دادم → Transport', () => expect(getCategory('پول بنزین دادم 500000')).toBe('Transport'))
  it('شام زدیم بیرون → Restaurants & Dining', () => expect(getCategory('شام زدیم بیرون 100000')).toBe('Restaurants & Dining'))
  it('یه تنقلات گرفتم → Groceries', () => expect(getCategory('یه تنقلات گرفتم 30000')).toBe('Groceries'))
  it('کرایه دادم → Transport', () => expect(getCategory('کرایه دادم 20000')).toBe('Transport'))
  it('یه چیزایی خریدم → Shopping', () => expect(getCategory('یه چیزایی خریدم 200000')).toBe('Shopping'))
})

// ─── Persian: با جزئیات بیشتر (more detail) ──────────────────────────────────

describe('Persian phrases — با جزئیات بیشتر', () => {
  it('ناهار رستوران با بچه‌ها → Restaurants & Dining', () => expect(getCategory('ناهار رستوران با بچه‌ها 300000')).toBe('Restaurants & Dining'))
  it('خرید میوه و سبزی → Groceries', () => expect(getCategory('خرید میوه و سبزی 120000')).toBe('Groceries'))
  it('بنزین ماشین پر کردم → Transport', () => expect(getCategory('بنزین ماشین پر کردم 500000')).toBe('Transport'))
  it('قهوه و کیک کافه → Coffee & Cafés', () => expect(getCategory('قهوه و کیک کافه 60000')).toBe('Coffee & Cafés'))
  it('خرید خونه از دیجی‌کالا → Shopping', () => expect(getCategory('خرید خونه از دیجی‌کالا 2000000')).toBe('Shopping'))
  it('پرداخت قبض برق → Utilities', () => expect(getCategory('پرداخت قبض برق 120000')).toBe('Utilities'))
  it('شارژ اینترنت ماهانه → Utilities', () => expect(getCategory('شارژ اینترنت ماهانه 300000')).toBe('Utilities'))
  it('خرید دارو از داروخانه → Health & Medical', () => expect(getCategory('خرید دارو از داروخانه 80000')).toBe('Health & Medical'))
  it('تاکسی تا شرکت → Transport', () => expect(getCategory('تاکسی تا شرکت 35000')).toBe('Transport'))
  it('شام فست‌فود → Restaurants & Dining', () => expect(getCategory('شام فست‌فود 90000')).toBe('Restaurants & Dining'))
})

// ─── Persian: طولانی (longer descriptive) ────────────────────────────────────

describe('Persian phrases — طولانی', () => {
  it('ناهار رستوران نزدیک شرکت → Restaurants & Dining', () => expect(getCategory('امروز ناهار با علی رفتیم رستوران نزدیک شرکت')).toBe('Restaurants & Dining'))
  it('خرید هفتگی سوپر → Groceries', () => expect(getCategory('خرید هفتگی سوپرمارکت برای خونه')).toBe('Groceries'))
  it('بنزین زدم with reason → Transport', () => expect(getCategory('بنزین زدم چون نزدیک خالی شدن بود')).toBe('Transport'))
  it('قهوه with reason → Coffee & Cafés', () => expect(getCategory('قهوه گرفتم چون خیلی خوابم میومد')).toBe('Coffee & Cafés'))
  it('داروخانه with context → Health & Medical', () => expect(getCategory('یه سری وسایل بهداشتی از داروخانه خریدم')).toBe('Health & Medical'))
  it('کرایه تاکسی → Transport', () => expect(getCategory('کرایه تاکسی از خونه تا محل کار')).toBe('Transport'))
  it('شام با خانواده → Restaurants & Dining', () => expect(getCategory('شام بیرون با خانواده')).toBe('Restaurants & Dining'))
  it('خرید آنلاین لباس → Shopping', () => expect(getCategory('خرید آنلاین لباس')).toBe('Shopping'))
  it('قبض آب این ماه → Utilities', () => expect(getCategory('پرداخت قبض آب این ماه')).toBe('Utilities'))
  it('شارژ اینترنت برای کار → Utilities', () => expect(getCategory('شارژ اینترنت برای کار')).toBe('Utilities'))
})

// ─── Persian: مبهم / ناقص (vague / incomplete) ───────────────────────────────

describe('Persian phrases — مبهم/ناقص (ambiguous → null, goes to LLM)', () => {
  it('اینم رفت → null', () => expect(getCategory('اینم رفت 50000')).toBeNull())
  it('پول دادم → null', () => expect(getCategory('پول دادم 100000')).toBeNull())
  it('خرج شد → null', () => expect(getCategory('خرج شد 80000')).toBeNull())
  it('یادم نیست چی بود → null', () => expect(getCategory('یادم نیست چی بود')).toBeNull())
  it('یه چیزی خریدم → Shopping', () => expect(getCategory('یه چیزی خریدم 50000')).toBe('Shopping'))
  it('الکی خرج شد → null', () => expect(getCategory('الکی خرج شد')).toBeNull())
  it('این چرا انقدر شد → null', () => expect(getCategory('این چرا انقدر شد')).toBeNull())
  it('فکر کنم خوراکی بود → null', () => expect(getCategory('فکر کنم خوراکی بود')).toBeNull())
  it('شاید بنزین → Transport', () => expect(getCategory('شاید بنزین 200000')).toBe('Transport'))
  it('یه چیزی برای خونه → null', () => expect(getCategory('یه چیزی برای خونه 100000')).toBeNull())
})

// ─── Persian: ترکیبی (combined inputs) ───────────────────────────────────────

describe('Persian phrases — ترکیبی', () => {
  it('ناهار + قهوه کافه → Restaurants & Dining (ناهار wins)', () => expect(getCategory('ناهار + قهوه کافه نزدیک شرکت')).toBe('Restaurants & Dining'))
  it('خرید میوه، نون، شیر → Groceries', () => expect(getCategory('خرید میوه، نون، شیر')).toBe('Groceries'))
  it('بنزین + کارواش → Transport', () => expect(getCategory('بنزین + کارواش')).toBe('Transport'))
  it('تاکسی + یه خرید کوچیک → Transport (تاکسی wins)', () => expect(getCategory('تاکسی + یه خرید کوچیک')).toBe('Transport'))
  it('شام + دسر → Restaurants & Dining', () => expect(getCategory('شام + دسر')).toBe('Restaurants & Dining'))
  it('خرید سوپر + تنقلات → Groceries', () => expect(getCategory('خرید سوپر + تنقلات')).toBe('Groceries'))
  it('دارو + ویزیت دکتر → Health & Medical', () => expect(getCategory('دارو + ویزیت دکتر')).toBe('Health & Medical'))
  it('قهوه + کیک → Coffee & Cafés', () => expect(getCategory('قهوه + کیک')).toBe('Coffee & Cafés'))
  it('خرید لباس + کفش → Shopping', () => expect(getCategory('خرید لباس + کفش')).toBe('Shopping'))
  it('اینترنت + شارژ → Utilities', () => expect(getCategory('اینترنت + شارژ')).toBe('Utilities'))
})

// ─── Persian: احساسی / نظر شخصی (emotional — no keywords → null) ─────────────

describe('Persian phrases — احساسی (emotional/opinion → null)', () => {
  it.each([
    'خیلی گرون شد',
    'ارزششو داشت',
    'الکی پول دادم',
    'بد نبود',
    'عالی بود',
    'خیلی زیاد شد',
    'اصلاً نمی‌ارزید',
    'مجبور شدم بخرم',
    'حال داد',
    'پشیمون شدم',
  ])('%s → null', (input) => expect(getCategory(input)).toBeNull())
})

// ─── Persian: واقعی messy (realistic messy input) ────────────────────────────

describe('Persian phrases — واقعی messy', () => {
  it('ناهار رستوران messy → Restaurants & Dining', () => expect(getCategory('ناهار امروز با بچه ها رستوران فلان')).toBe('Restaurants & Dining'))
  it('قهوه و کیک از کافه → Coffee & Cafés', () => expect(getCategory('یه قهوه و کیک کوچیک از کافه سر خیابون')).toBe('Coffee & Cafés'))
  it('بنزین با Persian numeral → Transport', () => expect(getCategory('بنزین زدم حدوداً ۴۰ لیتر')).toBe('Transport'))
  it('خرید سوپر with list → Groceries', () => expect(getCategory('خرید سوپرمارکت (نون، پنیر، تخم مرغ)')).toBe('Groceries'))
  it('شارژ اینترنت ایرانسل → Utilities', () => expect(getCategory('شارژ اینترنت ایرانسل یک ماهه')).toBe('Utilities'))
  it('تاکسی with reason → Transport', () => expect(getCategory('تاکسی گرفتم تا خونه چون دیر شده بود')).toBe('Transport'))
  it('دارو از داروخانه → Health & Medical', () => expect(getCategory('یه سری دارو از داروخانه نزدیک خونه')).toBe('Health & Medical'))
  it('شام فست فود با پیتزا → Restaurants & Dining', () => expect(getCategory('شام بیرون فست فود (پیتزا + نوشابه)')).toBe('Restaurants & Dining'))
  it('خرید آنلاین from دیجی‌کالا → Shopping', () => expect(getCategory('خرید آنلاین از دیجی کالا یه هدفون')).toBe('Shopping'))
  it('قبض برق with complaint → Utilities', () => expect(getCategory('پرداخت قبض برق که خیلی زیاد شده بود')).toBe('Utilities'))
})

// ─── Persian: edge cases ──────────────────────────────────────────────────────

describe('Persian phrases — edge cases (→ null)', () => {
  it.each([
    '...',
    '۱۲۳',
    '!!!',
    'هیچی',
    'تست',
    '؟؟؟',
    'abc',
    'خرج',
    'ثبت',
  ])('%s → null', (input) => expect(getCategory(input)).toBeNull())
})
