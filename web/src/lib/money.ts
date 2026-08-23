export function formatKurus(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}
