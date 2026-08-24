import { queryOptions, useQuery } from '@tanstack/react-query'

import { categoriesService } from '@/api/services/categories.service'

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  })

export function useCategories() {
  return useQuery(categoriesQuery())
}
