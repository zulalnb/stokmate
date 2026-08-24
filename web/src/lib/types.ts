export interface AuthUser {
  id: number
  email: string
  fullName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface Product {
  id: number
  name: string
  sku: string
  barcode: string
  imageUrl: string
  categoryId: number
  categoryName: string
  brandId: number
  brandName: string
  price: number
  stock: number
  minStock: number
  unit: number
  status: number
  isFeatured: boolean
  updatedAt: string
}

export interface ProductFilters {
  q?: string
  categoryId?: number
  brandId?: number
  status?: number
  page?: number
  pageSize?: number
  sort?: 'name' | 'price' | 'stock' | 'updatedAt'
  dir?: 'asc' | 'desc'
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  pageSize: number
}

export interface ProductDetail extends Product {
  costPrice: number
  supplierId: number
  description: string
}

export interface UpdateProductPayload {
  name: string
  sku: string
  barcode?: string
  categoryId: number
  brandId: number
  supplierId: number
  price: number
  costPrice: number
  stock: number
  minStock: number
  unit: 1 | 2 | 3 | 4
  status: 1 | 2 | 3
  description?: string | null
  isFeatured?: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  sortOrder: number
}

export interface Brand {
  id: number
  name: string
}

export interface Supplier {
  id: number
  name: string
  contactName: string
  phone: string
  email: string
  city: string
}
