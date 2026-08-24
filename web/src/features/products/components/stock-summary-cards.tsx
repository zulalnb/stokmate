import { Package, PackageX, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ProductStats } from '@/lib/types'

export function StockSummaryCards({ stats }: { stats: ProductStats }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Toplam Ürün</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.total.toLocaleString('tr-TR')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Package />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-sm">
          Sistemde kayıtlı tüm ürünler
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Stoğu Tükenen</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.outOfStock.toLocaleString('tr-TR')}
          </CardTitle>
          <CardAction>
            <Badge variant="destructive">
              <PackageX />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-sm">
          Stok girişi bekleyen ürünler
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Kritik Stok</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.lowStock.toLocaleString('tr-TR')}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TriangleAlert />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-muted-foreground text-sm">
          Kritik eşiğin altına inen ürünler
        </CardFooter>
      </Card>
    </div>
  )
}
