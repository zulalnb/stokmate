import { queryOptions, useQuery } from '@tanstack/react-query'

import { brandsService } from '@/api/services/brands.service'

export const brandsQuery = () =>
  queryOptions({
    queryKey: ['brands'],
    queryFn: brandsService.getBrands,
  })

export function useBrands() {
  return useQuery(brandsQuery())
}
