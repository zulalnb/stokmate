import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { meQuery } from '@/features/auth/hooks/use-auth'
import { hasSession } from '@/lib/auth-storage'

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
  component: () => <Outlet />,
})
