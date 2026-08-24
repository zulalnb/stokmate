import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import { ProductForm, type ProductFormValues } from '@/features/products/components/product-form'
import { useCreateProduct } from '@/features/products/hooks/use-products'

const emptyProductFormValues: ProductFormValues = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  brandId: '',
  supplierId: '',
  price: '',
  costPrice: '',
  stock: '0',
  minStock: '0',
  unit: '1',
  status: '1',
  description: '',
  isFeatured: false,
}

export function ProductCreateForm() {
  const navigate = useNavigate()
  const createMutation = useCreateProduct()

  const apiErrorMessage =
    createMutation.error instanceof ApiError ? createMutation.error.message : undefined

  return (
    <ProductForm
      submitLabel="Ürünü oluştur"
      submittingLabel="Oluşturuluyor…"
      isSubmitting={createMutation.isPending}
      apiErrorMessage={apiErrorMessage}
      defaultValues={emptyProductFormValues}
      onSubmit={(payload) => {
        createMutation.mutate(payload, {
          onSuccess: (product) => {
            toast.success('Ürün oluşturuldu.')
            navigate({ to: '/products/$id', params: { id: String(product.id) } })
          },
        })
      }}
    />
  )
}
