import { useEffect } from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { functionalUpdate, type SortingState, type Updater } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/features/products/components/data-table'
import { ProductFilterBar } from '@/features/products/components/product-filter-bar'
import { ProductsTableSkeleton } from '@/features/products/components/products-table-skeleton'
import { StockSummaryCards } from '@/features/products/components/stock-summary-cards'
import { TablePagination } from '@/features/products/components/table-pagination'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { productsQuery } from '@/features/products/hooks/use-products'
import { statsQuery } from '@/features/products/hooks/use-stats'
import { columns } from '@/features/products/components/columns'

const productsSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  status: z.number().optional(),
  page: z.number().optional(),
  sort: z.enum(['name', 'price', 'stock', 'updatedAt']).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
})

type ProductsSearch = z.infer<typeof productsSearchSchema>

function isSortableField(id: string): id is NonNullable<ProductsSearch['sort']> {
  return id === 'name' || id === 'price' || id === 'stock' || id === 'updatedAt'
}

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
  loaderDeps: ({ search }) => ({
    q: search.q,
    categoryId: search.categoryId,
    brandId: search.brandId,
    status: search.status,
    sort: search.sort,
    dir: search.dir,
    page: search.page ?? 1,
  }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery(deps)),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(brandsQuery()),
      context.queryClient.ensureQueryData(statsQuery()),
    ]),
  component: ProductsPage,
  errorComponent: ErrorComponent,
  pendingComponent: () => <ProductsTableSkeleton />,
})

function ProductsPage() {
  const search = Route.useSearch()
  const { q, categoryId, brandId, status, sort, dir, page = 1 } = search
  const navigate = useNavigate({ from: Route.fullPath })

  const { data } = useSuspenseQuery(
    productsQuery({ q, categoryId, brandId, status, sort, dir, page }),
  )
  const { data: categories } = useSuspenseQuery(categoriesQuery())
  const { data: brands } = useSuspenseQuery(brandsQuery())
  const { data: stats } = useSuspenseQuery(statsQuery())

  const hasActiveFilters = Boolean(q || categoryId || brandId || status)

  function updateFilters(patch: Partial<ProductsSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) })
  }

  function clearFilters() {
    navigate({ search: (prev) => ({ page: 1, sort: prev.sort, dir: prev.dir }) })
  }

  const sorting: SortingState = sort ? [{ id: sort, desc: dir === 'desc' }] : []

  function handleSortingChange(updater: Updater<SortingState>) {
    const nextSort = functionalUpdate(updater, sorting)[0]
    navigate({
      search: (prev) => ({
        ...prev,
        sort: nextSort && isSortableField(nextSort.id) ? nextSort.id : undefined,
        dir: nextSort ? (nextSort.desc ? 'desc' : 'asc') : undefined,
        page: 1,
      }),
    })
  }

  return (
    <>
      <StockSummaryCards stats={stats} />

      <div className="flex flex-col gap-4 overflow-auto px-4 pt-1 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProductFilterBar
            q={q}
            categoryId={categoryId}
            brandId={brandId}
            status={status}
            categories={categories}
            brands={brands}
            hasActiveFilters={hasActiveFilters}
            onSearchChange={(value) => updateFilters({ q: value.trim() || undefined })}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
          />

          <Button nativeButton={false} render={<Link to="/products/new" />}>
            <Plus className="size-4" />
            <span className="hidden md:inline">Ürün ekle</span>
          </Button>
        </div>

        <DataTable
          data={data?.items ?? []}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <TablePagination page={data.page} total={data.total} pageSize={data.pageSize} />
      </div>
    </>
  )
}
