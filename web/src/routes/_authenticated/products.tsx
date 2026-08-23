import { useEffect } from 'react'
import { createFileRoute, Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { queryOptions, useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { FlexRender, createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { CircleCheck, CircleMinus, CircleX, type LucideIcon } from 'lucide-react'
import { z } from 'zod'

import { productsService } from '@/api/services/products.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { STATUS_LABELS } from '@/lib/enums'
import { formatKurus } from '@/lib/money'
import type { Product, ProductFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

const productsQueryOptions = (filters: ProductFilters) =>
  queryOptions({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
  })

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

export const Route = createFileRoute('/_authenticated/products')({
  validateSearch: productsSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(productsQueryOptions({ page: deps.page })),
  component: ProductsPage,
  errorComponent: ErrorComponent,
  pendingComponent: () => <ProductsTableSkeleton />,
})

/* const COLUMN_WIDTHS: Record<string, string> = {
  name: 'w-[32%]',
  categoryName: 'w-[16%]',
  brandName: 'w-[16%]',
  price: 'w-[14%]',
  stock: 'w-[10%]',
  status: 'w-[12%]',
} */

const STATUS_BADGE_CONFIG: Record<
  number,
  { variant: 'success' | 'secondary' | 'destructive'; icon: LucideIcon }
> = {
  1: { variant: 'success', icon: CircleCheck },
  2: { variant: 'secondary', icon: CircleMinus },
  3: { variant: 'destructive', icon: CircleX },
}

const features = tableFeatures({})

const columnHelper = createColumnHelper<typeof features, Product>()

const columns = columnHelper.columns([
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
])

function ProductsPage() {
  const { page = 1 } = Route.useSearch()
  const { data } = useSuspenseQuery(productsQueryOptions({ page }))

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0

  const table = useTable({
    features,
    columns,
    data: data?.items ?? [],
  })

  return (
    <div className="flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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

function ProductsTableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: columns.length }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
