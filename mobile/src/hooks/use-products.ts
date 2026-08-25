import { useInfiniteQuery } from '@tanstack/react-query';

import { productsService } from '@/api/services/products.service';

const PAGE_SIZE = 20;

export function useProducts() {
  return useInfiniteQuery({
    queryKey: ['products'],
    queryFn: ({ pageParam }) => productsService.getProducts(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
  });
}
