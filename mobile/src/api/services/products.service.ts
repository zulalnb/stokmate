import { apiClient } from '../axios-client';

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
  getProducts: (page: number, pageSize: number, query: ProductsQuery = {}) =>
    apiClient
      .get<ProductsResponse>('/products', { params: { page, pageSize, ...query } })
      .then((res) => res.data),
  getProduct: (id: number) => apiClient.get<ProductDetail>(`/products/${id}`).then((res) => res.data),
  updateStock: (id: number, stock: number) =>
    apiClient.patch<Product>(`/products/${id}/stock`, { stock }).then((res) => res.data),
};
