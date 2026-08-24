import { Link } from '@tanstack/react-router'
import { createColumnHelper, tableFeatures } from '@tanstack/react-table'
import { CircleCheck, CircleMinus, CircleX, Pencil, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export const productTableFeatures = tableFeatures({})

const columnHelper = createColumnHelper<typeof productTableFeatures, Product>()

export const productColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: 'Ürün',
    cell: ({ row }) => (
      <div className="truncate">
        <div className="truncate font-medium">{row.original.name}</div>
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
    header: () => <div className="text-right">Fiyat</div>,
    cell: ({ row }) => <div className="text-right">{formatKurus(row.original.price)}</div>,
  }),
  columnHelper.accessor('stock', {
    header: () => <div className="text-right">Stok</div>,
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
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link to="/products/$id" params={{ id: String(row.original.id) }} />}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Ürünü düzenle</span>
        </Button>
      </div>
    ),
  }),
])
