import { useSyncExternalStore } from 'react';

import { productFiltersStore } from '@/lib/product-filters-store';

export function useProductFilters() {
  return useSyncExternalStore(productFiltersStore.subscribe, productFiltersStore.getSnapshot);
}
