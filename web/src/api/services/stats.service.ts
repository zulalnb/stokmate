import type { ProductStats } from '@/lib/types'

import { apiClient } from '../axios-client'

export const statsService = {
  getStats: () => apiClient.get<ProductStats>('/products/stats').then((res) => res.data),
}
