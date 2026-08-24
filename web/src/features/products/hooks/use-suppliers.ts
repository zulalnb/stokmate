import { queryOptions, useQuery } from '@tanstack/react-query'

import { suppliersService } from '@/api/services/suppliers.service'

export const suppliersQuery = () =>
  queryOptions({
    queryKey: ['suppliers'],
    queryFn: suppliersService.getSuppliers,
  })

export function useSuppliers() {
  return useQuery(suppliersQuery())
}
