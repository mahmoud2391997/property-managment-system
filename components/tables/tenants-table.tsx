'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, User, Phone, Mail, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'
import { useState } from 'react'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'
import { TenantWithDetails } from '@/lib/tenants-utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EditTenantDialog from '../dialogs/edit-tenant-dialog'

type TenantsTableProps = {
  data: TenantWithDetails[]
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
  onInviteSent?: (tenantId: string) => void
}

export default function TenantsTable ({
  data,
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage,
  onInviteSent
}: TenantsTableProps) {
  const hasServerPagination =
    onNextPage !== undefined || onPreviousPage !== undefined

  const columns: ColumnDef<TenantWithDetails>[] = [
    //Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false
    },

    {
      accessorKey: 'first_name',
      header: () => <div className='text-left'>Name</div>,
      cell: ({ row }) => {
        const tenant = row.original
        const fullName = `${tenant.first_name}${
          tenant.last_name ? ` ${tenant.last_name}` : ''
        }`

        return (
          <div className={cn('flex items-center gap-2', 'text-left')}>
            <UserAvatar
              imgSrc={tenant.profile_thumb}
              name={fullName}
              size={30}
              className='text-[11px]!'
            />
            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>{fullName}</span>
              <span className='texts-table-cell-secondary text-(--text-secondary)'>{tenant.email}</span>
            </div>
          </div>
        )
      }
    },

    {
      accessorKey: 'identity_number',
      header: () => <div className='text-left'>Identity No</div>,
      cell: ({ row }) => {
        const tenant = row.original

        return (
          <div className='flex flex-col'>
            <span className='text-left texts-table-cell-primary'>
              {tenant.identity_number || '-'}
            </span>
            <span className='text-left texts-table-cell-secondary text-(--text-secondary)'>
              {tenant.identity_type}
            </span>
          </div>
        )
      }
    },

    {
      accessorKey: 'accountStatus',
      header: () => <div className='text-left'>Account</div>,
      cell: ({ row }) => {
        const status = row.original.accountStatus || 'Pending'
        const statusKey = status.toLowerCase()
        const inviteSent = row.original.inviteSent

        return (
          <div className='texts-table-cell-primary text-left'>
            <div
              data-status={statusKey}
              className={cn(
                'status-styles',
                'data-[status=activated]:bg-green-100 data-[status=activated]:text-green-800',
                'data-[status=pending]:bg-yellow-100 data-[status=pending]:text-yellow-800'
              )}
            >
              {status}
              {status === 'Pending' && (
                <span className='ml-1 text-xs opacity-70'>
                  ({inviteSent ? 'Invited' : 'Not Invited'})
                </span>
              )}
            </div>
          </div>
        )
      }
    },

    {
      accessorKey: 'activeLeaseCount',
      header: () => <div className='text-left'>Rental</div>,
      cell: ({ row }) => {
        const count = row.original.activeLeaseCount || 0

        const getRentalStatus = (leaseCount: number) => {
          if (leaseCount === 0) return 'Not Renting'
          if (leaseCount === 1) return 'Renting'
          return `Renting (${leaseCount})`
        }

        const rentalStatus = getRentalStatus(count)
        const isRenting = count > 0

        return (
          <div className='texts-table-cell-primary text-left'>
            <div
              className={cn(
                'status-styles',
                isRenting
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              )}
            >
              {rentalStatus}
            </div>
          </div>
        )
      }
    },

    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const tenant = row.original
        const router = useRouter()
        const [isResending, setIsResending] = useState(false)
        const [isDeleting, setIsDeleting] = useState(false)

        const handleResendInvite = async () => {
          setIsResending(true)
          try {
            const response = await fetch('/api/tenants/resend-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId: tenant.id })
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || 'Failed to resend invitation')
            }

            toast.success('Invitation email sent successfully!')
            onInviteSent?.(tenant.id)
          } catch (error: any) {
            toast.error('Failed to resend invitation')
          } finally {
            setIsResending(false)
          }
        }

        const handleDelete = async () => {
          setIsDeleting(true)
          try {
            const response = await fetch(`/api/tenants?id=${tenant.id}`, {
              method: 'DELETE'
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || 'Failed to delete tenant')
            }

            toast.success('Tenant deleted successfully!')
            window.location.reload()
          } catch (error: any) {
            toast.error('Failed to delete tenant')
            setIsDeleting(false)
          }
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  const phoneNumber = tenant.phone_number || ''
                  if (phoneNumber) {
                    const whatsappUrl = buildWhatsAppLink(phoneNumber)
                    window.open(whatsappUrl, '_blank')
                  }
                }}
                className='gap-1'
              >
                WhatsApp{' '}
                <span className='font-semibold'>
                  {tenant.first_name.trim().split(' ')[0]}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const email = tenant.email || ''
                  if (email) {
                    const emailUrl = buildEmailLink(email)
                    window.location.href = emailUrl
                  }
                }}
                className='gap-1'
              >
                Email{' '}
                <span className='font-semibold'>
                  {tenant.first_name.trim().split(' ')[0]}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(tenant.phone_number || '')
                }
              >
                Copy phone number
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(tenant.email || '')
                }
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tenant.accountStatus === 'Pending' && (
                <DropdownMenuItem
                  onClick={handleResendInvite}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Invitation'}
                </DropdownMenuItem>
              )}
              <EditTenantDialog
                tenantId={tenant.id}
                initialData={{
                  id: tenant.id,
                  type: tenant.type,
                  profile_pic: tenant.profile_pic,
                  profile_thumb: tenant.profile_thumb,
                  first_name: tenant.first_name,
                  last_name: tenant.last_name,
                  identity_type: tenant.identity_type,
                  identity_number: tenant.identity_number,
                  phone_number: tenant.phone_number,
                  email: tenant.email,
                  accountStatus: tenant.accountStatus
                }}
                trigger={
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    Edit Tenant
                  </DropdownMenuItem>
                }
                onSuccess={() => window.location.reload()}
              />
              <Link href={`/tenants/${tenant.id}/overview`}>
                <DropdownMenuItem>View details</DropdownMenuItem>
              </Link>
              <ConfirmationDialog
                openDialogButton={
                  <button
                    type='button'
                    className='w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-accent rounded-sm cursor-default'
                  >
                    Delete Tenant
                  </button>
                }
                title='Delete Tenant'
                description={`Are you sure you want to delete ${
                  tenant.first_name
                }${
                  tenant.last_name ? ` ${tenant.last_name}` : ''
                }? This will permanently remove their account and all associated data.`}
                confirmationText='DELETE'
                onConfirm={handleDelete}
                loading={isDeleting}
                confirmButtonLabel='Delete Tenant'
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  // Mobile Card Component
  const TenantCard = ({ tenant }: { tenant: TenantWithDetails }) => {
    const router = useRouter()
    const [isResending, setIsResending] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const fullName = `${tenant.first_name}${
      tenant.last_name ? ` ${tenant.last_name}` : ''
    }`
    const statusKey = (tenant.accountStatus || 'Pending').toLowerCase()
    const leaseCount = tenant.activeLeaseCount || 0
    const rentalStatus =
      leaseCount === 0
        ? 'Not Renting'
        : leaseCount === 1
        ? 'Renting'
        : `Renting (${leaseCount})`
    const isRenting = leaseCount > 0

    const handleResendInvite = async () => {
      setIsResending(true)
      try {
        const response = await fetch('/api/tenants/resend-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenant.id })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to resend invitation')
        }

        toast.success('Invitation email sent successfully!')
        onInviteSent?.(tenant.id)
      } catch (error: any) {
        toast.error('Failed to resend invitation')
      } finally {
        setIsResending(false)
      }
    }

    const handleDelete = async () => {
      setIsDeleting(true)
      try {
        const response = await fetch(`/api/tenants?id=${tenant.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete tenant')
        }

        toast.success('Tenant deleted successfully!')
        window.location.reload()
      } catch (error: any) {
        toast.error('Failed to delete tenant')
        setIsDeleting(false)
      }
    }

    return (
      <div
        className={cn(
          'bg-(--background-primary) rounded-xl border border-(--border-default)',
          'p-4 space-y-3'
        )}
      >
        {/* Header: Avatar, Name, Status, Actions */}
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-3'>
            <UserAvatar
              imgSrc={tenant.profile_thumb}
              name={fullName}
              size={40}
              className='text-sm!'
            />

            <div>
              <div className='flex flex-col gap-1 flex-wrap'>
                <span className='texts-body-medium-semibold text-(--text-primary)'>
                  {fullName}
                </span>
                <div className='flex gap-1 w-full h-fit'>
                  <div
                    data-status={statusKey}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      'data-[status=activated]:bg-green-100 data-[status=activated]:text-green-800',
                      'data-[status=pending]:bg-yellow-100 data-[status=pending]:text-yellow-800'
                    )}
                  >
                    {tenant.accountStatus || 'Pending'}
                    {tenant.accountStatus === 'Pending' && (
                      <span className='ml-1 opacity-70'>
                        ({tenant.inviteSent ? 'Invited' : 'Not Invited'})
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      isRenting
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {rentalStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <MoreHorizontal strokeWidth={1.5} className='w-5 h-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  const phoneNumber = tenant.phone_number || ''
                  if (phoneNumber) {
                    const whatsappUrl = buildWhatsAppLink(phoneNumber)
                    window.open(whatsappUrl, '_blank')
                  }
                }}
                className='gap-1'
              >
                WhatsApp{' '}
                <span className='font-semibold'>
                  {tenant.first_name.trim().split(' ')[0]}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const email = tenant.email || ''
                  if (email) {
                    const emailUrl = buildEmailLink(email)
                    window.location.href = emailUrl
                  }
                }}
                className='gap-1'
              >
                Email{' '}
                <span className='font-semibold'>
                  {tenant.first_name.trim().split(' ')[0]}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(tenant.phone_number || '')
                }
              >
                Copy phone number
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(tenant.email || '')
                }
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tenant.accountStatus === 'Pending' && (
                <DropdownMenuItem
                  onClick={handleResendInvite}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Invitation'}
                </DropdownMenuItem>
              )}
              <EditTenantDialog
                tenantId={tenant.id}
                initialData={{
                  id: tenant.id,
                  type: tenant.type,
                  profile_pic: tenant.profile_pic,
                  profile_thumb: tenant.profile_thumb,
                  first_name: tenant.first_name,
                  last_name: tenant.last_name,
                  identity_type: tenant.identity_type,
                  identity_number: tenant.identity_number,
                  phone_number: tenant.phone_number,
                  email: tenant.email,
                  accountStatus: tenant.accountStatus
                }}
                trigger={
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    Edit Tenant
                  </DropdownMenuItem>
                }
                onSuccess={() => window.location.reload()}
              />
              <DropdownMenuItem
                onClick={() => router.push(`/tenants/${tenant.id}/overview`)}
              >
                View details
              </DropdownMenuItem>
              <ConfirmationDialog
                openDialogButton={
                  <button
                    type='button'
                    className='w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-accent rounded-sm cursor-default'
                  >
                    Delete Tenant
                  </button>
                }
                title='Delete Tenant'
                description={`Are you sure you want to delete ${fullName}? This will permanently remove their account and all associated data.`}
                confirmationText='DELETE'
                onConfirm={handleDelete}
                loading={isDeleting}
                confirmButtonLabel='Delete Tenant'
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info Grid */}
        <div className='grid grid-cols-1 gap-2'>
          {/* Identity */}
          <div className='flex items-center gap-2'>
            <IdCard className='w-4 h-4 text-(--text-secondary) shrink-0' />
            <div className='min-w-0 flex-1'>
              <span className='texts-body-small-medium text-(--text-primary)'>
                {tenant.identity_number || '-'}
              </span>
              <span className='texts-caption-small text-(--text-secondary) ml-2'>
                ({tenant.identity_type})
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className='flex items-center gap-2'>
            <Phone className='w-4 h-4 text-(--text-secondary) shrink-0' />
            <span className='texts-body-small-medium text-(--text-primary) truncate'>
              {tenant.phone_number || '-'}
            </span>
          </div>

          {/* Email */}
          <div className='flex items-center gap-2'>
            <Mail className='w-4 h-4 text-(--text-secondary) shrink-0' />
            <span className='texts-body-small-medium text-(--text-primary) truncate'>
              {tenant.email || '-'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          noPagnitation={hasServerPagination}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
          getRowId={row => row.id}
        />
        {hasServerPagination && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{' '}
              tenants
            </div>
            <div className='space-x-2'>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
                onClick={onNextPage}
                disabled={!canGoNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {isLoading ? (
          // Loading skeleton for mobile
          Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-xl border border-(--border-default) p-4 animate-pulse'
            >
              <div className='flex items-start gap-3 mb-3'>
                <div className='w-10 h-10 bg-gray-200 rounded-full' />
                <div className='flex-1'>
                  <div className='h-5 w-32 bg-gray-200 rounded mb-1' />
                  <div className='h-4 w-20 bg-gray-200 rounded-full' />
                </div>
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-40 bg-gray-200 rounded' />
                <div className='h-4 w-32 bg-gray-200 rounded' />
                <div className='h-4 w-48 bg-gray-200 rounded' />
              </div>
            </div>
          ))
        ) : data.length > 0 ? (
          data.map(tenant => <TenantCard key={tenant.id} tenant={tenant} />)
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No tenants found.
          </div>
        )}

        {/* Pagination controls for mobile */}
        {hasServerPagination && (
          <div className='flex flex-col gap-3 py-4'>
            <div className='text-center texts-caption-large text-(--text-secondary)'>
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{' '}
              tenants
            </div>
            <div className='flex justify-center gap-2'>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onNextPage}
                disabled={!canGoNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
