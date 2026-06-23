import { cookies } from 'next/headers'
import { SidebarProvider } from '@/components/ui/sidebar'
import Sidebar, { MobileHeader } from '@/components/app-sidebar'
import { cn } from '@/lib/utils'
import NextTopLoader from 'nextjs-toploader'
import { NotificationProvider } from '@/contexts/notification-context'
import { UserProvider } from '@/contexts/user-context'
import PasswordSetupGuard from '@/components/password-setup-guard'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { CommandPaletteProvider } from '@/contexts/command-palette-context'
import GlobalDialogs from '@/components/global-dialogs'
import SecondarySidebar from '@/components/secondary-sidebar'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function ProtectedLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const defaultOpen = true
  const isTenant = false


  return (
    <PasswordSetupGuard>
      <UserProvider>
        <NotificationProvider>
          <CommandPaletteProvider>
            <SidebarProvider
              defaultOpen={defaultOpen}
              className='md:px-[15] px-0 flex-col'
            >
            {/* Mobile Header - only visible on small screens */}
            <MobileHeader />

            <main
              className={cn(
                'flex gap-2.5',
                'md:h-screen h-[calc(100dvh)] w-full md:py-[15] py-0',
                'md:pt-0 pt-[60px]'
              )}
            >
              <Sidebar />
              <PullToRefresh
                className={cn(
                  'w-full! p-4 md:p-7.5 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-7.5',
                  'bg-(--background-primary) md:border border-0 border-(--border-default)',
                  'md:rounded-[15] rounded-none',
                  'overflow-auto'
                )}
              >
                <NextTopLoader color='#000' shadow={false} showSpinner={false} height={2} />
                {children}
              </PullToRefresh>
              {!isTenant && <SecondarySidebar className='hidden md:flex' />}
            </main>

            <GlobalDialogs />
          </SidebarProvider>
        </CommandPaletteProvider>
      </NotificationProvider>
      </UserProvider>
    </PasswordSetupGuard>
  )
}
