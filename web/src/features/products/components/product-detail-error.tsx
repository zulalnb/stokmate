import { useEffect } from 'react'
import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'

import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'

export function ProductDetailError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <div className="flex flex-col items-start gap-3 px-4 py-6 lg:px-6">
      <h2 className="text-lg font-medium">{isNotFound ? 'Ürün bulunamadı' : 'Bir şeyler ters gitti'}</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <div className="flex gap-2">
        {!isNotFound && (
          <Button onClick={() => router.invalidate()}>Tekrar dene</Button>
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/products" />}
        >
          Ürünlere dön
        </Button>
      </div>
    </div>
  )
}
