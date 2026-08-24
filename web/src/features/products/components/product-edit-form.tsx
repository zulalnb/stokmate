import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import { ProductForm } from '@/features/products/components/product-form'
import { useUpdateProduct } from '@/features/products/hooks/use-products'
import type { ProductDetail } from '@/lib/types'

function formatKurusInput(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ProductEditForm({ product }: { product: ProductDetail }) {
  const updateMutation = useUpdateProduct(product.id)

  const apiErrorMessage =
    updateMutation.error instanceof ApiError ? updateMutation.error.message : undefined

  return (
    <ProductForm
      requireDirty
      submitLabel="Kaydet"
      submittingLabel="Kaydediliyor…"
      isSubmitting={updateMutation.isPending}
      apiErrorMessage={apiErrorMessage}
      defaultValues={{
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? '',
        categoryId: String(product.categoryId),
        brandId: String(product.brandId),
        supplierId: String(product.supplierId),
        price: formatKurusInput(product.price),
        costPrice: formatKurusInput(product.costPrice),
        stock: String(product.stock),
        minStock: String(product.minStock),
        unit: String(product.unit),
        status: String(product.status),
        description: product.description ?? '',
        isFeatured: product.isFeatured,
      }}
      onSubmit={(payload) => {
        updateMutation.mutate(payload, {
          onSuccess: () => toast.success('Ürün güncellendi.'),
        })
      }}
    />
  )
}
