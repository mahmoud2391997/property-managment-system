'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
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
import { Tenant } from '@/types'
import { tenantsData } from '@/utils/data'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'

export const columns: ColumnDef<Tenant>[] = [
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
    accessorKey: 'tenant_name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const { tenant_picture, tenant_name } = row.original
      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar name={tenant_name} size={25} className='text-[11px]!' />
          <span className='texts-table-cell-primary'>{tenant_name}</span>
        </div>
      )
    }
  },

  {
    accessorKey: 'identity_no',
    header: () => <div className='text-left'>Identity No</div>,
    cell: ({ row }) => {
      const { identity_no } = row.original

      return (
        <div className='text-left texts-table-cell-data'>{identity_no}</div>
      )
    }
  },

  {
    accessorKey: 'phone_no',
    header: () => <div className='text-left'>Phone No</div>,
    cell: ({ row }) => {
      const { phone_no } = row.original

      return <div className='text-left texts-table-cell-data'>{phone_no}</div>
    }
  },

  {
    accessorKey: 'email',
    header: () => <div className='text-left'>Email</div>,
    cell: ({ row }) => {
      const { email } = row.original

      return <div className='text-left texts-table-cell-data'>{email}</div>
    }
  },

  {
    accessorKey: 'account_status',
    header: () => <div className='text-left'>Acount</div>,
    cell: ({ row }) => {
      const { account_status } = row.original
      const rawStatus: Tenant['account_status'] = account_status // e.g., "Under Preparation"
      const statusKey = rawStatus.toLowerCase().replace(/\s/g, '-') // "under-preparation"

      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=activated]:bg-green-100 data-[status=activated]:text-green-800',
              'data-[status=pending-activation]:bg-yellow-100 data-[status=pending-activation]:text-yellow-800'
            )}
          >
            {account_status}
          </div>
        </div>
      )
    }
  },

  {
    accessorKey: 'rental_status',
    header: () => <div className='text-left'>Rental</div>,
    cell: ({ row }) => {
      const { rental_status } = row.original
      const rawStatus: Tenant['rental_status'] = rental_status // e.g., "Under Preparation"
      const statusKey = rawStatus.toLowerCase().replace(/\s/g, '-') // "under-preparation"

      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=renting]:bg-green-100 data-[status=renting]:text-green-800',
              'data-[status=booking]:bg-blue-100 data-[status=booking]:text-blue-800',
              'data-[status=pending-refund]:bg-yellow-100 data-[status=pending-refund]:text-yellow-800',
              'data-[status=not-renting]:bg-gray-100 data-[status=not-renting]:text-gray-800'
            )}
          >
            {rental_status}
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
      const property = row.original

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
              onClick={() => navigator.clipboard.writeText(property.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export default function TenantsTable () {
  return <Table columns={columns} data={tenantsData} />
}
