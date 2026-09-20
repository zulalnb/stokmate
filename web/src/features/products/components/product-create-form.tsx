import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { FormProvider, useForm } from 'react-hook-form'

import { toast } from '@/components/ui/toast'
import { ProductForm } from '@/features/products/components/product-form'
import {
  applyApiErrorToForm,
  productFormSchema,
  type ProductFormValues,
} from '@/features/products/components/product-form.schema'
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

  const formMethods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductFormValues,
  })

  return (
    <FormProvider {...formMethods}>
      <ProductForm
        submitLabel="Ürünü oluştur"
        submittingLabel="Oluşturuluyor…"
        isSubmitting={createMutation.isPending}
        onSubmit={(payload) => {
          createMutation.mutate(payload, {
            onSuccess: (product) => {
              toast.add({ title: 'Ürün oluşturuldu.', type: 'success' })
              navigate({ to: '/products/$id', params: { id: String(product.id) } })
            },
            onError: (error) => applyApiErrorToForm(formMethods.setError, formMethods.setFocus, error)
          })
        }}
      />
    </FormProvider>
  )
}
