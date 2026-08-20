import { Skeleton } from '@/components/ui/skeleton'

export function RoutePending() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
