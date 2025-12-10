'use client'
import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
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

type Props = {
  children: React.ReactNode
}

type RoomConfig = {
  roomTitle: string
  propertyCode: string
}

const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()

  const { id: roomId } = useParams<{ id: string }>()
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'views', 'leases']

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Overview',
      isSelected: lastSegment === routes[0]
    },
    {
      label: 'Views',
      isSelected: lastSegment === routes[1]
    },
    {
      label: 'Leases',
      isSelected: lastSegment === routes[2]
    }
  ])

  // Fetch room config
  useEffect(() => {
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

    fetchRoomConfig()
  }, [roomId])

  const handleTabClick = (index: number) => {
    const route = routes[index]
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
            { label: roomConfig?.roomTitle }
          ]}
          isLoading={isLoading}
          crumbSkeletonWidth='w-33'
        />

        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex items-center gap-2.5'>
            {isLoading ? (
              <Skeleton className='w-12 h-12 rounded-full bg-neutral-300' />
            ) : (
              <span className='w-12 h-12 rounded-full overflow-hidden'>
                <Image
                  src={'/images/property-image-placeholder.png'}
                  height={48}
                  width={48}
                  alt='Room Placeholder'
                />
              </span>
            )}
            {isLoading ? (
              <Skeleton className='h-7 w-40 bg-neutral-300' />
            ) : (
              <h1>{roomConfig?.roomTitle}</h1>
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
              <DropdownMenuItem onClick={() => router.push(`/rooms/${roomId}/edit`)}>Edit room</DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmationDialog
                openDialogButton={
                  <DropdownMenuItem
                    onSelect={e => e.preventDefault()}
                    className='text-error-main focus:text-error-main'
                  >
                    Delete Room
                  </DropdownMenuItem>
                }
                title='Delete Room'
                description={
                  <>
                    Are you sure you want to delete{' '}
                    <strong>{roomConfig?.roomTitle}</strong>? This action cannot be
                    undone. All associated data (views, configurations)
                    will be permanently removed.
                  </>
                }
                onConfirm={handleDeleteRoom}
                confirmButtonLabel='Delete'
                confirmButtonLoadingLabel='Deleting...'
              />
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
