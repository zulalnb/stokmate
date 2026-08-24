import { Filter, X } from 'lucide-react'

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
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { useIsMobile } from '@/hooks/use-mobile'
import { STATUS_LABELS } from '@/lib/enums'
import type { Brand, Category } from '@/lib/types'

export function ProductFilterBar({
  q,
  categoryId,
  brandId,
  status,
  categories,
  brands,
  hasActiveFilters,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}: {
  q?: string
  categoryId?: number
  brandId?: number
  status?: number
  categories: Category[]
  brands: Brand[]
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (patch: { categoryId?: number; brandId?: number; status?: number }) => void
  onClearFilters: () => void
}) {
  const isMobile = useIsMobile()
  const debouncedSearchChange = useDebouncedCallback(onSearchChange, 500)
  const activeSelectFilterCount = [categoryId, brandId, status].filter(
    (value) => value !== undefined,
  ).length

  const filterFields = (
    <>
      <Select
        value={categoryId ? String(categoryId) : 'all'}
        onValueChange={(value) =>
          onFilterChange({ categoryId: value === 'all' ? undefined : Number(value) })
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
          onFilterChange({ brandId: value === 'all' ? undefined : Number(value) })
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
          onFilterChange({ status: value === 'all' ? undefined : Number(value) })
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
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="size-4" />
          Filtreleri temizle
        </Button>
      )}
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        key={q ?? 'empty'}
        defaultValue={q ?? ''}
        onChange={(e) => debouncedSearchChange(e.target.value)}
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
  )
}
