'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Clock, TrendingUp, TrendingDown } from 'lucide-react'

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
import { LeaseWithDetails } from '@/types'
import { UserAvatar } from '../costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import InitiateLeaseEndingDrawer from '../dialogs/initiate-lease-ending-drawer'
import ScheduleRentalChangeDialog from '../dialogs/schedule-rental-change-dialog'
import RentalHistoryDialog from '../dialogs/rental-history-dialog'
import { showFeedbackToast } from '../costume-ui/feedback-toast'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

// Calculate end date from start_date + number_of_months (end date has same day as start date)
function calculateEndDate(
  startDate: string,
  numberOfMonths: number | null
): string | null {
  if (numberOfMonths === null) {
    return null // Ongoing
  }

  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)

  return endDate.toISOString()
}

// Format date to display format
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format currency
function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const createColumns = (
  onDataRefresh?: () => void
): ColumnDef<LeaseWithDetails>[] => [
  // Checkbox
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
    header: () => <div className='text-left'>Lease ID</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('reference_id')}</div>
    }
  },

  {
    accessorKey: 'start_date',
    header: () => <div className='text-left'>Start Date</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          {formatDate(row.getValue('start_date'))}
        </div>
      )
    }
  },

  {
    id: 'end_date',
    header: () => <div className='text-left'>End Date</div>,
    cell: ({ row }) => {
      const lease = row.original
      const endDate = calculateEndDate(
        lease.start_date,
        lease.number_of_months
      )

      return (
        <div className='text-left'>
          {endDate ? formatDate(endDate) : 'Ongoing'}
        </div>
      )
    }
  },

  {
    id: 'tenant',
    header: () => <div className='text-left'>Tenant</div>,
    cell: ({ row }) => {
      const { tenant } = row.original
      const fullName = tenant.last_name
        ? `${tenant.first_name} ${tenant.last_name}`
        : tenant.first_name

      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar
            name={fullName}
            imgSrc={tenant.profile_thumb || undefined}
            size={25}
            className='text-[11px]!'
          />
          <Link href={`/tenants/${tenant.id}/overview`} className='texts-table-cell-primary hover:underline'>{fullName}</Link>
        </div>
      )
    }
  },

  {
    accessorKey: 'monthly_rent',
    header: () => <div className='text-left'>Rental</div>,
    cell: ({ row }) => {
      const lease = row.original
      const scheduledChange = lease.scheduled_change
      const currentRent = row.getValue('monthly_rent') as number

      // Only show scheduled change indicator if rent hasn't already changed
      // (i.e., current rent doesn't match the new scheduled rent)
      const showScheduledChange = scheduledChange &&
        Math.abs(currentRent - scheduledChange.new_rent) > 0.01

      if (showScheduledChange && scheduledChange) {
        const isIncrease = scheduledChange.new_rent > scheduledChange.old_rent
        const effectiveDate = new Date(scheduledChange.effective_from)
        const effectiveMonth = effectiveDate.toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric'
        })

        return (
          <div className='flex items-center gap-2 text-left'>
            <span>{formatCurrency(currentRent)}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs'>
                    <Clock className='h-3 w-3' />
                    {isIncrease ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-xs'>
                  <p className='text-sm'>
                    Rental changing to{' '}
                    <span className='font-medium'>
                      {formatCurrency(scheduledChange.new_rent)}
                    </span>{' '}
                    from {effectiveMonth}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      }

      return (
        <div className='text-left'>
          {formatCurrency(currentRent)}
        </div>
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const status: LeaseWithDetails['status'] = row.getValue('status')
      const statusKey = status.toLowerCase()

      return (
        <div className='texts-table-cell-primary text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=current]:bg-green-100 data-[status=current]:text-green-800',
              'data-[status=scheduled]:bg-blue-100 data-[status=scheduled]:text-blue-800',
              'data-[status=expired]:bg-yellow-100 data-[status=expired]:text-yellow-800',
              'data-[status=ended]:bg-red-100 data-[status=ended]:text-red-800'
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
      const lease = row.original
      const canEndLease = lease.status === 'Current'
      const isEnded = lease.status === 'Ended'

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
              onClick={() => navigator.clipboard.writeText(lease.reference_id)}
            >
              Copy lease ID
            </DropdownMenuItem>
            {!isEnded && (
              <>
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit lease</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Rental</DropdownMenuLabel>
            {canEndLease && (
              <ScheduleRentalChangeDialog
                leaseId={lease.id}
                onSuccess={onDataRefresh}
                trigger={
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    Schedule rental change
                  </DropdownMenuItem>
                }
              />
            )}
            <RentalHistoryDialog
              leaseId={lease.id}
              trigger={
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  View rental history
                </DropdownMenuItem>
              }
            />
            {canEndLease && (
              <>
                <DropdownMenuSeparator />
                <InitiateLeaseEndingDrawer
                  leaseId={lease.id}
                  propertyName={lease.property?.code || 'Property'}
                  unitName={lease.room?.title}
                  tenantName={lease.tenant.last_name
                    ? `${lease.tenant.first_name} ${lease.tenant.last_name}`
                    : lease.tenant.first_name}
                  onSuccess={onDataRefresh}
                  trigger={
                    <button type='button' className='delete-dropdown-button'>
                      End Lease
                    </button>
                  }
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
  data: LeaseWithDetails[]
  className?: string
  noPagnitation?: boolean
  onDataRefresh?: () => void
}

export default function LeasesTable({
  data,
  className = '',
  noPagnitation = false,
  onDataRefresh
}: Props) {
  const columns = createColumns(onDataRefresh)

  return (
    <Table
      columns={columns}
      className={className}
      data={data}
      noPagnitation={noPagnitation}
    />
  )
}
