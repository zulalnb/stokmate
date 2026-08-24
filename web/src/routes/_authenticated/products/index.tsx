import { useEffect } from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { FlexRender, useTable } from '@tanstack/react-table'
import { Filter, Plus, X } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createProductColumns, productTableFeatures } from '@/features/products/components/columns'
import { type SortableField } from '@/features/products/components/sortable-header'
import { ProductsTableSkeleton } from '@/features/products/components/products-table-skeleton'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { productsQuery } from '@/features/products/hooks/use-products'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { useIsMobile } from '@/hooks/use-mobile'
import { STATUS_LABELS } from '@/lib/enums'

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
    ]),
  component: ProductsPage,
  errorComponent: ErrorComponent,
  pendingComponent: () => <ProductsTableSkeleton />,
})

function ProductsPage() {
  const search = Route.useSearch()
  const { q, categoryId, brandId, status, sort, dir, page = 1 } = search
  const navigate = useNavigate({ from: Route.fullPath })
  const isMobile = useIsMobile()

  const { data } = useSuspenseQuery(
    productsQuery({ q, categoryId, brandId, status, sort, dir, page }),
  )
  const { data: categories } = useSuspenseQuery(categoriesQuery())
  const { data: brands } = useSuspenseQuery(brandsQuery())

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0
  const hasActiveFilters = Boolean(q || categoryId || brandId || status)
  const activeSelectFilterCount = [categoryId, brandId, status].filter(
    (value) => value !== undefined,
  ).length

  function updateFilters(patch: Partial<ProductsSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) })
  }

  function clearFilters() {
    navigate({ search: (prev) => ({ page: 1, sort: prev.sort, dir: prev.dir }) })
  }

  function handleSortChange(field: SortableField) {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: field,
        dir: prev.sort === field && prev.dir === 'asc' ? 'desc' : 'asc',
        page: 1,
      }),
    })
  }

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    updateFilters({ q: value.trim() || undefined })
  }, 500)

  const columns = createProductColumns({ sort, dir, onSortChange: handleSortChange })

  const table = useTable({
    features: productTableFeatures,
    columns,
    data: data?.items ?? [],
  })

  const filterFields = (
    <>
      <Select
        value={categoryId ? String(categoryId) : 'all'}
        onValueChange={(value) =>
          updateFilters({ categoryId: value === 'all' ? undefined : Number(value) })
        }
        items={[
          { value: 'all', label: 'Tüm kategoriler' },
          ...categories.map((category) => ({
            value: String(category.id),
            label: category.name,
          })),
        ]}
      >
        <SelectTrigger className={isMobile ? 'w-full' : 'w-40'}>
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={brandId ? String(brandId) : 'all'}
        onValueChange={(value) =>
          updateFilters({ brandId: value === 'all' ? undefined : Number(value) })
        }
        items={[
          { value: 'all', label: 'Tüm markalar' },
          ...brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
        ]}
      >
        <SelectTrigger className={isMobile ? 'w-full' : 'w-40'}>
          <SelectValue placeholder="Marka" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tüm markalar</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={String(brand.id)}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={status ? String(status) : 'all'}
        onValueChange={(value) =>
          updateFilters({ status: value === 'all' ? undefined : Number(value) })
        }
        items={[
          { value: 'all', label: 'Tüm durumlar' },
          ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      >
        <SelectTrigger className={isMobile ? 'w-full' : 'w-40'}>
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="size-4" />
          Filtreleri temizle
        </Button>
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            key={q ?? 'empty'}
            defaultValue={q ?? ''}
            onChange={(e) => debouncedSetQuery(e.target.value)}
            placeholder="Ürün ara…"
            className="w-56"
          />
          {isMobile ? (
            <Popover>
              <PopoverTrigger render={<Button variant="outline" size="sm" nativeButton={false} />}>
                <Filter className="size-4" />
                Filtrele{activeSelectFilterCount > 0 ? ` (${activeSelectFilterCount})` : ''}
              </PopoverTrigger>
              <PopoverContent align="start" className="flex w-64 flex-col gap-2">
                {filterFields}
              </PopoverContent>
            </Popover>
          ) : (
            filterFields
          )}
        </div>

        <Button nativeButton={false} render={<Link to="/products/new" />}>
          <Plus className="size-4" />
          <span className='hidden md:inline'>Ürün ekle</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table className="">
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
                      <Button variant="outline" size="sm" onClick={clearFilters}>
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

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {data.total > 0
            ? `Sayfa ${data.page} / ${pageCount} — Toplam ${data.total} ürün`
            : 'Toplam 0 ürün'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page <= 1}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={(prev) => ({ ...prev, page: 1 })} />}
          >
            İlk
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page <= 1}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={(prev) => ({ ...prev, page: data.page - 1 })} />}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page >= pageCount}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={(prev) => ({ ...prev, page: data.page + 1 })} />}
          >
            Sonraki
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            disabled={data.page >= pageCount}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            render={<Link to="." search={(prev) => ({ ...prev, page: pageCount })} />}
          >
            Son
          </Button>
        </div>
      </div>
    </div>
  )
}
