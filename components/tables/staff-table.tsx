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
import { Staff } from '@/types'
import { staffData } from '@/utils/data'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'

export const columns: ColumnDef<Staff>[] = [
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
    accessorKey: 'staff_name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const { staff_picture, staff_name } = row.original
      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar name={staff_name} size={25} className='text-[11px]!' />
          <span className='texts-table-cell-primary'>{staff_name}</span>
        </div>
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
    accessorKey: 'role',
    header: () => <div className='text-left'>Role</div>,
    cell: ({ row }) => {
      const { role } = row.original

      return <div className='text-left texts-table-cell-data'>{role}</div>
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

export default function OwnersTable () {
  return (
    <Table columns={columns} data={staffData} />
  )
}
