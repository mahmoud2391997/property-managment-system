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
import { ViewWithProperty } from '@/types'
import TimestampWithTooltip from '../costume-ui/timestamp-with-tooltip'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'

export const columns: ColumnDef<ViewWithProperty>[] = [
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
    accessorKey: 'reference_id',
    header: () => <div className='text-left'>View ID</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('reference_id')}</div>
    }
  },

  {
    id: 'name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const firstName = row.original.first_name
      const lastName = row.original.last_name
      const fullName = lastName ? `${firstName} ${lastName}` : firstName
      return <div className='text-left'>{fullName}</div>
    }
  },

  {
    accessorKey: 'created_at',
    header: () => <div className='text-left'>Viewed at</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          <TimestampWithTooltip timestamp={row.getValue('created_at')} />
        </div>
      )
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const view = row.original
      const firstName = view.first_name.trim().split(' ')[0]

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
              onClick={() => navigator.clipboard.writeText(view.reference_id)}
            >
              Copy view ID
            </DropdownMenuItem>
            {view.phone_number && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const whatsappUrl = buildWhatsAppLink(view.phone_number!)
                    window.open(whatsappUrl, '_blank')
                  }}
                  className='gap-1'
                >
                  WhatsApp <span className='font-semibold'>{firstName}</span>
                </DropdownMenuItem>
              </>
            )}
            {view.email && (
              <DropdownMenuItem
                onClick={() => {
                  const emailUrl = buildEmailLink(view.email!)
                  window.location.href = emailUrl
                }}
                className='gap-1'
              >
                Email <span className='font-semibold'>{firstName}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: ViewWithProperty[]
  className?: string
  noPagnitation?: boolean
}

export default function ViewsTable ({ data, className = '', noPagnitation = false }: Props) {
  return <Table columns={columns} className={className} data={data} noPagnitation={noPagnitation} />
}
