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

export const productsService = {
  getProducts: (page: number, pageSize: number) =>
    apiClient.get<ProductsResponse>(`/products?page=${page}&pageSize=${pageSize}`),
  getProduct: (id: number) => apiClient.get<ProductDetail>(`/products/${id}`),
  updateStock: (id: number, stock: number) => apiClient.patch<Product>(`/products/${id}/stock`, { stock }),
};
