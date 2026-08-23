import type { ProductFilters, ProductListResponse } from '@/lib/types'

import { apiClient } from '../axios-client'

export const productsService = {
  getProducts: (filters: ProductFilters) =>
    apiClient.get<ProductListResponse>('/products', { params: filters }).then((res) => res.data),
}
