export function formatKurus(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export function parseKurus(input: string): number {
  const cleaned = input.trim().replace(/[^\d,.-]/g, '')
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  const amount = Number.parseFloat(normalized)
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100)
}
