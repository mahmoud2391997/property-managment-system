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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import { BookingWithTenant } from '@/types'
import { UserAvatar } from '../costume-ui/name-avatar'
import { formatDate } from '@/utils/formatTime'
import { cn } from '@/lib/utils'

const columns: ColumnDef<BookingWithTenant>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' as const : false
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
    accessorKey: 'reference_id',
    header: () => <div className='text-left'>Booking ID</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('reference_id')}</div>
    }
  },

  {
    id: 'tenant',
    header: () => <div className='text-left'>Tenant</div>,
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className='flex items-center gap-2 text-left'>
          <UserAvatar
            name={booking.tenant_name}
            imgSrc={booking.tenant_profile_thumb}
            size={28}
          />
          <span>{booking.tenant_name}</span>
        </div>
      )
    }
  },

  {
    accessorKey: 'move_in_date',
    header: () => <div className='text-left'>Move-in Date</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          {formatDate(row.getValue('move_in_date'))}
        </div>
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusKey = status.toLowerCase()
      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=current]:bg-blue-100 data-[status=current]:text-blue-800',
              'data-[status=converted]:bg-green-100 data-[status=converted]:text-green-800',
              'data-[status=cancelled]:bg-red-100 data-[status=cancelled]:text-red-800'
            )}
          >
            {status}
          </div>
        </div>
      )
    }
  },

  {
    id: 'lease',
    header: () => <div className='text-left'>Lease</div>,
    cell: ({ row }) => {
      const leaseRef = row.original.lease_reference_id
      return (
        <div className='text-left text-sm'>
          {leaseRef ? (
            <span className='text-(--text-primary)'>{leaseRef}</span>
          ) : (
            <span className='text-(--text-secondary)'>—</span>
          )}
        </div>
      )
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const booking = row.original

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
              onClick={() => navigator.clipboard.writeText(booking.reference_id)}
            >
              Copy booking ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: BookingWithTenant[]
  className?: string
  noPagnitation?: boolean
}

export default function BookingsTable ({ data, className = '', noPagnitation = false }: Props) {
  return <Table columns={columns} className={className} data={data} noPagnitation={noPagnitation} />
}
