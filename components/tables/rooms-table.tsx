'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

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
import Link from 'next/link'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { toast } from 'sonner'

type RoomTableData = {
  id: string
  title: string
  property: string
  status:
    | 'Occupied'
    | 'Vacant'
    | 'Pending_Inspection'
    | 'Under_Preparation'
    | 'Property_Rented'
    | 'Property_Not_Ready'
  tenantPhone?: string | null
}

export const columns: ColumnDef<RoomTableData>[] = [
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
    accessorKey: 'title',
    header: () => <div className='text-left'>Title</div>,
    cell: ({ row }) => {
      const room = row.original
      return (
        <Link
          href={`/rooms/${room.id}/overview`}
          className='text-left hover:underline hover:text-primary-main transition-colors'
        >
          {row.getValue('title')}
        </Link>
      )
    }
  },

  {
    accessorKey: 'property',
    header: () => <div className='text-left'>Property</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('property')}</div>
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const rawStatus: RoomTableData['status'] = row.getValue('status') // e.g., "Under_Preparation"

      const displayStatus = rawStatus.replace(/_/g, ' ')

      const statusStyles: Record<string, string> = {
        Occupied: 'bg-green-100 text-green-800',
        Under_Preparation: 'bg-yellow-100 text-yellow-800',
        Pending_Inspection: 'bg-orange-100 text-orange-800',
        Vacant: 'bg-gray-100 text-gray-800',
        Property_Rented: 'bg-blue-100 text-blue-800',
        Property_Not_Ready: 'bg-red-100 text-red-800'
      }
      return (
        <div className='texts-table-cell-primary text-left'>
          <div className={cn('status-styles', statusStyles[rawStatus])}>
            {displayStatus}
          </div>
        </div>
      )
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const room = row.original
      const canWhatsApp =
        (room.status === 'Occupied' || room.status === 'Property_Rented') &&
        room.tenantPhone
      const onDelete = (table.options.meta as any)?.onDeleteRoom

      const handleWhatsAppTenant = () => {
        if (room.tenantPhone) {
          const phoneNumber = room.tenantPhone.replace(/\D/g, '')
          window.open(`https://wa.me/${phoneNumber}`, '_blank')
        }
      }

      const handleDeleteRoom = async () => {
        const response = await fetch(`/api/rooms/${room.id}/delete`, {
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
        onDelete?.()
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
            <DropdownMenuItem asChild>
              <Link href={`/rooms/${room.id}/overview`}>View room details</Link>
            </DropdownMenuItem>
            <Link href={`/rooms/${room.id}/edit`}>
              <DropdownMenuItem>Edit room</DropdownMenuItem>
            </Link>
            {canWhatsApp && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleWhatsAppTenant}>
                  WhatsApp Tenant
                </DropdownMenuItem>
              </>
            )}
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
                  <strong>{room.title}</strong>? This action cannot be
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
      )
    }
  }
]

type Props = {
  data: RoomTableData[]
  className?: string
  noPagnitation?: boolean
  onDeleteRoom?: () => void
}

export default function RoomsTable ({
  data,
  className = '',
  noPagnitation = false,
  onDeleteRoom
}: Props) {
  return (
    <Table
      columns={columns}
      className={className}
      data={data}
      noPagnitation={noPagnitation}
      meta={{ onDeleteRoom }}
    />
  )
}
