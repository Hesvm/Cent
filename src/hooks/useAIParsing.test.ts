import { describe, it, expect } from 'vitest'
import { inferCategory } from './useAIParsing'

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
