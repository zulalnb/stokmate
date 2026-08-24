import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export function TablePagination({
  page,
  total,
  pageSize,
}: {
  page: number
  total: number
  pageSize: number
}) {
  const pageCount = Math.ceil(total / pageSize)

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        {total > 0 ? `Sayfa ${page} / ${pageCount} — Toplam ${total} ürün` : 'Toplam 0 ürün'}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={page <= 1}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: 1 })} />}
        >
          İlk
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={page <= 1}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: page - 1 })} />}
        >
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={page >= pageCount}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: page + 1 })} />}
        >
          Sonraki
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          disabled={page >= pageCount}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          render={<Link to="." search={(prev) => ({ ...prev, page: pageCount })} />}
        >
          Son
        </Button>
      </div>
    </div>
  )
}
