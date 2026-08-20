import type { ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <h2 className="text-lg font-medium">Bir şeyler ters gitti</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button onClick={reset}>Tekrar dene</Button>
    </div>
  )
}
