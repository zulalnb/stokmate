import { useMutation, useQueryClient } from '@tanstack/react-query';

import { productsService } from '@/api/services/products.service';

export function useUpdateStock(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stock: number) => productsService.updateStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
