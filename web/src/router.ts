import { createRouter } from '@tanstack/react-router'

import { RouteErrorFallback } from '@/components/RouteErrorFallback'
import { RouteNotFound } from '@/components/RouteNotFound'
import { RoutePending } from '@/components/RoutePending'
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
