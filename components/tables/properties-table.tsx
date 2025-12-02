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
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { PropertyWithDetails } from '@/types'

export const columns: ColumnDef<PropertyWithDetails>[] = [
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
      const rawStatus: PropertyWithDetails['status'] = row.getValue('status')
      const displayStatus = rawStatus.replace(/_/g, ' ')

      const statusStyles: Record<string, string> = {
        Occupied: 'bg-green-100 text-green-800',
        Under_Preparation: 'bg-yellow-100 text-yellow-800',
        Pending_Inspection: 'bg-orange-100 text-orange-800',
        Vacant: 'bg-gray-100 text-gray-800'
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
      const property = row.original

      return (
        <DropdownMenu label='Actions'>
          <Link href={`/properties/${property.id}/overview`}>
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
  data: PropertyWithDetails[]
}

export default function PropertiesTable ({ data }: PropertiesTableProps) {
  return <Table columns={columns} data={data} />
}
