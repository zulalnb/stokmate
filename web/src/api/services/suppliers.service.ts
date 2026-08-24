import type { Supplier } from '@/lib/types'

import { apiClient } from '../axios-client'

export const suppliersService = {
  getSuppliers: () => apiClient.get<Supplier[]>('/suppliers').then((res) => res.data),
}
