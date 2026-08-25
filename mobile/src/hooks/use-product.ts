import { useQuery } from '@tanstack/react-query';

import { productsService } from '@/api/services/products.service';

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsService.getProduct(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
