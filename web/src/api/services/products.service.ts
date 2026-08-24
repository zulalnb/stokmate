import type {
  Product,
  ProductDetail,
  ProductFilters,
  ProductListResponse,
  UpdateProductPayload,
} from '@/lib/types'

import { apiClient } from '../axios-client'

export const productsService = {
  getProducts: (filters: ProductFilters) =>
    apiClient.get<ProductListResponse>('/products', { params: filters }).then((res) => res.data),
  getProduct: (id: number) =>
    apiClient.get<ProductDetail>(`/products/${id}`).then((res) => res.data),
  updateProduct: (id: number, payload: UpdateProductPayload) =>
    apiClient.put<Product>(`/products/${id}`, payload).then((res) => res.data),
  updateProductStock: (id: number, stock: number) =>
    apiClient.patch<Product>(`/products/${id}/stock`, { stock }).then((res) => res.data),
}
