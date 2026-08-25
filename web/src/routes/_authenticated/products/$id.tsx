import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronLeft, ImageOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DeleteProductDialog } from '@/features/products/components/delete-product-dialog'
import { ProductDetailError } from '@/features/products/components/product-detail-error'
import { ProductDetailSkeleton } from '@/features/products/components/product-detail-skeleton'
import { ProductEditForm } from '@/features/products/components/product-edit-form'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { productQuery } from '@/features/products/hooks/use-products'
import { suppliersQuery } from '@/features/products/hooks/use-suppliers'

export const Route = createFileRoute('/_authenticated/products/$id')({
  loader: ({ context, params }) => {
    const id = Number(params.id)
    return Promise.all([
      context.queryClient.ensureQueryData(productQuery(id)),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(brandsQuery()),
      context.queryClient.ensureQueryData(suppliersQuery()),
    ])
  },
  component: ProductDetailPage,
  errorComponent: ProductDetailError,
  pendingComponent: () => <ProductDetailSkeleton />,
})

function ProductDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: product } = useSuspenseQuery(productQuery(Number(id)))

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link to="/products" />}
        className="w-fit"
      >
        <ChevronLeft className="size-4" />
        Ürünlere dön
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>Ürün bilgilerini güncelleyin.</CardDescription>
          <CardAction>
            <DeleteProductDialog
              productId={product.id}
              productName={product.name}
              onDeleted={() => navigate({ to: '/products' })}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="bg-muted flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                width={160}
                height={160}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageOff className="text-muted-foreground size-6" aria-label="Görsel yok" />
            )}
          </div>

          <ProductEditForm product={product} />
        </CardContent>
      </Card>
    </div>
  )
}
