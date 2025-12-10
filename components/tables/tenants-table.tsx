'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, MessageCircle } from 'lucide-react'
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
import { Prisma } from '@prisma/client'
import { useState } from 'react'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'


type TenantWithDetails = Prisma.tenantsGetPayload<{
  select: {
    id: true
    profile_thumb: true
    individual_tenants: {
      select: {
        identity_type: true
        identity_number: true
        first_name: true
        last_name: true
        phone_number: true
      }
    }
  }
}> & {
  email?: string
  accountStatus?: 'Activated' | 'Pending'
}

export const columns: ColumnDef<TenantWithDetails>[] = [
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
      const { individual_tenants, profile_thumb } = row.original
      const fullName = `${individual_tenants?.first_name}${individual_tenants?.last_name ? ` ${individual_tenants.last_name}` : ''}`

      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          {profile_thumb ? (
            <img
              src={profile_thumb}
              alt={fullName}
              className='w-[25px] h-[25px] rounded-full object-cover'
            />
          ) : (
            <UserAvatar name={fullName} size={25} className='text-[11px]!' />
          )}
          <span className='texts-table-cell-primary'>{fullName}</span>
        </div>
      )
    }
  },

  {
    accessorKey: 'identity_number',
    header: () => <div className='text-left'>Identity No</div>,
    cell: ({ row }) => {
      const { individual_tenants } = row.original

      return (
        <div className='flex flex-col'>
          <span className='text-left texts-table-cell-primary'>
            {individual_tenants?.identity_number || '-'}
          </span>
          <span className='text-left texts-table-cell-secondary text-(--text-secondary)'>
            {individual_tenants?.identity_type}
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

          alert('Invitation email sent successfully!')
        } catch (error: any) {
          alert(error.message || 'Failed to resend invitation')
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

          alert('Tenant deleted successfully!')
          router.refresh()
        } catch (error: any) {
          alert(error.message || 'Failed to delete tenant')
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
                const phoneNumber = tenant.individual_tenants?.phone_number || ''
                if (phoneNumber) {
                  const whatsappUrl = buildWhatsAppLink(phoneNumber)
                  window.open(whatsappUrl, '_blank')
                }
              }}
              className='gap-1'
            >
              WhatsApp <span className='font-semibold'>{tenant.individual_tenants?.first_name.trim().split(' ')[0]}</span>
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
              Email <span className='font-semibold'>{tenant.individual_tenants?.first_name.trim().split(' ')[0]}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tenant.individual_tenants?.phone_number || '')}
            >
              Copy phone number
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tenant.email || '')}
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
            <DropdownMenuItem>View details</DropdownMenuItem>
            <ConfirmationDialog
              openDialogButton={
                <button type='button' className='w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-accent rounded-sm cursor-default'>
                  Delete tenant
                </button>
              }
              title='Delete Tenant'
              description={`Are you sure you want to delete ${tenant.individual_tenants?.first_name}${tenant.individual_tenants?.last_name ? ` ${tenant.individual_tenants.last_name}` : ''}? This will permanently remove their account and all associated data.`}
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

type TenantsTableProps = {
  data: TenantWithDetails[]
}

export default function TenantsTable({ data }: TenantsTableProps) {
  return <Table columns={columns} data={data} />
}
