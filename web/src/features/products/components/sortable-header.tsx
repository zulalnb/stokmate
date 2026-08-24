import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import type { ProductFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

export type SortableField = 'name' | 'price' | 'stock' | 'updatedAt'

export function SortableHeader({
  label,
  field,
  align = 'left',
  sort,
  dir,
  onSortChange,
}: {
  label: string
  field: SortableField
  align?: 'left' | 'right'
  sort?: ProductFilters['sort']
  dir?: ProductFilters['dir']
  onSortChange: (field: SortableField) => void
}) {
  const isActive = sort === field
  const Icon = isActive ? (dir === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown

  return (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      <Icon className={cn('size-3.5', !isActive && 'text-muted-foreground')} />
    </button>
  )
}
