import { apiClient } from '../client';

export type Product = {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  price: number;
  stock: number;
  minStock: number;
  unit: number;
  status: number;
  isFeatured: boolean;
  updatedAt: string;
};

export type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProductDetail = Product & {
  supplierId: number;
  costPrice: number;
  description: string;
};

export type ProductsQuery = {
  q?: string;
  categoryId?: number | null;
  brandId?: number | null;
  status?: number | null;
  sort?: 'name' | 'price' | 'stock' | 'updatedAt';
  dir?: 'asc' | 'desc';
};

export const productsService = {
  getProducts: (page: number, pageSize: number, query: ProductsQuery = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (query.q) params.set('q', query.q);
    if (query.categoryId) params.set('categoryId', String(query.categoryId));
    if (query.brandId) params.set('brandId', String(query.brandId));
    if (query.status) params.set('status', String(query.status));
    if (query.sort) params.set('sort', query.sort);
    if (query.dir) params.set('dir', query.dir);
    return apiClient.get<ProductsResponse>(`/products?${params.toString()}`);
  },
  getProduct: (id: number) => apiClient.get<ProductDetail>(`/products/${id}`),
  updateStock: (id: number, stock: number) => apiClient.patch<Product>(`/products/${id}/stock`, { stock }),
};
