'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { Table } from '../costume-ui/table'
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
import Tooltip from '../costume-ui/tooltip'
import { Project } from '@/types'

export const columns: ColumnDef<Project>[] = [
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
  //Name
  {
    accessorKey: 'name',
    header: () => {
      return <div className='text-left'>Name</div>
    },
    cell: ({ row }) => (
      <Tooltip content={row.getValue('name')}>
  {row.getValue('name')}
</Tooltip>

    )
  },
  //State
  {
    accessorKey: 'state',
    header: () => <div className='text-left'>State</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>{row.getValue('state')}</div>
      )
    }
  },
  //Property count
  {
    accessorKey: 'property_count',
    header: () => <div className='text-left'>Property Count</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          {row.getValue('property_count')}
        </div>
      )
    }
  },
  //Actions
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const project = row.original

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
              onClick={() => navigator.clipboard.writeText(project.id)}
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

interface ProjectsTableProps {
  data: Project[]
}

export default function ProjectsTable ({ data }: ProjectsTableProps) {
  return (
    <Table columns={columns} data={data} />
  )
}
