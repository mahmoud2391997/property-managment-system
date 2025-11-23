'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import DropdownMenu from '../costume-ui/dropdown-menu'
import {
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import Tooltip from '../costume-ui/tooltip'
import { Property } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const columns: ColumnDef<Property>[] = [
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
    accessorKey: 'code',
    header: () => {
      return <div className='text-left'>Code/Title</div>
    },
    cell: ({ row }) => {
      const { code, address } = row.original
      return (
        <div>
          <span className='texts-table-cell-primary'>{code}</span>
          <Tooltip
            content={address}
            maxWidth='200px'
            className='texts-table-cell-secondary text-(--text-secondary)'
          >
            {address}
          </Tooltip>
        </div>
      )
    }
  },

  {
    accessorKey: 'project',
    header: () => <div className='text-left'>Project</div>,
    cell: ({ row }) => {
      return (
        <Tooltip
          content={row.getValue('project')}
          maxWidth='150px'
          className='texts-table-cell-secondary text-(--text-secondary)'
        >
          {row.getValue('project')}
        </Tooltip>
      )
    }
  },

  {
    accessorKey: 'type',
    header: () => <div className='text-left'>Type</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('type')}</div>
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const rawStatus: Property['status'] = row.getValue('status') // e.g., "Under Preparation"
      const statusKey = rawStatus.toLowerCase().replace(/\s/g, '-') // "under-preparation"

      return (
        <div className='texts-table-cell-primary text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=occupied]:bg-green-100 data-[status=occupied]:text-green-800',
              'data-[status=under-preparation]:bg-yellow-100 data-[status=under-preparation]:text-yellow-800',
              'data-[status=pending-inspection]:bg-orange-100 data-[status=pending-inspection]:text-orange-800',
              'data-[status=vacant]:bg-gray-100 data-[status=vacant]:text-gray-800',
              'data-[status=property-rented]:bg-blue-100 data-[status=property-rented]:text-blue-800'
            )}
          >
            {row.getValue('status')}
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
        <DropdownMenu label='Actions'>
          <Link href={`/properties/${property.id}`}>
            <DropdownMenuItem>View Property</DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(property.id)}
          >
            Edit Property
          </DropdownMenuItem>
        </DropdownMenu>
      )
    }
  }
]

interface PropertiesTableProps {
  data: Property[]
}

export default function PropertiesTable ({ data }: PropertiesTableProps) {
  return <Table columns={columns} data={data} />
}
