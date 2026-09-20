import { useSuspenseQuery } from '@tanstack/react-query'
import type { ChangeEvent } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

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
import { MoneyInput } from '@/features/products/components/money-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  buildProductPayload,
  type ProductFormValues,
} from '@/features/products/components/product-form.schema'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { suppliersQuery } from '@/features/products/hooks/use-suppliers'
import { STATUS_LABELS, UNIT_LABELS } from '@/lib/enums'
import type { UpdateProductPayload } from '@/lib/types'

function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function replaceLoneZero(e: ChangeEvent<HTMLInputElement>, previousValue: string): string {
  const nativeEvent = e.nativeEvent as InputEvent
  if (
    previousValue === '0' &&
    nativeEvent.inputType === 'insertText' &&
    nativeEvent.data !== null &&
    /^[1-9]$/.test(nativeEvent.data)
  ) {
    return nativeEvent.data
  }
  return toDigitsOnly(e.target.value)
}

export function ProductForm({
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
}: {
  onSubmit: (payload: UpdateProductPayload) => void
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
}) {
  const { data: categories } = useSuspenseQuery(categoriesQuery())
  const { data: brands } = useSuspenseQuery(brandsQuery())
  const { data: suppliers } = useSuspenseQuery(suppliersQuery())

  const {
    register,
    control,
    handleSubmit,
    clearErrors,
    getValues,
    formState: { errors, isDirty },
  } = useFormContext<ProductFormValues>()

  const stockField = register('stock')
  const minStockField = register('minStock')

  function handleFormSubmit(values: ProductFormValues) {
    clearErrors('sku')
    clearErrors('root')
    onSubmit(buildProductPayload(values))
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
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
                    <SelectTrigger
                      id="categoryId"
                      ref={field.ref}
                      aria-invalid={!!errors.categoryId}
                      className="w-full"
                    >
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
                    <SelectTrigger
                      id="brandId"
                      ref={field.ref}
                      aria-invalid={!!errors.brandId}
                      className="w-full"
                    >
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
                    <SelectTrigger
                      id="supplierId"
                      ref={field.ref}
                      aria-invalid={!!errors.supplierId}
                      className="w-full"
                    >
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
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <MoneyInput id="price" aria-invalid={!!errors.price} {...field} />
                )}
              />
              <FieldError errors={[errors.price]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.costPrice}>
            <FieldLabel htmlFor="costPrice">Maliyet fiyatı (₺)</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="costPrice"
                render={({ field }) => (
                  <MoneyInput id="costPrice" aria-invalid={!!errors.costPrice} {...field} />
                )}
              />
              <FieldError errors={[errors.costPrice]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.stock}>
            <FieldLabel htmlFor="stock">Stok</FieldLabel>
            <FieldContent>
              <Input
                id="stock"
                type="text"
                inputMode="numeric"
                aria-invalid={!!errors.stock}
                {...stockField}
                onChange={(e) => {
                  e.target.value = replaceLoneZero(e, getValues('stock'))
                  stockField.onChange(e)
                }}
              />
              <FieldError errors={[errors.stock]} />
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.minStock}>
            <FieldLabel htmlFor="minStock">Kritik stok eşiği</FieldLabel>
            <FieldContent>
              <Input
                id="minStock"
                type="text"
                inputMode="numeric"
                aria-invalid={!!errors.minStock}
                {...minStockField}
                onChange={(e) => {
                  e.target.value = replaceLoneZero(e, getValues('minStock'))
                  minStockField.onChange(e)
                }}
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
                    <SelectTrigger
                      id="unit"
                      ref={field.ref}
                      aria-invalid={!!errors.unit}
                      className="w-full"
                    >
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
                    items={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  >
                    <SelectTrigger
                      id="status"
                      ref={field.ref}
                      aria-invalid={!!errors.status}
                      className="w-full"
                    >
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
                  ref={field.ref}
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

        {errors.root?.message && (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  )
}
