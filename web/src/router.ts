import { createRouter } from '@tanstack/react-router'

import { RouteErrorFallback } from '@/components/route-error-fallback'
import { RouteNotFound } from '@/components/route-not-found'
import { RoutePending } from '@/components/route-pending'
import { queryClient } from '@/query-client'

import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingComponent: RoutePending,
  defaultErrorComponent: RouteErrorFallback,
  defaultNotFoundComponent: RouteNotFound,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
