import { useEffect } from 'react'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'

import { ApiError, isClientErrorStatus } from '@/api/errors'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function ProductsListError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  const isApiError = error instanceof ApiError
  const isClientCaused = isApiError ? isClientErrorStatus(error.status) : true

  const title = isClientCaused ? 'Sayfa açılamadı' : 'Ürünler yüklenemedi'

  const message = isClientCaused
    ? 'Ürünler sayfasının bağlantısında geçersiz veya desteklenmeyen bir değer var.'
    : 'Ürünleri yüklerken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.'

  return (
    <div className="px-4 py-6 lg:px-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            {!isClientCaused && <Button onClick={() => router.invalidate()}>Tekrar dene</Button>}

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/products" search={{}} />}
            >
              Ürünler sayfasına dön
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
