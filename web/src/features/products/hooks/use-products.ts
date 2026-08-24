import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productsService } from '@/api/services/products.service'
import type {
  CreateProductPayload,
  ProductDetail,
  ProductFilters,
  UpdateProductPayload,
} from '@/lib/types'

export const productsQuery = (filters: ProductFilters) =>
  queryOptions({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
  })

export function useProducts(filters: ProductFilters) {
  return useQuery(productsQuery(filters))
}

export const productQuery = (id: number) =>
  queryOptions({
    queryKey: ['product', id],
    queryFn: () => productsService.getProduct(id),
  })

export function useProduct(id: number) {
  return useQuery(productQuery(id))
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => productsService.updateProduct(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData<ProductDetail>(['product', id], (old) =>
        old ? { ...old, ...data } : old,
      )
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => productsService.deleteProduct(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
