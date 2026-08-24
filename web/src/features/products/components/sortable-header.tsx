import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import type { DataTableFeatures } from '@/features/products/components/data-table-features'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SortableHeader<TValue>({
  label,
  column,
  align = 'left',
}: {
  label: string
  column: Column<DataTableFeatures, Product, TValue>
  align?: 'left' | 'right'
}) {
  const sortDir = column.getIsSorted()
  const Icon = sortDir === 'asc' ? ArrowUp : sortDir === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      <Icon className={cn('size-3.5', !sortDir && 'text-muted-foreground')} />
    </button>
  )
}
