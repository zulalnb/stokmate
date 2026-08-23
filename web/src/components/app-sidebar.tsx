import { useSuspenseQuery } from '@tanstack/react-query'
import { LogOutIcon, PackageIcon } from 'lucide-react'
import {
  SidebarContent,
  Sidebar,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { meQuery, useLogout } from '@/features/auth/hooks/use-auth'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const data = { navMain: [{ title: 'Ürünler', url: '/products', icon: PackageIcon }] }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useSuspenseQuery(meQuery())
  const logout = useLogout()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <span className="px-2 text-sm font-semibold">StokMate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavMain items={data.navMain} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary
          items={[{ title: 'Çıkış yap', icon: LogOutIcon, onClick: () => logout.mutate() }]}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.fullName, email: user.email }} />
      </SidebarFooter>
    </Sidebar>
  )
}
