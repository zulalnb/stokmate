import { useQuery } from '@tanstack/react-query';

import { categoriesService } from '@/api/services/categories.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });
}
