import { Link } from '@tanstack/react-router'
import { createColumnHelper, metaHelper, tableFeatures } from '@tanstack/react-table'
import { CircleCheck, CircleMinus, CircleX, Pencil, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeleteProductDialog } from '@/features/products/components/delete-product-dialog'
import { SortableHeader, type SortableField } from '@/features/products/components/sortable-header'
import { formatDateTime } from '@/lib/date'
import { STATUS_LABELS } from '@/lib/enums'
import { formatKurus } from '@/lib/money'
import type { Product, ProductFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CONFIG: Record<
  number,
  { variant: 'success' | 'secondary' | 'destructive'; icon: LucideIcon }
> = {
  1: { variant: 'success', icon: CircleCheck },
  2: { variant: 'secondary', icon: CircleMinus },
  3: { variant: 'destructive', icon: CircleX },
}

type ProductColumnMeta = { className?: string }

export const productTableFeatures = tableFeatures({
  columnMeta: metaHelper<ProductColumnMeta>(),
})

const columnHelper = createColumnHelper<typeof productTableFeatures, Product>()

export function createProductColumns({
  sort,
  dir,
  onSortChange,
}: {
  sort?: ProductFilters['sort']
  dir?: ProductFilters['dir']
  onSortChange: (field: SortableField) => void
}) {
  return columnHelper.columns([
    columnHelper.accessor('name', {
      header: () => (
        <SortableHeader label="Ürün" field="name" sort={sort} dir={dir} onSortChange={onSortChange} />
      ),
      meta: { className: 'max-w-sm' },
      cell: ({ row }) => (
        <div className="truncate">
          <div className="truncate font-medium" title={row.original.name}>
            {row.original.name}
          </div>
          <div className="text-muted-foreground truncate text-xs">{row.original.sku}</div>
        </div>
      ),
    }),
    columnHelper.accessor('categoryName', {
      header: 'Kategori',
      cell: ({ row }) => <div className="truncate">{row.original.categoryName}</div>,
    }),
    columnHelper.accessor('brandName', {
      header: 'Marka',
      cell: ({ row }) => <div className="truncate">{row.original.brandName}</div>,
    }),
    columnHelper.accessor('price', {
      header: () => (
        <div className="flex justify-end">
          <SortableHeader
            label="Fiyat"
            field="price"
            align="right"
            sort={sort}
            dir={dir}
            onSortChange={onSortChange}
          />
        </div>
      ),
      cell: ({ row }) => <div className="text-right">{formatKurus(row.original.price)}</div>,
    }),
    columnHelper.accessor('stock', {
      header: () => (
        <div className="flex justify-end">
          <SortableHeader
            label="Stok"
            field="stock"
            align="right"
            sort={sort}
            dir={dir}
            onSortChange={onSortChange}
          />
        </div>
      ),
      meta: { className: 'w-20' },
      cell: ({ row }) => (
        <div
          className={cn(
            'text-right',
            row.original.stock <= row.original.minStock && 'text-destructive',
          )}
        >
          {row.original.stock}
        </div>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: () => (
        <SortableHeader
          label="Son güncelleme"
          field="updatedAt"
          sort={sort}
          dir={dir}
          onSortChange={onSortChange}
        />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.updatedAt)}
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Durum',
      cell: ({ row }) => {
        const config = STATUS_BADGE_CONFIG[row.original.status]
        const Icon = config.icon
        return (
          <Badge variant={config.variant}>
            <Icon data-icon="inline-start" />
            {STATUS_LABELS[row.original.status as keyof typeof STATUS_LABELS]}
          </Badge>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link to="/products/$id" params={{ id: String(row.original.id) }} />}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Ürünü düzenle</span>
          </Button>
          <DeleteProductDialog productId={row.original.id} productName={row.original.name} />
        </div>
      ),
    }),
  ])
}
