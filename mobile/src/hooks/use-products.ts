import { useInfiniteQuery } from '@tanstack/react-query';

import { type ProductsQuery, productsService } from '@/api/services/products.service';

const PAGE_SIZE = 20;

export function useProducts(query: ProductsQuery = {}) {
  return useInfiniteQuery({
    queryKey: ['products', query],
    queryFn: ({ pageParam }) => productsService.getProducts(pageParam, PAGE_SIZE, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
  });
}
