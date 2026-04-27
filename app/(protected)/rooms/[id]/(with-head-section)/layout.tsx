'use client'
import React, { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import HeaderImage from '@/components/costume-ui/header-image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tab, TabGroup } from '@/components/costume-ui/tab'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useParams } from 'next/navigation'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { useRouter, usePathname } from 'next/navigation'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { toast } from 'sonner'
import InitiatePreparationFlowDrawer from '@/components/dialogs/initiate-preparation-flow-drawer'
import { PermissionGate } from '@/components/permission-gate'

type Props = {
  children: React.ReactNode
}

type ImageItem = {
  id: string
  image_url: string
  thumb_url: string
}

type RoomConfig = {
  roomTitle: string
  propertyCode: string
  status: string
  images?: ImageItem[]
}

const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()

  const { id: roomId } = useParams<{ id: string }>()
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'views', 'bookings', 'leases']

  const { can } = usePermissions()

  const allTabs = [
    { label: 'Overview', route: routes[0], permission: 'rooms.access' },
    { label: 'Views', route: routes[1], permission: 'views.access' },
    { label: 'Bookings', route: routes[2], permission: 'bookings.access' },
    { label: 'Leases', route: routes[3], permission: 'leases.access' }
  ]

  const visibleTabs = allTabs.filter(t => can(t.permission))

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption(
    visibleTabs.map(t => ({
      label: t.label,
      isSelected: lastSegment === t.route || (lastSegment === roomId && t.route === 'overview')
    }))
  )

  // Fetch room config
  const fetchRoomConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/config`)
      if (response.ok) {
        const data = await response.json()
        setRoomConfig(data)
      }
    } catch (error) {
      console.error('Error fetching room config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomConfig()
  }, [roomId])

  const handleTabClick = (index: number) => {
    const route = visibleTabs[index]?.route
    if (route) {
      router.replace(`/rooms/${roomId}/${route}`)
    }
  }

  const handleDeleteRoom = async () => {
    const response = await fetch(`/api/rooms/${roomId}/delete`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.has_leases) {
        toast.error('Cannot delete room', {
          description: data.message
        })
      } else {
        toast.error(data.error || 'Failed to delete room')
      }
      throw new Error(data.error)
    }

    toast.success('Room deleted successfully')
    router.push('/rooms')
  }

  return (
    <>
      <section className={cn('flex flex-col gap-2.5 mb-2.5')}>
        <Breadcrumb
          items={[
            { label: 'Rooms', href: '/rooms' },
            {
              label:
                roomConfig?.propertyCode + '(' + roomConfig?.roomTitle + ')'
            }
          ]}
          isLoading={isLoading}
          crumbSkeletonWidth='w-33'
        />

        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex items-center gap-2.5'>
            <HeaderImage
              images={roomConfig?.images}
              isLoading={isLoading}
              alt='Room'
            />
            {isLoading ? (
              <Skeleton className='h-7 w-40 bg-neutral-300' />
            ) : (
              <h1>
                {roomConfig?.propertyCode + '(' + roomConfig?.roomTitle + ')'}
              </h1>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-9 w-9 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-7! w-7! text-neutral-600' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <PermissionGate permission='rooms.update'>
                <DropdownMenuItem
                  onClick={() => router.push(`/rooms/${roomId}/edit`)}
                >
                  Edit room
                </DropdownMenuItem>
              </PermissionGate>
              {roomConfig?.status === 'Vacant' && (
                <InitiatePreparationFlowDrawer
                  roomId={roomId}
                  locationName={`${roomConfig.propertyCode} - ${roomConfig.roomTitle}`}
                  onSuccess={fetchRoomConfig}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Mark as Not Ready
                    </DropdownMenuItem>
                  }
                />
              )}
              <DropdownMenuSeparator />
              <PermissionGate permission='rooms.delete'>
                <ConfirmationDialog
                  openDialogButton={
                    <button type='button' className='delete-dropdown-button'>
                      Delete Room
                    </button>
                  }
                  title='Delete Room'
                  description={
                    <>
                      Are you sure you want to delete{' '}
                      <strong>{roomConfig?.roomTitle}</strong>? This action cannot
                      be undone. All associated data (views, configurations) will
                      be permanently removed.
                    </>
                  }
                  onConfirm={handleDeleteRoom}
                  confirmButtonLabel='Delete'
                  confirmButtonLoadingLabel='Deleting...'
                />
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isLoading ? (
          <div className='flex gap-6'>
            {tabs.map((_, index) => (
              <Skeleton key={index} className='h-5 w-16 bg-neutral-300' />
            ))}
          </div>
        ) : (
          <TabGroup>
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                isSelected={tab.isSelected}
                onClick={() => {
                  selectByIndex(index)
                  handleTabClick(index)
                }}
              />
            ))}
          </TabGroup>
        )}
      </section>
      <section className='flex flex-col gap-5 -mx-7.5 -mb-7.5 p-7.5 py-5 bg-(--background-tertiary) min-h-full h-fit'>
        {children}
      </section>
    </>
  )
}

export default WithHeadSectionLayout
