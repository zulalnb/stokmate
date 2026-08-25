export type ProductSort = {
  sort: 'name' | 'price' | 'stock' | 'updatedAt';
  dir: 'asc' | 'desc';
};

export type ProductFilters = {
  categoryId: number | null;
  brandId: number | null;
  status: number | null;
  sort: ProductSort | null;
};

let state: ProductFilters = {
  categoryId: null,
  brandId: null,
  status: null,
  sort: null,
};

const listeners = new Set<() => void>();

function setState(next: ProductFilters) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const productFiltersStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setFilters(filters: ProductFilters) {
    setState(filters);
  },
  reset() {
    setState({ categoryId: null, brandId: null, status: null, sort: null });
  },
};
