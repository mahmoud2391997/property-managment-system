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
import { LeaseWithDetails } from '@/types'
import { UserAvatar } from '../costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { showFeedbackToast } from '../costume-ui/feedback-toast'
import Link from 'next/link'

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
      return (
        <div className='text-left'>
          {formatCurrency(row.getValue('monthly_rent'))}
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
                <DropdownMenuItem>Schedule rental change</DropdownMenuItem>
              </>
            )}
            {canEndLease && (
              <>
                <DropdownMenuSeparator />
                <ConfirmationDialog
                  openDialogButton={
                    <button type='button' className='delete-dropdown-button'>
                      End Lease
                    </button>
                  }
                  title='End Lease'
                  description={
                    <div className='space-y-3'>
                      <p>
                        You are about to{' '}
                        <strong>permanently end this lease</strong>. This action
                        is <strong>irreversible</strong> and will:
                      </p>
                      <ul className='list-disc list-inside space-y-1 text-sm'>
                        <li>
                          Change the lease status to <strong>Ended</strong>
                        </li>
                        <li>Cancel all pending payments linked to this lease</li>
                        <li>Stop any recurring payment schedules</li>
                        <li>Close all tickets linked to this lease</li>
                      </ul>
                      <p className='text-sm text-neutral-500'>
                        This cannot be undone. Please make sure all outstanding
                        payments have been collected before proceeding.
                      </p>
                    </div>
                  }
                  confirmationText='END'
                  confirmButtonLabel='End Lease'
                  confirmButtonLoadingLabel='Ending...'
                  confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
                  inputLabel='Type END to confirm'
                  variant='warning'
                  onConfirm={async () => {
                    const response = await fetch(`/api/leases/end/${lease.id}`, {
                      method: 'POST'
                    })
                    if (!response.ok) {
                      const data = await response.json()
                      showFeedbackToast({
                        title: 'Failed to end lease',
                        description: data.error || 'Please try again.',
                        type: 'error'
                      })
                      throw new Error(data.error)
                    }
                    showFeedbackToast({
                      title: 'Lease ended successfully',
                      description: 'All pending payments have been cancelled.',
                      type: 'success'
                    })
                    onDataRefresh?.()
                  }}
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
