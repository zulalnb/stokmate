import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { meQuery } from '@/features/auth/hooks/use-auth'
import { hasSession } from '@/lib/auth-storage'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SiteHeader } from '@/components/site-header'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (!hasSession()) {
      throw redirect({ to: '/login' })
    }

    const isSessionValid = await context.queryClient.ensureQueryData(meQuery()).then(
      () => true,
      () => false,
    )

    if (!isSessionValid) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
