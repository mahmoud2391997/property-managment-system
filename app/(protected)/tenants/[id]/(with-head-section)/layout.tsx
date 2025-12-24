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
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'
import EditTenantDialog from '@/components/dialogs/edit-tenant-dialog'

type TenantBasicInfo = {
  id: string
  type: 'Individual' | 'Company'
  profile_pic: string | null
  profile_thumb: string | null
  first_name?: string
  last_name?: string | null
  company_name?: string
  phone_number: string
  email: string
  accountStatus: 'Activated' | 'Pending'
  identity_type?: 'mykad' | 'passport'
  identity_number?: string
}

type Props = {
  children: React.ReactNode
}

const WithHeadSectionLayout = ({ children }: Props) => {
  const router = useRouter()
  const { id: tenantId } = useParams<{ id: string }>()
  const [tenantInfo, setTenantInfo] = useState<TenantBasicInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const routes = ['overview', 'leases']

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Overview',
      isSelected: lastSegment === routes[0] || lastSegment === tenantId
    },
    {
      label: 'Leases',
      isSelected: lastSegment === routes[1]
    }
  ])

  const fetchTenantInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tenants/${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setTenantInfo(data.tenant)
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch tenant basic info
  useEffect(() => {
    fetchTenantInfo()
  }, [tenantId])

  const handleEditSuccess = () => {
    fetchTenantInfo()
    router.refresh()
  }

  const handleTabClick = (index: number) => {
    const route = routes[index]
    if (route) {
      router.push(`/tenants/${tenantId}/${route}`)
    }
  }

  const handleDeleteTenant = async () => {
    const response = await fetch(`/api/tenants?id=${tenantId}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (!response.ok) {
      toast.error(data.error || 'Failed to delete tenant')
      throw new Error(data.error)
    }

    toast.success('Tenant deleted successfully')
    router.push('/tenants')
  }

  const handleResendInvite = async () => {
    try {
      const response = await fetch('/api/tenants/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend invitation')
      }

      toast.success('Invitation email sent successfully!')
    } catch (error: any) {
      toast.error('Failed to resend invitation')
    }
  }

  // Get display name based on tenant type
  const getDisplayName = () => {
    if (!tenantInfo) return ''
    if (tenantInfo.type === 'Individual') {
      return `${tenantInfo.first_name}${tenantInfo.last_name ? ` ${tenantInfo.last_name}` : ''}`
    }
    return tenantInfo.company_name || ''
  }

  const displayName = getDisplayName()

  return (
    <>
      <section className={cn('flex flex-col gap-2.5 mb-2.5')}>
        <Breadcrumb
          items={[
            { label: 'Tenants', href: '/tenants' },
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
              imgSrc={tenantInfo?.profile_thumb}
                name={displayName}
                size={48}
                className='texts-body-large-medium'
              />
          }
            {isLoading ? (
              <Skeleton className='h-7 w-40 bg-neutral-300' />
            ) : (
              <div className='flex flex-col gap-1'>
                <h2>{displayName}</h2>
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      tenantInfo?.accountStatus === 'Activated'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    )}
                  >
                    {tenantInfo?.accountStatus}
                  </span>
                </div>
              </div>
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
              {tenantInfo && (
                <EditTenantDialog
                  tenantId={tenantId}
                  initialData={tenantInfo}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Edit Tenant
                    </DropdownMenuItem>
                  }
                  onSuccess={handleEditSuccess}
                />
              )}
              <DropdownMenuSeparator />
              {tenantInfo?.phone_number && (
                <DropdownMenuItem
                  onClick={() => {
                    const whatsappUrl = buildWhatsAppLink(tenantInfo.phone_number)
                    window.open(whatsappUrl, '_blank')
                  }}
                >
                  WhatsApp {tenantInfo.first_name || 'Tenant'}
                </DropdownMenuItem>
              )}
              {tenantInfo?.email && (
                <DropdownMenuItem
                  onClick={() => {
                    const emailUrl = buildEmailLink(tenantInfo.email)
                    window.location.href = emailUrl
                  }}
                >
                  Email {tenantInfo.first_name || 'Tenant'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {tenantInfo?.phone_number && (
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(tenantInfo.phone_number)
                  }
                >
                  Copy phone number
                </DropdownMenuItem>
              )}
              {tenantInfo?.email && (
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(tenantInfo.email)
                  }
                >
                  Copy email
                </DropdownMenuItem>
              )}
              {tenantInfo?.accountStatus === 'Pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleResendInvite}>
                    Resend Invitation
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <ConfirmationDialog
                openDialogButton={
                  <button type='button' className='delete-dropdown-button'>
                    Delete Tenant
                  </button>
                }
                title='Delete Tenant'
                description={
                  <>
                    Are you sure you want to delete{' '}
                    <strong>{displayName}</strong>? This action cannot be
                    undone. All associated data will be permanently removed.
                  </>
                }
                onConfirm={handleDeleteTenant}
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
