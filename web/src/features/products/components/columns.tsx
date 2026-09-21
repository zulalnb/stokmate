import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { CircleCheck, CircleMinus, CircleX, ImageOff, Pencil, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type DataTableFeatures } from '@/features/products/components/data-table-features'
import { DeleteProductDialog } from '@/features/products/components/delete-product-dialog'
import { DataTableColumnHeader } from '@/features/products/components/data-table-column-header'
import { formatDateTime } from '@/lib/date'
import { STATUS_LABELS } from '@/lib/enums'
import { formatKurus } from '@/lib/money'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CONFIG: Record<
  number,
  { variant: 'success' | 'secondary' | 'destructive'; icon: LucideIcon }
> = {
  1: { variant: 'success', icon: CircleCheck },
  2: { variant: 'secondary', icon: CircleMinus },
  3: { variant: 'destructive', icon: CircleX },
}

const columnHelper = createColumnHelper<DataTableFeatures, Product>()

export const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: ({ column }) => <DataTableColumnHeader label="Ürün" column={column} />,
    enableSorting: true,
    meta: { className: 'max-w-sm' },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={row.original.name}
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="text-muted-foreground size-4" aria-label="Görsel yok" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium" title={row.original.name}>
            {row.original.name}
          </div>
          <div className="text-muted-foreground truncate text-xs">{row.original.sku}</div>
        </div>
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
    header: ({ column }) => (
      <DataTableColumnHeader
        label="Fiyat"
        column={column}
        align="right"
        className="flex justify-end"
      />
    ),
    enableSorting: true,
    cell: ({ row }) => <div className="text-right">{formatKurus(row.original.price)}</div>,
  }),
  columnHelper.accessor('stock', {
    header: ({ column }) => (
      <DataTableColumnHeader
        label="Stok"
        column={column}
        align="right"
        className="flex justify-end"
      />
    ),
    enableSorting: true,
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
    header: ({ column }) => <DataTableColumnHeader label="Son güncelleme" column={column} />,
    enableSorting: true,
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
