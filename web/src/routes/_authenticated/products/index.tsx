import { useEffect } from 'react'
import { createFileRoute, Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { FlexRender, useTable } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { productColumns, productTableFeatures } from '@/features/products/components/columns'
import { ProductsTableSkeleton } from '@/features/products/components/products-table-skeleton'
import { productsQuery } from '@/features/products/hooks/use-products'

const productsSearchSchema = z.object({
  page: z.number().optional(),
})

function ErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    // Reset the query error boundary
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div>
      {error.message}
      <button
        onClick={() => {
          // Invalidate the route to reload the loader, and reset any router error boundaries
          router.invalidate()
        }}
      >
        Tekrar dene
      </button>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/products/')({
  validateSearch: productsSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(productsQuery({ page: deps.page })),
  component: ProductsPage,
  errorComponent: ErrorComponent,
  pendingComponent: () => <ProductsTableSkeleton />,
})

function ProductsPage() {
  const { page = 1 } = Route.useSearch()
  const { data } = useSuspenseQuery(productsQuery({ page }))

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0

  const table = useTable({
    features: productTableFeatures,
    columns: productColumns,
    data: data?.items ?? [],
  })

  return (
    <div className="flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link to="/products/new" />}>
          <Plus className="size-4" />
          Ürün ekle
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : <FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={productColumns.length} className="h-24 text-center">
                  Ürün bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Sayfa {data.page} / {pageCount} — Toplam {data.total} ürün
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page <= 1}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={{ page: 1 }} />}
          >
            İlk
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page <= 1}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={{ page: data.page - 1 }} />}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page >= pageCount}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={{ page: data.page + 1 }} />}
          >
            Sonraki
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page >= pageCount}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={{ page: pageCount }} />}
          >
            Son
          </Button>
        </div>
      </div>
    </div>
  )
}
