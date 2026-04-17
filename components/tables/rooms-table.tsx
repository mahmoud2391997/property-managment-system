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
import FeaturesDisplay from '../costume-ui/features-display'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import InitiatePreparationFlowDrawer from '../dialogs/initiate-preparation-flow-drawer'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'

type RoomFeatures = {
  wifi?: boolean
  cleaning_service?: boolean
  toilet?: boolean
  balcony?: boolean
  ac?: boolean
  female?: boolean
}

type RoomTableData = {
  id: string
  title: string
  propertyId: string | null
  property: string
  project?: string | null
  status:
    | 'Occupied'
    | 'Vacant'
    | 'Pending_Inspection'
    | 'Under_Preparation'
    | 'Property_Rented'
    | 'Property_Not_Ready'
  isBooked: string | null
  tenantPhone?: string | null
  features?: RoomFeatures
}

const getColumns = ({
  canUpdate,
  canDelete,
  canCreateLease
}: {
  canUpdate: boolean
  canDelete: boolean
  canCreateLease: boolean
}): ColumnDef<RoomTableData>[] => [
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
      const room = row.original
      const content = <>
      <div>{row.getValue('property')}</div>
          {room.project && (
            <div className='text-xs text-(--text-secondary)'>
              {room.project}
            </div>
          )}
      </>
      return (
        room.propertyId ?
        <Link href={`/properties/${room.propertyId}/overview`} className='text-left hover:underline'>
          {content}
        </Link>
        :
        <div className='text-left'>
          {content}
        </div>
      )
    }
  },

  {
    accessorKey: 'features',
    header: () => <div className='text-left'>Features</div>,
    cell: ({ row }) => {
      const room = row.original
      return (
        <FeaturesDisplay
          features={room.features || {}}
          maxVisible={3}
        />
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const rawStatus: RoomTableData['status'] = row.getValue('status') // e.g., "Under_Preparation"
      const { isBooked } = row.original

      const displayStatus = rawStatus.replace(/_/g, ' ')

      const statusStyles: Record<string, string> = {
        Occupied: 'bg-green-100 text-green-800',
        Under_Preparation: 'bg-yellow-100 text-yellow-800',
        Pending_Inspection: 'bg-orange-100 text-orange-800',
        Vacant: 'bg-gray-100 text-gray-800',
        Property_Rented: 'bg-blue-100 text-blue-800',
        Property_Not_Ready: 'bg-red-100 text-red-800',
        Booked: 'bg-blue-100 text-blue-800'
      }
      return (
        <div className='texts-table-cell-primary text-left flex flex-wrap gap-1'>
          <div className={cn('status-styles', statusStyles[rawStatus])}>
            {displayStatus}
          </div>
          {isBooked && (
            <div className={cn('status-styles', statusStyles['Booked'])}>
              {isBooked}
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
      const room = row.original
      const canWhatsApp =
        (room.status === 'Occupied' || room.status === 'Property_Rented') &&
        room.tenantPhone
      const onDelete = (table.options.meta as any)?.onDeleteRoom
      const canAddLease = room.status === 'Vacant'
      const isVacant = room.status === 'Vacant'

      const handleWhatsAppTenant = () => {
        if (room.tenantPhone) {
          const phoneNumber = room.tenantPhone.replace(/\D/g, '')
          window.open(`https://wa.me/${phoneNumber}`, '_blank')
        }
      }

      const handleDeleteRoom = async () => {
        const response = await fetch(`/api/rooms/${room.id}/delete`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.has_leases) {
            toast.error('Cannot delete room', {
              description: data.message
            })
          } else {
            toast.error(data.error || 'Failed to delete room')
          }
          throw new Error(data.error)
        }

        toast.success('Room deleted successfully')
        onDelete?.()
      }

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
            <DropdownMenuItem asChild>
              <Link href={`/rooms/${room.id}/overview`}>View room details</Link>
            </DropdownMenuItem>
            {canUpdate && (
              <Link href={`/rooms/${room.id}/edit`}>
                <DropdownMenuItem>Edit room</DropdownMenuItem>
              </Link>
            )}
            {canAddLease && canCreateLease && (
              <Link href={`/rooms/${room.id}/leases/add-lease`}>
                <DropdownMenuItem>Add Lease</DropdownMenuItem>
              </Link>
            )}
            {isVacant && canUpdate && (
              <InitiatePreparationFlowDrawer
                roomId={room.id}
                locationName={`${room.property} - ${room.title}`}
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
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <ConfirmationDialog
                  openDialogButton={
                    <button type='button' className='delete-dropdown-button'>
                      Delete Room
                    </button>
                  }
                  title='Delete Room'
                  description={
                    <>
                      Are you sure you want to delete <strong>{room.title}</strong>?
                      This action cannot be undone. All associated data (views,
                      configurations) will be permanently removed.
                    </>
                  }
                  onConfirm={handleDeleteRoom}
                  confirmButtonLabel='Delete'
                  confirmButtonLoadingLabel='Deleting...'
                />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: RoomTableData[]
  className?: string
  noPagnitation?: boolean
  onDeleteRoom?: () => void
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
}

export default function RoomsTable ({
  data,
  className = '',
  noPagnitation = false,
  onDeleteRoom,
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage
}: Props) {
  const { can } = usePermissions()
  const hasServerPagination =
    onNextPage !== undefined || onPreviousPage !== undefined

  return (
    <div>
      <Table
        columns={getColumns({
          canUpdate: can('rooms.update'),
          canDelete: can('rooms.delete'),
          canCreateLease: can('leases.create')
        })}
        className={className}
        data={data}
        noPagnitation={hasServerPagination || noPagnitation}
        meta={{ onDeleteRoom }}
        isLoadingRows={isLoading}
        loadingRowsCount={pageSize}
      />
      {hasServerPagination && (
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-muted-foreground flex-1 text-sm'>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} rooms
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
