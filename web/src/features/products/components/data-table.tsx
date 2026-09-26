import {
  FlexRender,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
  type Updater,
} from '@tanstack/react-table'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/features/products/components/data-table-pagination'
import { DataTableSortDropdown } from '@/features/products/components/data-table-sort-dropdown'
import {
  features,
  type DataTableFeatures,
} from '@/features/products/components/data-table-features'
import { ProductFilterBar } from '@/features/products/components/product-filter-bar'
import { ProductSearchBar } from '@/features/products/components/product-search-bar'
import type { Brand, Category, ProductFilters } from '@/lib/types'

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  sorting: SortingState
  onSortingChange: (updater: Updater<SortingState>) => void
  pagination: PaginationState
  rowCount: number
  onClearFilters: () => void
  filters: Pick<ProductFilters, 'q' | 'categoryId' | 'brandId' | 'status'>
  categories: Category[]
  brands: Brand[]
  onSearchChange: (value: string) => void
  onFilterChange: (patch: { categoryId?: number; brandId?: number; status?: number }) => void
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  sorting,
  onSortingChange,
  pagination,
  rowCount,
  onClearFilters,
  filters,
  categories,
  brands,
  onSearchChange,
  onFilterChange,
}: DataTableProps<TData>) {
  const { q, categoryId, brandId, status } = filters
  const hasActiveFilters = Boolean(q || categoryId || brandId || status) || sorting.length > 0
  const table = useTable({
    features,
    columns,
    data,
    state: { sorting, pagination },
    onSortingChange,
    rowCount,
    manualSorting: true,
    enableMultiSort: false,
    sortDescFirst: false,
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 md:justify-between">
        <ProductSearchBar q={q} onSearchChange={onSearchChange} className="w-full max-w-sm" />
        <ProductFilterBar
          categoryId={categoryId}
          brandId={brandId}
          status={status}
          categories={categories}
          brands={brands}
          onFilterChange={onFilterChange}
        />
        <DataTableSortDropdown table={table} />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="size-4" />
            <span>Filtreleri Temizle</span>
          </Button>
        )}
      </div>

      <div className="@container overflow-hidden rounded-lg border">
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
                <TableCell colSpan={columns.length} className="relative h-24 p-0">
                  <div className="sticky left-0 flex h-full w-[100cqw] flex-col items-center justify-center gap-2 px-4 text-center">
                    {hasActiveFilters ? (
                      <>
                        <p>Filtrelere uyan ürün bulunamadı.</p>
                        <Button variant="outline" size="sm" onClick={onClearFilters}>
                          Filtreleri temizle
                        </Button>
                      </>
                    ) : (
                      <p>Henüz ürün yok.</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </>
  )
}
