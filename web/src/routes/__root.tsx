import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { RouteErrorFallback } from '@/components/RouteErrorFallback'
import { RouteNotFound } from '@/components/RouteNotFound'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFound,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
