import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { productsService } from '@/api/services/products.service';

export function useUpdateStock(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stock: number) => productsService.updateStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Toast.show({ type: 'success', text1: 'Stok güncellendi' });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Stok güncellenemedi',
        text2: error instanceof Error ? error.message : undefined,
      });
    },
  });
}
