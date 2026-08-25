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

export const productsService = {
  getProducts: (page: number, pageSize: number) =>
    apiClient.get<ProductsResponse>(`/products?page=${page}&pageSize=${pageSize}`),
};
