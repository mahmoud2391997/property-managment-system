'use client'

import * as React from 'react'
import {
  ColumnDef
} from '@tanstack/react-table'
import { MoreHorizontal, Building2, User, Calendar } from 'lucide-react'
import Link from 'next/link'
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
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'
import Tooltip from '../costume-ui/tooltip'
import TimestampWithTooltip from '../costume-ui/timestamp-with-tooltip'
import MobileCardContainer from '../costume-ui/mobile-card-container'

export const columns: ColumnDef<Ticket>[] = [
  //Checkbox
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' as const : false
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
      const { id, ticket_id, type } = row.original

      return (
        <div>
          <Link
            href={`/tickets/${ticket_id}`}
            className='text-left texts-table-cell-primary text-blue-600 hover:text-blue-800 hover:underline'
          >
            {'#' + id}
          </Link>
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
              <TimestampWithTooltip
                timestamp={issue_timestamp}
                className='texts-caption-large text-(--text-secondary)'
              />
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
              <TimestampWithTooltip
                timestamp={assignment_timestamp}
                className='texts-caption-large text-(--text-secondary)'
              />
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
              'data-[status=closed]:bg-red-100 data-[status=closed]:text-red-800',
              'data-[status=in-progress]:bg-blue-100 data-[status=in-progress]:text-blue-800',
              'data-[status=pending-tenant-confirmation]:bg-yellow-100 data-[status=pending-tenant-confirmation]:text-yellow-800'
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
      const ticket = row.original

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
              onClick={() => navigator.clipboard.writeText(ticket.id)}
            >
              Copy ticket ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket.ticket_id}`}>View ticket details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: Ticket[]
  onDataRefresh?: () => void
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
}

// Mobile Card Component
const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const statusKey = ticket.status.toLowerCase().replace(/\s/g, '-')

  return (
    <MobileCardContainer>
      {/* Header: ID, Status, Actions */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Link
              href={`/tickets/${ticket.ticket_id}`}
              className='texts-body-medium-semibold text-blue-600 hover:text-blue-800 hover:underline'
            >
              #{ticket.id}
            </Link>
            <div
              data-status={statusKey}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                'data-[status=resolved]:bg-green-100 data-[status=resolved]:text-green-800',
                'data-[status=open]:bg-gray-100 data-[status=open]:text-gray-800',
                'data-[status=closed]:bg-red-100 data-[status=closed]:text-red-800',
                'data-[status=in-progress]:bg-blue-100 data-[status=in-progress]:text-blue-800',
                'data-[status=pending-tenant-confirmation]:bg-yellow-100 data-[status=pending-tenant-confirmation]:text-yellow-800'
              )}
            >
              {ticket.status}
            </div>
          </div>
          <span className='texts-caption-large text-(--text-secondary)'>{ticket.type}</span>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <MoreHorizontal strokeWidth={1.5} className='w-5 h-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
              Copy ticket ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tickets/${ticket.ticket_id}`}>View ticket details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & Description */}
      <div>
        <p className='texts-body-medium-medium text-(--text-primary) mb-1'>{ticket.title}</p>
        <p className='texts-caption-large text-(--text-secondary) line-clamp-2'>{ticket.description}</p>
      </div>

      {/* Info Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Property */}
        <div className='flex items-start gap-2'>
          <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
          <div className='min-w-0'>
            <div className='texts-caption-small text-(--text-secondary)'>Property</div>
            <div className='texts-body-small-medium text-(--text-primary) truncate'>{ticket.property}</div>
            <div className='texts-caption-small text-(--text-secondary) truncate'>{ticket.room}</div>
          </div>
        </div>

        {/* Issued Date */}
        <div className='flex items-start gap-2'>
          <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
          <div className='min-w-0'>
            <div className='texts-caption-small text-(--text-secondary)'>Issued</div>
            <TimestampWithTooltip
              timestamp={ticket.issue_timestamp}
              className='texts-body-small-medium text-(--text-primary)'
            />
          </div>
        </div>
      </div>

      {/* Issued By / Assigned To */}
      <div className='pt-2 border-t border-(--border-default)'>
        <div className='flex items-center justify-between'>
          {/* Issued By */}
          <div className='flex items-center gap-2'>
            <User className='w-4 h-4 text-(--text-secondary)' />
            <div className='flex items-center gap-1.5'>
              <UserAvatar name={ticket.tenant_name} size={24} />
              <span className='texts-caption-large text-(--text-primary)'>{ticket.tenant_name}</span>
            </div>
          </div>

          {/* Assigned To */}
          {ticket.staff_name && (
            <div className='flex items-center gap-1.5'>
              <span className='texts-caption-small text-(--text-secondary)'>→</span>
              <UserAvatar name={ticket.staff_name} size={24} />
              <span className='texts-caption-large text-(--text-primary)'>{ticket.staff_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* View Details Button */}
      <Link
        href={`/tickets/${ticket.ticket_id}`}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5',
          'text-sm font-medium text-(--text-secondary)',
          'bg-(--background-secondary) hover:bg-neutral-200/70',
          'rounded-lg transition-colors'
        )}
      >
        View Details
      </Link>
    </MobileCardContainer>
  )
}

export default function TicketsTable({
  data,
  onDataRefresh,
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage
}: Props) {
  const hasServerPagination = onNextPage !== undefined || onPreviousPage !== undefined

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          noPagnitation={hasServerPagination}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
        />
        {hasServerPagination && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} tickets
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

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {isLoading ? (
          // Loading skeleton for mobile
          Array.from({ length: pageSize }).map((_, i) => (
            <MobileCardContainer key={i}>
              <div className='animate-pulse space-y-3'>
                <div className='flex justify-between'>
                  <div className='h-5 w-24 bg-gray-200 rounded' />
                  <div className='h-5 w-16 bg-gray-200 rounded-full' />
                </div>
                <div className='h-4 w-32 bg-gray-100 rounded' />
                <div className='h-4 w-full bg-gray-100 rounded' />
                <div className='grid grid-cols-2 gap-3'>
                  <div className='h-12 bg-gray-100 rounded' />
                  <div className='h-12 bg-gray-100 rounded' />
                </div>
              </div>
            </MobileCardContainer>
          ))
        ) : data.length > 0 ? (
          data.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No tickets found.
          </div>
        )}

        {/* Pagination controls for mobile */}
        {hasServerPagination && (
          <div className='flex flex-col gap-3 py-4'>
            <div className='text-center texts-caption-large text-(--text-secondary)'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} tickets
            </div>
            <div className='flex justify-center gap-2'>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onNextPage}
                disabled={!canGoNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
