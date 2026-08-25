export function formatKurus(kurus: number): string {
  return `${(kurus / 100).toFixed(2).replace('.', ',')} ₺`;
}
