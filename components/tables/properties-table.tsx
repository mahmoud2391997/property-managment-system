'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import DropdownMenu from '../costume-ui/dropdown-menu'
import {
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import Tooltip from '../costume-ui/tooltip'
import FeaturesDisplay from '../costume-ui/features-display'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import InitiatePreparationFlowDrawer from '../dialogs/initiate-preparation-flow-drawer'
import { toast } from 'sonner'

type DisplayStatus =
  | 'Occupied'
  | 'Vacant'
  | 'Pending_Inspection'
  | 'Under_Preparation'

type StatusCount = {
  status: DisplayStatus
  count: number
  total: number
}

type PropertyFeatures = {
  wifi?: boolean
  cleaning_service?: boolean
  female?: boolean
}

type PropertyWithDetails = {
  id: string
  code: string
  address: string
  project: string | null
  type: string
  status: string | StatusCount[]
  isBooked: boolean
  tenantPhone?: string | null
  features?: PropertyFeatures
}

const statusStyles: Record<string, string> = {
  Occupied: 'bg-green-100 text-green-800',
  Under_Preparation: 'bg-yellow-100 text-yellow-800',
  Pending_Inspection: 'bg-orange-100 text-orange-800',
  Vacant: 'bg-gray-100 text-gray-800',
  Booked: 'bg-blue-100 text-blue-800'
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
    accessorKey: 'features',
    header: () => <div className='text-left'>Features</div>,
    cell: ({ row }) => {
      const property = row.original
      return (
        <FeaturesDisplay
          features={property.features || {}}
          maxVisible={3}
        />
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const rawStatus = row.getValue('status') as string | StatusCount[]
      const { isBooked } = row.original

      // If status is a string (single status)
      if (typeof rawStatus === 'string') {
        const displayStatus = rawStatus.replace(/_/g, ' ')
        return (
          <div className='texts-table-cell-primary text-left grid grid-cols-[repeat(3,max-content)] gap-1'>
            <div className={cn('status-styles', statusStyles[rawStatus])}>
              {displayStatus}
            </div>
            {isBooked && (
              <div className={cn('status-styles', statusStyles['Booked'])}>
                Booked
              </div>
            )}
          </div>
        )
      }

      // If status is an array (aggregated room statuses)
      return (
        <div className='texts-table-cell-primary text-left grid grid-cols-[repeat(3,max-content)] gap-1'>
          {rawStatus.map((item, index) => (
            <div
              key={index}
              className={cn('status-styles', statusStyles[item.status])}
            >
              {item.status.replace(/_/g, ' ')}({item.count}/{item.total})
            </div>
          ))}
          {isBooked && (
            <div className={cn('status-styles', statusStyles['Booked'])}>
              Booked
            </div>
          )}
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
      const isOccupied =
        typeof rawStatus === 'string' && rawStatus === 'Occupied'
      const canWhatsApp = isOccupied && property.tenantPhone
      const onDelete = (table.options.meta as any)?.onDeleteProperty
      const isVacant = typeof rawStatus === 'string' && rawStatus === 'Vacant'
      const canAddLease = isVacant

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
          {canAddLease && (
            <Link href={`/properties/${property.id}/leases/add-lease`}>
              <DropdownMenuItem>Add Lease</DropdownMenuItem>
            </Link>
          )}
          {isVacant && (
            <InitiatePreparationFlowDrawer
              propertyId={property.id}
              locationName={property.code}
              onSuccess={onDelete}
              trigger={
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  Mark as Not Ready
                </DropdownMenuItem>
              }
            />
          )}
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
              <button
                type='button'
                className='delete-dropdown-button'
              >
                Delete Property
              </button>
            }
            title='Delete Property'
            description={
              <>
                Are you sure you want to delete <strong>{property.code}</strong>
                ? This action cannot be undone. All associated data (rooms,
                views, configurations) will be permanently removed.
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
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
}

export default function PropertiesTable ({
  data,
  onDeleteProperty,
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage
}: PropertiesTableProps) {
  const hasServerPagination =
    onNextPage !== undefined || onPreviousPage !== undefined

  return (
    <div>
      <Table
        columns={columns}
        data={data}
        meta={{ onDeleteProperty }}
        noPagnitation={hasServerPagination}
        isLoadingRows={isLoading}
        loadingRowsCount={pageSize}
      />
      {hasServerPagination && (
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-muted-foreground flex-1 text-sm'>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{' '}
            properties
          </div>
          <div className='space-x-2'>
            <button
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
              onClick={onPreviousPage}
              disabled={!canGoPrevious || isLoading}
            >
              Previous
            </button>
            <button
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
              onClick={onNextPage}
              disabled={!canGoNext || isLoading}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
