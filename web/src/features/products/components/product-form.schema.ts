import type { UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import { z } from 'zod'

import { ApiError } from '@/api/errors'
import { parseKurus } from '@/lib/money'
import type { UpdateProductPayload } from '@/lib/types'

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Ürün adı gerekli.'),
  sku: z.string().trim().min(1, 'Stok kodu gerekli.'),
  barcode: z.string().trim(),
  categoryId: z.string().min(1, 'Kategori seçin.'),
  brandId: z.string().min(1, 'Marka seçin.'),
  supplierId: z.string().min(1, 'Tedarikçi seçin.'),
  price: z.string().min(1, 'Fiyat gerekli.'),
  costPrice: z.string().min(1, 'Maliyet fiyatı gerekli.'),
  stock: z
    .string()
    .min(1, 'Stok gerekli.')
    .refine((val) => Number(val) >= 0, 'Stok negatif olamaz.'),
  minStock: z
    .string()
    .min(1, 'Kritik stok gerekli.')
    .refine((val) => Number(val) >= 0, 'Kritik stok negatif olamaz.'),
  unit: z.string().min(1, 'Birim seçin.'),
  status: z.string().min(1, 'Durum seçin.'),
  description: z.string().trim(),
  isFeatured: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export function buildProductPayload(values: ProductFormValues): UpdateProductPayload {
  return {
    name: values.name,
    sku: values.sku,
    barcode: values.barcode || undefined,
    categoryId: Number(values.categoryId),
    brandId: Number(values.brandId),
    supplierId: Number(values.supplierId),
    price: parseKurus(values.price),
    costPrice: parseKurus(values.costPrice),
    stock: Number(values.stock),
    minStock: Number(values.minStock),
    unit: Number(values.unit) as 1 | 2 | 3 | 4,
    status: Number(values.status) as 1 | 2 | 3,
    description: values.description || undefined,
    isFeatured: values.isFeatured,
  }
}

export function applyApiErrorToForm(
  setError: UseFormSetError<ProductFormValues>,
  setFocus: UseFormSetFocus<ProductFormValues>,
  error: unknown,
) {
  if (!(error instanceof ApiError)) {
    return
  }

  if (error.status === 409) {
    setError('sku', { type: 'server', message: error.message })
    setFocus('sku')
  } else {
    setError('root', { type: 'server', message: error.message })
  }
}
