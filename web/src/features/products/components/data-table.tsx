import {
  FlexRender,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  features,
  type DataTableFeatures,
} from '@/features/products/components/data-table-features'

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  sorting: SortingState
  onSortingChange: (updater: Updater<SortingState>) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  sorting,
  onSortingChange,
  hasActiveFilters,
  onClearFilters,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    columns,
    data,
    state: { sorting },
    onSortingChange,
    enableSorting: false,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: false,
  })

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className={header.column.columnDef.meta?.className}
                >
                  {header.isPlaceholder ? null : <FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                    <FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {hasActiveFilters ? (
                  <div className="flex flex-col items-center gap-2">
                    <p>Filtrelere uyan ürün bulunamadı.</p>
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      Filtreleri temizle
                    </Button>
                  </div>
                ) : (
                  <p>Henüz ürün yok.</p>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
