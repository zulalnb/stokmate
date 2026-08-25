import { useQuery } from '@tanstack/react-query';

import { brandsService } from '@/api/services/brands.service';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: brandsService.getBrands,
  });
}
