import type { ReactTable, RowData } from '@tanstack/react-table'
import { ArrowDownUp, ListSortAscending, SortAsc, SortDesc } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DataTableFeatures } from '@/features/products/components/data-table-features'

interface DataTableSortDropdownProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>
}

export function DataTableSortDropdown<TData extends RowData>({
  table,
}: DataTableSortDropdownProps<TData>) {
  const sortableColumns = table.getAllLeafColumns().filter((column) => column.getCanSort())
  const activeColumn = sortableColumns.find((column) => column.getIsSorted())
  const activeDir = activeColumn?.getIsSorted()
  const value = activeColumn && activeDir ? `${activeColumn.id}:${activeDir}` : 'default'

  const items = [
    { value: 'default', label: 'Varsayılan' },
    ...sortableColumns.flatMap((column) => {
      const label = column.columnDef.meta?.label ?? column.id
      return [
        {
          value: `${column.id}:asc`,
          label: `${label}: ${column.columnDef.meta?.sortAscLabel ?? 'Artan'}`,
        },
        {
          value: `${column.id}:desc`,
          label: `${label}: ${column.columnDef.meta?.sortDescLabel ?? 'Azalan'}`,
        },
      ]
    }),
  ]

  function handleValueChange(next: string | null) {
    if (!next || next === 'default') {
      table.resetSorting()
      return
    }
    const [columnId, direction] = next.split(':')
    table.getColumn(columnId)?.toggleSorting(direction === 'desc')
  }

  return (
    <Select value={value} onValueChange={handleValueChange} items={items}>
      <SelectTrigger className="w-full max-w-46">
        <ListSortAscending className="size-3.5" />
        <SelectValue placeholder="Sırala" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">
          <ArrowDownUp className="size-3.5" />
          Varsayılan
        </SelectItem>
        <SelectSeparator />
        {sortableColumns.map((column) => (
          <SelectGroup key={column.id}>
            <SelectLabel>{column.columnDef.meta?.label ?? column.id}</SelectLabel>
            <SelectItem value={`${column.id}:asc`}>
              <SortAsc className="size-3.5" />
              {column.columnDef.meta?.sortAscLabel ?? 'Artan'}
            </SelectItem>
            <SelectItem value={`${column.id}:desc`}>
              <SortDesc className="size-3.5" />
              {column.columnDef.meta?.sortDescLabel ?? 'Azalan'}
            </SelectItem>
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
