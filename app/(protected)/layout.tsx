import { cookies } from "next/headers"
import { SidebarProvider } from '@/components/ui/sidebar'
import Sidebar, { MobileHeader } from '@/components/app-sidebar'
import { cn } from '@/lib/utils'

export default async function ProtectedLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  return (
    <SidebarProvider defaultOpen={defaultOpen} className='md:px-[15] px-0 flex-col'>
      {/* Mobile Header - only visible on small screens */}
      <MobileHeader />

      <main className={cn('flex gap-2.5', 'md:h-screen h-[calc(100vh-60px)] w-full md:py-[15] py-0')}>
        <Sidebar />
        <div
          className={cn(
            'w-full p-4 md:p-7.5',
            'bg-(--background-primary) md:border border-0 border-(--border-default)',
            'md:rounded-[15] rounded-none overflow-auto'
          )}
        >
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
