import { queryOptions, useQuery } from '@tanstack/react-query'

import { statsService } from '@/api/services/stats.service'
import { PRODUCTS_REFETCH_INTERVAL_MS } from '@/lib/constants'

export const statsQuery = () =>
  queryOptions({
    queryKey: ['stats'],
    queryFn: statsService.getStats,
    refetchInterval: PRODUCTS_REFETCH_INTERVAL_MS,
  })

export function useStats() {
  return useQuery(statsQuery())
}
