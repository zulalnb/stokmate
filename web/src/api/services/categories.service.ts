import type { Category } from '@/lib/types'

import { apiClient } from '../axios-client'

export const categoriesService = {
  getCategories: () => apiClient.get<Category[]>('/categories').then((res) => res.data),
}
