import type { Column, RowData } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import type { DataTableFeatures } from '@/features/products/components/data-table-features'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  column: Column<DataTableFeatures, TData, TValue>
  align?: 'left' | 'right'
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  label: title,
  column,
  align = 'left',
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sortDir = column.getIsSorted()
  const Icon = sortDir === 'asc' ? ArrowUp : sortDir === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <div className={className}>
      <Button
        variant="ghost"
        onClick={column.getToggleSortingHandler()}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {title}
        <Icon className={cn('size-3.5', !sortDir && 'text-muted-foreground')} />
      </Button>
    </div>
  )
}
