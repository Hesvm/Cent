export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('$', '')
    .trim()
}

export function formatAmount(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat('en-US').format(amount)
  }
  return String(amount)
}
