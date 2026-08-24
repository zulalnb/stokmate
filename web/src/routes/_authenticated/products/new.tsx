import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductCreateForm } from '@/features/products/components/product-create-form'
import { ProductDetailSkeleton } from '@/features/products/components/product-detail-skeleton'
import { brandsQuery } from '@/features/products/hooks/use-brands'
import { categoriesQuery } from '@/features/products/hooks/use-categories'
import { suppliersQuery } from '@/features/products/hooks/use-suppliers'

export const Route = createFileRoute('/_authenticated/products/new')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(brandsQuery()),
      context.queryClient.ensureQueryData(suppliersQuery()),
    ]),
  component: ProductCreatePage,
  pendingComponent: () => <ProductDetailSkeleton />,
})

function ProductCreatePage() {
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
          <CardTitle>Yeni ürün</CardTitle>
          <CardDescription>Yeni bir ürün kaydı oluşturun.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductCreateForm />
        </CardContent>
      </Card>
    </div>
  )
}
