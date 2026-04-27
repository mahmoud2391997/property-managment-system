'use client'
import React, { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
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
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'
import EditOwnerDialog from '@/components/dialogs/edit-owner-dialog'
import { PermissionGate } from '@/components/permission-gate'

type OwnerBasicInfo = {
  id: string
  first_name: string
  last_name: string | null
  phone_number: string
  email: string | null
  profile_pic: string | null
  profile_thumb: string | null
}

type Props = {
  children: React.ReactNode
}

const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()
  const { id: ownerId } = useParams<{ id: string }>()
  const [ownerInfo, setOwnerInfo] = useState<OwnerBasicInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'contracts']

  const { can } = usePermissions()

  const allTabs = [
    { label: 'Overview', route: routes[0], permission: 'owners.access' },
    { label: 'Contracts', route: routes[1], permission: 'contracts.access' }
  ]

  const visibleTabs = allTabs.filter(t => can(t.permission))

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption(
    visibleTabs.map(t => ({
      label: t.label,
      isSelected: lastSegment === t.route || (lastSegment === ownerId && t.route === 'overview')
    }))
  )

  const fetchOwnerInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/owners/${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setOwnerInfo(data.owner)
      }
    } catch (error) {
      console.error('Error fetching owner info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOwnerInfo()
  }, [ownerId])

  const handleEditSuccess = () => {
    fetchOwnerInfo()
    router.refresh()
  }

  const handleTabClick = (index: number) => {
    const route = visibleTabs[index]?.route
    if (route) {
      router.push(`/owners/${ownerId}/${route}`)
    }
  }

  const getDisplayName = () => {
    if (!ownerInfo) return ''
    return `${ownerInfo.first_name}${ownerInfo.last_name ? ` ${ownerInfo.last_name}` : ''}`
  }

  const displayName = getDisplayName()

  return (
    <>
      <section className={cn('flex flex-col gap-2.5 mb-2.5')}>
        <Breadcrumb
          items={[
            { label: 'Owners', href: '/owners' },
            { label: displayName }
          ]}
          isLoading={isLoading}
          crumbSkeletonWidth='w-33'
        />

        <div className={cn('flex justify-between items-center', 'w-full')}>
          <div className='flex items-center gap-2.5'>
            {isLoading ? (
              <Skeleton className='w-12 h-12 rounded-full bg-neutral-300' />
            ) :
              <UserAvatar
                imgSrc={ownerInfo?.profile_thumb}
                name={displayName}
                size={48}
                className='texts-body-large-medium'
              />
            }
            {isLoading ? (
              <Skeleton className='h-7 w-40 bg-neutral-300' />
            ) : (
              <h2>{displayName}</h2>
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
              <PermissionGate permission='owners.update'>
                {ownerInfo && (
                  <EditOwnerDialog
                    ownerId={ownerId}
                    initialData={ownerInfo}
                    trigger={
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>
                        Edit Owner
                      </DropdownMenuItem>
                    }
                    onSuccess={handleEditSuccess}
                  />
                )}
              </PermissionGate>
              <DropdownMenuSeparator />
              {ownerInfo?.phone_number && (
                <DropdownMenuItem
                  onClick={() => {
                    const whatsappUrl = buildWhatsAppLink(ownerInfo.phone_number)
                    window.open(whatsappUrl, '_blank')
                  }}
                >
                  WhatsApp {ownerInfo.first_name || 'Owner'}
                </DropdownMenuItem>
              )}
              {ownerInfo?.email && (
                <DropdownMenuItem
                  onClick={() => {
                    const emailUrl = buildEmailLink(ownerInfo.email!)
                    window.location.href = emailUrl
                  }}
                >
                  Email {ownerInfo.first_name || 'Owner'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {ownerInfo?.phone_number && (
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(ownerInfo.phone_number)
                  }
                >
                  Copy phone number
                </DropdownMenuItem>
              )}
              {ownerInfo?.email && (
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(ownerInfo.email!)
                  }
                >
                  Copy email
                </DropdownMenuItem>
              )}
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
