'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import DropdownMenu from '../costume-ui/dropdown-menu'
import {
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import Tooltip from '../costume-ui/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { toast } from 'sonner'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'

type StatusCount = {
  status: DisplayStatus
  count: number
  total: number
}

type PropertyWithDetails = {
  id: string
  code: string
  address: string
  project: string | null
  type: string
  status: string | StatusCount[]
  tenantPhone?: string | null
}

const statusStyles: Record<string, string> = {
  Occupied: 'bg-green-100 text-green-800',
  Under_Preparation: 'bg-yellow-100 text-yellow-800',
  Pending_Inspection: 'bg-orange-100 text-orange-800',
  Vacant: 'bg-gray-100 text-gray-800'
}

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
      const rawStatus = row.getValue('status') as string | StatusCount[]

      // If status is a string (single status)
      if (typeof rawStatus === 'string') {
        const displayStatus = rawStatus.replace(/_/g, ' ')
        return (
          <div className='texts-table-cell-primary text-left'>
            <div className={cn('status-styles', statusStyles[rawStatus])}>
              {displayStatus}
            </div>
          </div>
        )
      }

      // If status is an array (aggregated room statuses)
      return (
        <div className='texts-table-cell-primary text-left flex flex-wrap gap-1'>
          {rawStatus.map((item, index) => (
            <div
              key={index}
              className={cn('status-styles', statusStyles[item.status])}
            >
              {item.status.replace(/_/g, ' ')}({item.count}/{item.total})
            </div>
          ))}
        </div>
      )
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const property = row.original
      const rawStatus = property.status
      const isOccupied = typeof rawStatus === 'string' && rawStatus === 'Occupied'
      const canWhatsApp = isOccupied && property.tenantPhone
      const onDelete = (table.options.meta as any)?.onDeleteProperty

      const handleWhatsAppTenant = () => {
        if (property.tenantPhone) {
          const phoneNumber = property.tenantPhone.replace(/\D/g, '')
          window.open(`https://wa.me/${phoneNumber}`, '_blank')
        }
      }

      const handleDeleteProperty = async () => {
        const response = await fetch(`/api/properties/${property.id}/delete`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.has_leases) {
            toast.error('Cannot delete property', {
              description: data.message
            })
          } else {
            toast.error(data.error || 'Failed to delete property')
          }
          throw new Error(data.error)
        }

        toast.success('Property deleted successfully')
        onDelete?.()
      }

      return (
        <DropdownMenu label='Actions'>
          <Link href={`/properties/${property.id}/overview`}>
            <DropdownMenuItem>View Property</DropdownMenuItem>
          </Link>
          <Link href={`/properties/${property.id}/edit`}>
            <DropdownMenuItem>Edit Property</DropdownMenuItem>
          </Link>
          {canWhatsApp && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleWhatsAppTenant}>
                WhatsApp Tenant
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <ConfirmationDialog
            openDialogButton={
              <DropdownMenuItem
                onSelect={e => e.preventDefault()}
                className='text-error-main focus:text-error-main'
              >
                Delete Property
              </DropdownMenuItem>
            }
            title='Delete Property'
            description={
              <>
                Are you sure you want to delete{' '}
                <strong>{property.code}</strong>? This action cannot be
                undone. All associated data (rooms, views, configurations)
                will be permanently removed.
              </>
            }
            onConfirm={handleDeleteProperty}
            confirmButtonLabel='Delete'
            confirmButtonLoadingLabel='Deleting...'
          />
        </DropdownMenu>
      )
    }
  }
]

interface PropertiesTableProps {
  data: PropertyWithDetails[]
  onDeleteProperty?: () => void
}

export default function PropertiesTable ({ data, onDeleteProperty }: PropertiesTableProps) {
  return (
    <Table
      columns={columns}
      data={data}
      meta={{ onDeleteProperty }}
    />
  )
}
