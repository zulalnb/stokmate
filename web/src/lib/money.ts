export const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
})

export function formatKurus(kurus: number): string {
  return currencyFormatter.format(kurus / 100)
}

export function parseKurus(input: string): number {
  const cleaned = input.trim().replace(/[^\d,.-]/g, '')
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  const amount = Number.parseFloat(normalized)
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100)
}
