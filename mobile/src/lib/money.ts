 export const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
})

export function formatKurus(kurus: number): string {
  return currencyFormatter.format(kurus / 100)
}
