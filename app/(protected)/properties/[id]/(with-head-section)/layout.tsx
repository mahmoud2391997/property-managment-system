'use client'
import React, { useEffect, useState } from 'react'
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
import { Property } from '@/types'
import { propertiesData } from '@/utils/data'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { useRouter, usePathname } from 'next/navigation'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { toast } from 'sonner'
import InitiatePreparationFlowDrawer from '@/components/dialogs/initiate-preparation-flow-drawer'
import AssignOwnerDialog from '@/components/dialogs/assign-owner-dialog'
import { usePermissions } from '@/hooks/use-permissions'

type Props = {
  children: React.ReactNode
}
const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()
  const { can } = usePermissions()

  const { id: propertyId } = useParams<{ id: string }>()
  const [propertyCode, setPropertyCode] = useState<string | null>(null)
  const [propertyStatus, setPropertyStatus] = useState<string | null>(null)
  const [propertyImages, setPropertyImages] = useState<{ id: string; image_url: string; thumb_url: string }[]>([])
  const [propertyOwnerId, setPropertyOwnerId] = useState<string | null>(null)
  const [hasActiveContract, setHasActiveContract] = useState<boolean>(false)
  const [isPropertyCodeLoading, setIsPropertyCodeLoading] =
    useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'rooms', 'views', 'bookings', 'leases', 'contracts']

  const params = useParams()
  const id = params.id as string
  const propertyData: Property | undefined = propertiesData.find(
    p => p.id === id
  )
  const TABS = [
    { label: 'Overview',  href: `/properties/${id}/overview`,  permission: 'properties.access' },
    { label: 'Rooms',     href: `/properties/${id}/rooms`,     permission: 'rooms.access' },
    { label: 'Views',     href: `/properties/${id}/views`,     permission: 'views.access' },
    { label: 'Bookings',  href: `/properties/${id}/bookings`,  permission: 'bookings.access' },
    { label: 'Leases',    href: `/properties/${id}/leases`,    permission: 'leases.access' },
    { label: 'Contracts', href: `/properties/${id}/contracts`, permission: 'contracts.access' },
  ]

  const filteredTabs = TABS.filter(t => can(t.permission))

  const {
    options: tabOptions,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption(filteredTabs.map((tab: any, index: number) => ({
    label: tab.label,
    isSelected: lastSegment === routes[TABS.indexOf(tab)]
  })))

  // Fetch property code, status, and images
  const fetchPropertyData = async () => {
    setIsPropertyCodeLoading(true)
    const response = await fetch(`/api/leases/${propertyId}/property-code`)
    if (response.ok) {
      setIsPropertyCodeLoading(false)
      const data = await response.json()
      setPropertyCode(data.property)
      setPropertyStatus(data.status)
      setPropertyImages(data.images || [])
      setPropertyOwnerId(data.assignedOwner?.id || null)
      setHasActiveContract(data.hasActiveContract || false)
    }
  }

  useEffect(() => {
    fetchPropertyData()
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
            <HeaderImage
              images={propertyImages}
              isLoading={isPropertyCodeLoading}
              alt='Property'
            />
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
              <AssignOwnerDialog
                propertyId={propertyId}
                currentOwnerId={propertyOwnerId}
                hasActiveContract={hasActiveContract}
                onSuccess={() => window.location.reload()}
                trigger={
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    {propertyOwnerId ? 'Change owner' : 'Assign owner'}
                  </DropdownMenuItem>
                }
              />
              {propertyStatus === 'Vacant' && (
                <InitiatePreparationFlowDrawer
                  propertyId={propertyId}
                  locationName={propertyCode || ''}
                  onSuccess={fetchPropertyData}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Mark as Not Ready
                    </DropdownMenuItem>
                  }
                />
              )}
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
            {tabOptions.map((_: any, index: number) => (
              <Skeleton key={index} className='h-5 w-16 bg-neutral-300' />
            ))}
          </div>
        ) : (
          <TabGroup>
            {tabOptions.map((tab: any, index: number) => (
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
