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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import { LeaseWithDetails } from '@/types'
import { UserAvatar } from '../costume-ui/name-avatar'
import { cn } from '@/lib/utils'

// Calculate end date from start_date + number_of_months, considering leave_day
function calculateEndDate(
  startDate: string,
  numberOfMonths: number | null,
  leaveDay: number | null
): string | null {
  if (numberOfMonths === null || leaveDay === null) {
    return null // Ongoing
  }

  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  endDate.setDate(leaveDay)

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

export const columns: ColumnDef<LeaseWithDetails>[] = [
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
        lease.number_of_months,
        lease.leave_day
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
          <span className='texts-table-cell-primary'>{fullName}</span>
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
            <DropdownMenuItem>View details</DropdownMenuItem>
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
}

export default function LeasesTable({
  data,
  className = '',
  noPagnitation = false
}: Props) {
  return (
    <Table
      columns={columns}
      className={className}
      data={data}
      noPagnitation={noPagnitation}
    />
  )
}
