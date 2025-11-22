'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
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
import { Ticket } from '@/types'
import { ticketsData } from '@/utils/data'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'
import Tooltip from '../costume-ui/tooltip'
import { formatTimestamp } from '@/utils/formatTime'

export const columns: ColumnDef<Ticket>[] = [
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
    accessorKey: 'type',
    header: () => <div className='text-left'>Ticket</div>,
    cell: ({ row }) => {
      const { id, type } = row.original

      return (
        <div>
          <div className='text-left texts-table-cell-primary'>{'#' + id}</div>
          <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
            {type}
          </div>
        </div>
      )
    }
  },

  {
    accessorKey: 'title',
    header: () => <div className='text-left'>Details</div>,
    cell: ({ row }) => {
      const { title, description } = row.original

      return (
        <div>
          <span className='texts-table-cell-primary'>{title}</span>
          <Tooltip
            content={description}
            maxWidth='200px'
            className='texts-table-cell-secondary text-(--text-secondary)'
          >
            {description}
          </Tooltip>
        </div>
      )
    }
  },

  {
    accessorKey: 'property',
    header: () => <div className='text-left'>Property</div>,
    cell: ({ row }) => {
      const { property, room } = row.original

      return (
        <div>
          <div className='text-left texts-table-cell-primary'>{property}</div>
          <div className='text-left texts-table-cell-secondary'>{room}</div>
        </div>
      )
    }
  },

  {
    accessorKey: 'tenant_name',
    header: () => {
      return <div className='text-left'>Issued by</div>
    },
    cell: ({ row }) => {
      const { tenant_name, tenant_picture, issue_timestamp } = row.original
      return (
        <div className='flex items-end mt-2'>
          <div className={cn('flex items-center gap-[5]', 'text-left')}>
            <UserAvatar name={tenant_name} size={30} />

            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>{tenant_name}</span>
              <span className='texts-caption-large text-(--text-secondary)'>
                {formatTimestamp(issue_timestamp)}
              </span>
            </div>
          </div>
        </div>
      )
    }
  },

  {
    accessorKey: 'staff_name',
    header: () => {
      return <div className='text-left'>Assigned to</div>
    },
    cell: ({ row }) => {
      const { staff_name, staff_picture, assignment_timestamp } = row.original

      if (!staff_name) return <span className='text-left'>—</span>
      return (
        <div className='flex items-end mt-2'>
          <div className={cn('flex items-center gap-[5]', 'text-left')}>
            <UserAvatar name={staff_name} size={30} />

            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>{staff_name}</span>
              <span className='texts-caption-large text-(--text-secondary)'>
                {formatTimestamp(assignment_timestamp)}
              </span>
            </div>
          </div>
        </div>
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const { status } = row.original
      const rawStatus: Ticket['status'] = status // e.g., "Under Preparation"
      const statusKey = rawStatus.toLowerCase().replace(/\s/g, '-') // "under-preparation"

      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=resolved]:bg-green-100 data-[status=resolved]:text-green-800',
              'data-[status=open]:bg-gray-100 data-[status=open]:text-gray-800',
              'data-[status=closed]:bg-blue-100 data-[status=closed]:text-blue-800',
              'data-[status=in-progress]:bg-yellow-100 data-[status=in-progress]:text-yellow-800',
              'data-[status=pending-tenant-confirmation]:bg-orange-100 data-[status=pending-tenant-confirmation]:text-orange-800'
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
  return <Table columns={columns} data={ticketsData} />
}
