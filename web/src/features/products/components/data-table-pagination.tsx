import { Link } from '@tanstack/react-router'
import type { ReactTable, RowData } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import type { DataTableFeatures } from '@/features/products/components/data-table-features'

interface DataTablePaginationProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>
}

export function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  const page = table.state.pagination.pageIndex + 1
  const pageCount = table.getPageCount()
  const total = table.getRowCount()

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        {total > 0 ? `Sayfa ${page} / ${pageCount} - Toplam ${total} ürün` : 'Toplam 0 ürün'}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={!table.getCanPreviousPage()}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: 1 })} />}
        >
          İlk
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={!table.getCanPreviousPage()}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: page - 1 })} />}
        >
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={!table.getCanNextPage()}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: page + 1 })} />}
        >
          Sonraki
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={!table.getCanNextPage()}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: pageCount })} />}
        >
          Son
        </Button>
      </div>
    </div>
  )
}
