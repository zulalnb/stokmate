import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

export function RouteNotFound() {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <h2 className="text-lg font-medium">Sayfa bulunamadı</h2>
      <p className="text-muted-foreground text-sm">Aradığınız sayfa mevcut değil.</p>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Ana sayfaya dön
      </Link>
    </div>
  )
}
