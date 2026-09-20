export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Girdiğiniz bilgilerde bir sorun var. Lütfen alanları kontrol edip tekrar deneyin.',
  404: 'Aradığınız kayıt bulunamadı.',
  409: 'Bu SKU başka bir üründe kullanılıyor. Lütfen farklı bir SKU girin.',
  500: 'Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
}

export function getErrorMessage(status: number): string {
  return STATUS_MESSAGES[status] ?? 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
}
