import { queryOptions, useQuery } from '@tanstack/react-query'

import { statsService } from '@/api/services/stats.service'

export const statsQuery = () =>
  queryOptions({ queryKey: ['stats'], queryFn: statsService.getStats })

export function useStats() {
  return useQuery(statsQuery())
}
