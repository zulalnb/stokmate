import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { suppliersQuery } from '@/features/products/hooks/use-suppliers'
import { useUpdateProduct } from '@/features/products/hooks/use-products'
import { STATUS_LABELS, UNIT_LABELS } from '@/lib/enums'
import { parseKurus } from '@/lib/money'
import type { ProductDetail, UpdateProductPayload } from '@/lib/types'

const editProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli.'),
  sku: z.string().min(1, 'Stok kodu gerekli.'),
  barcode: z.string(),
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
  description: z.string(),
  isFeatured: z.boolean(),
})

type EditProductFormValues = z.infer<typeof editProductSchema>

function formatKurusInput(kurus: number): string {
  return (kurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ProductEditForm({ product }: { product: ProductDetail }) {
  const { data: categories } = useSuspenseQuery(categoriesQuery())
  const { data: brands } = useSuspenseQuery(brandsQuery())
  const { data: suppliers } = useSuspenseQuery(suppliersQuery())
  const updateMutation = useUpdateProduct(product.id)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
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

  function onSubmit(values: EditProductFormValues) {
    const payload: UpdateProductPayload = {
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

    updateMutation.mutate(payload, {
      onSuccess: () => toast.success('Ürün güncellendi.'),
    })
  }

  const apiErrorMessage =
    updateMutation.error instanceof ApiError ? updateMutation.error.message : undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Ürün adı</FieldLabel>
            <FieldContent>
              <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.sku}>
            <FieldLabel htmlFor="sku">Stok kodu</FieldLabel>
            <FieldContent>
              <Input id="sku" aria-invalid={!!errors.sku} {...register('sku')} />
              <FieldError errors={[errors.sku]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="barcode">Barkod</FieldLabel>
            <FieldContent>
              <Input id="barcode" {...register('barcode')} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel htmlFor="categoryId">Kategori</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={categories.map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    }))}
                  >
                    <SelectTrigger id="categoryId" aria-invalid={!!errors.categoryId} className="w-full">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.categoryId]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.brandId}>
            <FieldLabel htmlFor="brandId">Marka</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={brands.map((brand) => ({ value: String(brand.id), label: brand.name }))}
                  >
                    <SelectTrigger id="brandId" aria-invalid={!!errors.brandId} className="w-full">
                      <SelectValue placeholder="Marka seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={String(brand.id)}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.brandId]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.supplierId}>
            <FieldLabel htmlFor="supplierId">Tedarikçi</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={suppliers.map((supplier) => ({
                      value: String(supplier.id),
                      label: supplier.name,
                    }))}
                  >
                    <SelectTrigger id="supplierId" aria-invalid={!!errors.supplierId} className="w-full">
                      <SelectValue placeholder="Tedarikçi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.supplierId]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Satış fiyatı (₺)</FieldLabel>
            <FieldContent>
              <Input id="price" inputMode="decimal" aria-invalid={!!errors.price} {...register('price')} />
              <FieldError errors={[errors.price]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.costPrice}>
            <FieldLabel htmlFor="costPrice">Maliyet fiyatı (₺)</FieldLabel>
            <FieldContent>
              <Input
                id="costPrice"
                inputMode="decimal"
                aria-invalid={!!errors.costPrice}
                {...register('costPrice')}
              />
              <FieldError errors={[errors.costPrice]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.stock}>
            <FieldLabel htmlFor="stock">Stok</FieldLabel>
            <FieldContent>
              <Input id="stock" type="number" aria-invalid={!!errors.stock} {...register('stock')} />
              <FieldError errors={[errors.stock]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.minStock}>
            <FieldLabel htmlFor="minStock">Kritik stok eşiği</FieldLabel>
            <FieldContent>
              <Input
                id="minStock"
                type="number"
                aria-invalid={!!errors.minStock}
                {...register('minStock')}
              />
              <FieldError errors={[errors.minStock]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.unit}>
            <FieldLabel htmlFor="unit">Birim</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={Object.entries(UNIT_LABELS).map(([value, label]) => ({ value, label }))}
                  >
                    <SelectTrigger id="unit" aria-invalid={!!errors.unit} className="w-full">
                      <SelectValue placeholder="Birim seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(UNIT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.unit]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.status}>
            <FieldLabel htmlFor="status">Durum</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                  >
                    <SelectTrigger id="status" aria-invalid={!!errors.status} className="w-full">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Açıklama</FieldLabel>
          <FieldContent>
            <Textarea id="description" rows={4} {...register('description')} />
          </FieldContent>
        </Field>

        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <FieldLabel htmlFor="isFeatured">
              <Field orientation="horizontal">
                <Checkbox
                  id="isFeatured"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldContent>
                  <FieldTitle>Öne çıkan ürün</FieldTitle>
                </FieldContent>
              </Field>
            </FieldLabel>
          )}
        />

        {apiErrorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {apiErrorMessage}
          </p>
        )}

        <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
          {updateMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </FieldGroup>
    </form>
  )
}
