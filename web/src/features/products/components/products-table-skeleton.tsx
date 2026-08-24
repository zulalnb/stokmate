import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_PAGE_SIZE = 20

export function ProductsTableSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 lg:px-6">
      {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
