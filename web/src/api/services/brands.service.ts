import type { Brand } from '@/lib/types'

import { apiClient } from '../axios-client'

export const brandsService = {
  getBrands: () => apiClient.get<Brand[]>('/brands').then((res) => res.data),
}
