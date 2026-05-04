'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, MessageCircle, Pencil } from 'lucide-react'
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
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'
import { useUser } from '@/contexts/user-context'
import EditStaffDialog from '@/components/dialogs/edit-staff-dialog'

type StaffWithRole = Prisma.staffGetPayload<{
  select: {
    id: true
    staff_id: true
    first_name: true
    last_name: true
    phone_number: true
    role_id: true
    profile_thumb: true
    roles: {
      select: {
        title: true
      }
    }
  }
}> & {
  email?: string
  accountStatus?: 'Activated' | 'Pending'
}

export const columns: ColumnDef<StaffWithRole>[] = [
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
    accessorKey: 'staff_id',
    header: () => <div className='text-left'>Staff ID</div>,
    cell: ({ row }) => {
      const { staff_id } = row.original

      return <div className='text-left texts-table-cell-data'>{staff_id}</div>
    }
  },

  {
    accessorKey: 'first_name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const { first_name, last_name, profile_thumb } = row.original
      const fullName = `${first_name}${last_name ? ` ${last_name}` : ''}`
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
    accessorKey: 'roles',
    header: () => <div className='text-left'>Role</div>,
    cell: ({ row }) => {
      const { roles } = row.original

      return (
        <div className='text-left texts-table-cell-data'>{roles.title}</div>
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
      const staff = row.original
      const router = useRouter()
      const { can } = usePermissions()
      const { role: currentUserRole } = useUser()
      const [isResending, setIsResending] = useState(false)
      const [isDeleting, setIsDeleting] = useState(false)
      const [editingStaff, setEditingStaff] = useState<{
        id: string
        firstName: string
        lastName: string | null
        phoneNumber: string
        roleId: string
        isOwner: boolean
      } | null>(null)

      const isTargetOwner = (staff as any).roles?.title === 'Owner'
      const canEditStaff = can('staff.update') && (!isTargetOwner || currentUserRole === 'Owner')

      const handleResendInvite = async () => {
        setIsResending(true)
        try {
          const response = await fetch('/api/staff/resend-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: staff.id })
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to resend invitation')
          }

          toast.success('Invitation email sent successfully!')
        } catch (error: any) {
          toast.error(error.message || 'Failed to resend invitation')
        } finally {
          setIsResending(false)
        }
      }

      const handleDelete = async () => {
        setIsDeleting(true)
        try {
          const response = await fetch(`/api/staff?id=${staff.id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to delete staff')
          }

          toast.success('Staff member deleted successfully!')
          router.refresh()
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete staff')
          setIsDeleting(false)
        }
      }

      return (
        <>
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
                  const phoneNumber = staff.phone_number || ''
                  if (phoneNumber) {
                    const whatsappUrl = buildWhatsAppLink(phoneNumber)
                    window.open(whatsappUrl, '_blank')
                  }
                }}
                className='gap-1'
              >
                WhatsApp <span className='font-semibold'>{staff.first_name.trim().split(' ')[0]}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const email = staff.email || ''
                  if (email) {
                    const emailUrl = buildEmailLink(email)
                    window.location.href = emailUrl
                  }
                }}
                className='gap-1'
              >
                Email <span className='font-semibold'>{staff.first_name.trim().split(' ')[0]}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(staff.phone_number || '')}
              >
                Copy phone number
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(staff.email || '')}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {staff.accountStatus === 'Pending' && (
                <DropdownMenuItem
                  onClick={handleResendInvite}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Invitation'}
                </DropdownMenuItem>
              )}
              {canEditStaff && (
                <DropdownMenuItem onClick={() => setEditingStaff({
                  id: staff.id,
                  firstName: staff.first_name || '',
                  lastName: staff.last_name || null,
                  phoneNumber: staff.phone_number || '',
                  roleId: staff.role_id || '',
                  isOwner: isTargetOwner
                })}>
                  <Pencil size={14} /> Edit staff
                </DropdownMenuItem>
              )}
              {can('staff.delete') && (
                <ConfirmationDialog
                  openDialogButton={
                    <button className='w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-accent rounded-sm cursor-default'>
                      Delete staff
                    </button>
                  }
                  title='Delete Staff Member'
                  description={`Are you sure you want to delete ${staff.first_name}${staff.last_name ? ` ${staff.last_name}` : ''}? This will permanently remove their account and all associated data.`}
                  confirmationText='DELETE'
                  onConfirm={handleDelete}
                  loading={isDeleting}
                  confirmButtonLabel='Delete Staff'
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {editingStaff && (
            <EditStaffDialog
              staff={editingStaff}
              onOpenChange={(open) => { if (!open) setEditingStaff(null) }}
            />
          )}
        </>
      )
    }
  }
]

type StaffTableProps = {
  data: StaffWithRole[]
  currentUserId?: string
}

export default function StaffTable ({ data, currentUserId }: StaffTableProps) {
  // Create columns with access to currentUserId
  const columnsWithUserId: ColumnDef<StaffWithRole>[] = columns.map(column => {
    // Check if this is the name column by checking if it has accessorKey
    const col = column as any
    if (col.accessorKey === 'first_name') {
      return {
        ...column,
        cell: ({ row }) => {
          const { id, first_name, last_name, profile_thumb } = row.original
          const fullName = `${first_name}${last_name ? ` ${last_name}` : ''}`
          const isCurrentUser = id === currentUserId

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
              <span className='texts-table-cell-primary'>
                {fullName}
                {isCurrentUser && <strong> (You)</strong>}
              </span>
            </div>
          )
        }
      }
    }
    return column
  })

  return <Table columns={columnsWithUserId} data={data} />
}
