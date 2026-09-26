import { HeadContent, createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'

import { RouteErrorFallback } from '@/components/route-error-fallback'
import { RouteNotFound } from '@/components/route-not-found'
import { Toaster } from '@/components/ui/toast'
import { APP_NAME } from '@/lib/constants'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: APP_NAME }] }),
  component: RootLayout,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFound,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </>
  )
}
