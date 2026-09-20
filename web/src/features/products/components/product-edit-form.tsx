import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { toast } from '@/components/ui/toast'
import { ProductForm } from '@/features/products/components/product-form'
import {
  applyApiErrorToForm,
  productFormSchema,
  type ProductFormValues,
} from '@/features/products/components/product-form.schema'
import { useUpdateProduct } from '@/features/products/hooks/use-products'
import { formatKurusInput } from '@/lib/money'
import type { ProductDetail } from '@/lib/types'

export function ProductEditForm({ product }: { product: ProductDetail }) {
  const updateMutation = useUpdateProduct(product.id)

  const formMethods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
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
    },
  })

  return (
    <FormProvider {...formMethods}>
      <ProductForm
        submitLabel="Kaydet"
        submittingLabel="Kaydediliyor…"
        isSubmitting={updateMutation.isPending}
        onSubmit={(payload) => {
          updateMutation.mutate(payload, {
            onSuccess: () => toast.add({ title: 'Ürün güncellendi.', type: 'success' }),
            onError: (error) =>
              applyApiErrorToForm(formMethods.setError, formMethods.setFocus, error),
          })
        }}
      />
    </FormProvider>
  )
}
