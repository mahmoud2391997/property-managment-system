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
import { RoomWithProperty } from '@/types'
import Link from 'next/link'

export const columns: ColumnDef<RoomWithProperty>[] = [
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
      const rawStatus: RoomWithProperty['status'] = row.getValue('status') // e.g., "Under Preparation"

      const displayStatus = rawStatus.replace(/_/g, ' ')

      const statusStyles: Record<string, string> = {
        Occupied: 'bg-green-100 text-green-800',
        Under_Preparation: 'bg-yellow-100 text-yellow-800',
        Pending_Inspection: 'bg-orange-100 text-orange-800',
        Vacant: 'bg-gray-100 text-gray-800',
        Property_Rented: 'bg-blue-100 text-blue-800'
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
    cell: ({ row }) => {
      const room = row.original

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
              onClick={() => navigator.clipboard.writeText(room.id)}
            >
              Copy room ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/rooms/${room.id}/overview`}>View room details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit room</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: RoomWithProperty[]
  className?: string
  noPagnitation?: boolean
}

export default function RoomsTable ({
  data,
  className = '',
  noPagnitation = false
}: Props) {
  return (
    <Table
      columns={columns}
      className={className}
      data={data}
      noPagnitation={noPagnitation}
    />
  )
}
