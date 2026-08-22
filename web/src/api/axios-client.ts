import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL tanımlı değil. .env dosyasını kontrol edin.')
}

export const apiClient = axios.create({ baseURL })

// Tek istisna: /auth/refresh, bu instance ile interceptor'sız çağrılır.
// Aksi halde refresh isteğinin kendi 401'i response interceptor'ı yeniden
// tetikler ve sonsuz döngü oluşur.
export const refreshClient = axios.create({ baseURL })
