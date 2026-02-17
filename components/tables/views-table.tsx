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
import EditViewDialog from '../dialogs/edit-view-dialog'
import { cn } from '@/lib/utils'

const createColumns = (onRefresh?: () => void): ColumnDef<ViewWithProperty>[] => [
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
    accessorKey: 'viewed_at',
    header: () => <div className='text-left'>Viewed at</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          <TimestampWithTooltip timestamp={row.getValue('viewed_at')} />
        </div>
      )
    }
  },

  {
    accessorKey: 'conversion_status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('conversion_status') as string
      const statusKey = status.toLowerCase().replace(' ', '-')
      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=converted]:bg-green-100 data-[status=converted]:text-green-800',
              'data-[status=not-decided]:bg-neutral-100 data-[status=not-decided]:text-neutral-600',
              'data-[status=not-converted]:bg-red-100 data-[status=not-converted]:text-red-800'
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
            {view.conversion_status === 'Not Decided' && (
              <EditViewDialog
                view={view}
                onSuccess={onRefresh}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit View
                  </DropdownMenuItem>
                }
              />
            )}
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
  onRefresh?: () => void
}

export default function ViewsTable ({ data, className = '', noPagnitation = false, onRefresh }: Props) {
  const columns = createColumns(onRefresh)
  return <Table columns={columns} className={className} data={data} noPagnitation={noPagnitation} />
}
