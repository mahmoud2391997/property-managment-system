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
import { Property } from '@/types'
import { propertiesData } from '@/utils/data'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { useRouter, usePathname } from 'next/navigation'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { toast } from 'sonner'
import { useActionUnderDevelopment } from '@/components/costume-ui/under-development'

type Props = {
  children: React.ReactNode
}
const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()

  const { id: propertyId } = useParams<{ id: string }>()
  const [propertyCode, setPropertyCode] = useState<string | null>(null)
  const [isPropertyCodeLoading, setIsPropertyCodeLoading] =
    useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'rooms', 'views', 'leases', 'contracts']

  const params = useParams()
  const id = params.id as string
  const propertyData: Property | undefined = propertiesData.find(
    p => p.id === id
  )
  const { showUnderDevelopment, ActionUnderDevelopmentOverlay } =
    useActionUnderDevelopment()
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
      label: 'Rooms',
      isSelected: lastSegment === routes[1]
    },
    {
      label: 'Views',
      isSelected: lastSegment === routes[2]
    },
    {
      label: 'Leases',
      isSelected: lastSegment === routes[3]
    },
    {
      label: 'Contracts',
      isSelected: lastSegment === routes[4]
    }
  ])

  // Fetch property code
  useEffect(() => {
    const fetchPropertyCode = async () => {
      setIsPropertyCodeLoading(true)
      const response = await fetch(`/api/leases/${propertyId}/property-code`)
      if (response.ok) {
        setIsPropertyCodeLoading(false)
        const data = await response.json()
        setPropertyCode(data.property)
      }
    }

    fetchPropertyCode()
  }, [propertyId])

  const handleTabClick = (index: number) => {
    const route = routes[index]
    if (route) {
      router.push(`/properties/${id}/${route}`)
    }
  }

  const handleDeleteProperty = async () => {
    const response = await fetch(`/api/properties/${id}/delete`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.has_leases) {
        toast.error('Cannot delete property', {
          description: data.message
        })
      } else {
        toast.error(data.error || 'Failed to delete property')
      }
      throw new Error(data.error)
    }

    toast.success('Property deleted successfully')
    router.push('/properties')
  }

  return (
    <>
      <section className={cn('flex flex-col gap-2.5 mb-2.5')}>
        <Breadcrumb
          items={[
            { label: 'Properties', href: '/properties' },
            { label: propertyCode }
          ]}
          isLoading={isPropertyCodeLoading}
          crumbSkeletonWidth='w-33'
        />

        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex items-center gap-2.5'>
            {isPropertyCodeLoading ? (
              <Skeleton className='w-12 h-12 rounded-full bg-neutral-300' />
            ) : (
              <span className='w-12 h-12 rounded-full overflow-hidden'>
                <Image
                  src={'/images/property-image-placeholder.png'}
                  height={48}
                  width={48}
                  alt='Property Placeholder'
                />
              </span>
            )}
            {isPropertyCodeLoading ? (
              <Skeleton className='h-7 w-40 bg-neutral-300' />
            ) : (
              <h1>{propertyCode}</h1>
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
              <DropdownMenuItem
                onClick={() => router.push(`/properties/${id}/edit`)}
              >
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={showUnderDevelopment}>
                Assign owner
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmationDialog
                openDialogButton={
                  <button type='button' className='delete-dropdown-button'>
                    Delete Property
                  </button>
                }
                title='Delete Property'
                description={
                  <>
                    Are you sure you want to delete{' '}
                    <strong>{propertyCode}</strong>? This action cannot be
                    undone. All associated data (rooms, views, configurations)
                    will be permanently removed.
                  </>
                }
                onConfirm={handleDeleteProperty}
                confirmButtonLabel='Delete'
                confirmButtonLoadingLabel='Deleting...'
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isPropertyCodeLoading ? (
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
      <ActionUnderDevelopmentOverlay />
    </>
  )
}

export default WithHeadSectionLayout
