import { createFileRoute } from '@tanstack/react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="p-6">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Oturumunuz doğrulandı. İçerik yakında eklenecek.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
